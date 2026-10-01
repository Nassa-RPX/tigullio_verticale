import { createHash } from "node:crypto";

export const MIGRATION_ID = "program-events-v2";
export const STATE_ID = "migration-program-events-v2";
export const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const plainText = (body) =>
  (body || []).map((block) => (block.children || []).map((span) => span.text || "").join("")).join("\n");
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => !["_rev", "_createdAt", "_updatedAt", "_system"].includes(key))
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
export function groupHash(parent, children) {
  return hash(canonical([parent, ...children.slice().sort((a, b) => a._id.localeCompare(b._id))]));
}
export const logicalId = (id) => id.replace(/^drafts\./, "");
export function assertTarget(projectId, dataset, apply = false, productionAuthorized = false) {
  if (projectId !== "879g27iz" || !["staging", "main"].includes(dataset))
    throw new Error("Explicit project 879g27iz and dataset staging/main required.");
  if (dataset === "main" && !productionAuthorized)
    throw new Error("main is locked: an explicit production authorization is required before any access.");
  if (apply && dataset === "main" && productionAuthorized !== true)
    throw new Error("Production application is locked.");
}
export function restoreOperations(source, current, recorded, changedIds) {
  return [...new Set(changedIds)].map((id) => {
    const actual = current.find((doc) => doc._id === id),
      previous = recorded.find((doc) => doc._id === id);
    if (actual?._rev !== previous?._rev)
      throw new Error(`Changed since migration; preserve edits before rollback: ${id}`);
    const original = source.find((doc) => doc._id === id);
    return { id, original, actual };
  });
}
function block(text, key, style = "normal") {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-span`, text, marks: [] }],
  };
}
function combinedBody(parent, child, useParent = true) {
  const body = structuredClone(useParent ? parent.body || [] : []);
  if (child && child._id !== parent._id) {
    if (child.title !== parent.title && child.body?.length)
      body.push(block(child.title, `heading-${logicalId(child._id)}`, "h3"));
    body.push(...structuredClone(child.body || []));
  }
  for (const [name, doc] of [
    ["parent", useParent ? parent : null],
    ["child", child],
  ]) {
    if (!doc) continue;
    const notes = [
      doc.subtitle,
      doc.timeInfo,
      doc.info,
      ...Object.entries(doc.practicalInfo || {}).map(([key, value]) => `${key}: ${value}`),
    ].filter(Boolean);
    if (notes.length) body.push(block(notes.join("\n"), `notes-${name}-${logicalId(doc._id)}`));
    if (doc.leaders?.length) body.push(block(doc.leaders.join("\n"), `leaders-${name}-${logicalId(doc._id)}`));
  }
  const seen = new Set();
  return body.map((item, index) => {
    if (!item._key || seen.has(item._key)) item._key = `merged-${index}-${hash(item).slice(0, 10)}`;
    seen.add(item._key);
    return item;
  });
}
function ref(id) {
  return { _type: "reference", _ref: id };
}
export function transform(source, decisions) {
  const existingState = source.find((doc) => doc._id === STATE_ID);
  if (existingState?.status === "complete") {
    if (source.some((doc) => doc._type === "appuntamento" || (doc._type === "event" && doc.schemaVersion !== 2)))
      throw new Error("New legacy documents exist after completion; prepare a new migration.");
    return { documents: [], retireIds: [], routes: existingState.routes || [], warnings: [], complete: true };
  }
  if (source.some((doc) => doc._id.startsWith("versions.")))
    throw new Error("Content Releases require an explicit version mapping before migration.");
  const parents = source.filter((doc) => doc._type === "appuntamento" && !doc._id.startsWith("drafts."));
  const documents = [],
    retireIds = [],
    routes = [],
    warnings = [],
    people = new Map();
  const sourceMap = new Map(source.map((doc) => [doc._id, doc]));
  const mapped = new Set();
  const participant = (person, index) => {
    const [name, label] = Array.isArray(person) ? person : [person, ""];
    const id = `person-${hash(name.trim().toLocaleLowerCase("it")).slice(0, 20)}`;
    const collision = sourceMap.get(id);
    if (collision && (collision._type !== "person" || collision.name !== name))
      throw new Error(`Person ID collision: ${id}`);
    people.set(id, { _id: id, _type: "person", name });
    return {
      _type: "participation",
      _key: `person-${index}-${id.slice(-8)}`,
      person: ref(id),
      ...(label ? { label } : {}),
    };
  };
  function makeEvent(parent, child, settings, id, slug, useParent = true) {
    const kind = settings.kind;
    if (!["walk", "meeting", "series"].includes(kind)) throw new Error(`Unknown kind: ${id}`);
    const body = combinedBody(parent, child, useParent);
    const summarySource =
      settings.summary ||
      (useParent ? parent.subtitle || plainText(parent.body) : child?.subtitle || plainText(child?.body));
    const summary = summarySource?.split("\n")[0]?.trim();
    if (!summary) throw new Error(`Summary requires editorial content: ${id}`);
    const output = {
      _id: id,
      _type: "event",
      schemaVersion: 2,
      kind,
      program: ref(parent.programYear?._ref),
      title: settings.title || (useParent ? parent.title : child.title).trim(),
      slug: { _type: "slug", current: slug },
      date: parent.date,
      location: child?.location || parent.location,
      summary,
      body,
      ...(settings.startTime ? { startTime: settings.startTime } : {}),
      ...(settings.endTime ? { endTime: settings.endTime } : {}),
      ...([parent.partners, child?.partners].filter(Boolean).length
        ? { partners: [...new Set([parent.partners, child?.partners].filter(Boolean))].join("\n") }
        : {}),
      migration: { id: MIGRATION_ID, sourceIds: [...new Set([parent._id, child?._id].filter(Boolean))], warnings: [] },
    };
    const booking = {
      _type: "booking",
      required: !!child?.requiredPrenotation,
      ...structuredClone(settings.booking || {}),
    };
    if (booking.contact) booking.contact._type = "bookingContact";
    if (kind === "walk")
      output.walk = {
        _type: "walk",
        ...structuredClone(settings.walk || {}),
        guides: (settings.guides || []).map(participant),
      };
    if (kind === "meeting") output.meeting = { _type: "meeting", speakers: (settings.speakers || []).map(participant) };
    if (kind !== "series") output.booking = booking;
    if (kind !== "series" && !output.startTime) output.migration.warnings.push("Orario di inizio non disponibile.");
    if (kind === "walk" && !output.walk.meetingPoint)
      output.migration.warnings.push("Punto di ritrovo non disponibile.");
    if (kind === "walk" && !output.walk.guides.length) output.migration.warnings.push("Guide non disponibili.");
    if (kind === "meeting" && !output.meeting.speakers.length)
      output.migration.warnings.push("Relatori non disponibili.");
    return output;
  }
  function migrateGroup(parent, children, decision, draft = false) {
    const prefix = draft ? "drafts." : "";
    const mode = decision.mode;
    const targets = [],
      anchors = [];
    const settingsFor = (child) => decision.activities?.[logicalId(child?._id || parent._id)] || decision;
    if (mode === "series") {
      const id = `${prefix}event-migrated-${hash(logicalId(parent._id)).slice(0, 24)}`;
      const output = makeEvent(parent, null, { ...decision, kind: "series" }, id, parent.slug.current);
      output.series = {
        _type: "series",
        bookingMode: children.some((child) => child.requiredPrenotation) ? "sessions" : "none",
        meetings: children.map((child, index) => {
          const settings = settingsFor(child),
            key = `meeting-${logicalId(child._id)}`;
          anchors.push({
            _key: `anchor-${index}`,
            oldId: logicalId(child._id),
            targetId: logicalId(id),
            meetingKey: key,
          });
          return {
            _type: "seriesMeeting",
            _key: key,
            title: child.title,
            body: combinedBody(parent, child, false),
            ...(!child.body?.length && child.info ? { legacyInfo: child.info } : {}),
            ...(settings.startTime ? { startTime: settings.startTime } : {}),
            ...(settings.endTime ? { endTime: settings.endTime } : {}),
            location: child.location || parent.location,
            speakers: (settings.speakers || []).map(participant),
            booking: {
              _type: "booking",
              required: !!child.requiredPrenotation,
              ...settings.booking,
              ...(settings.booking?.contact
                ? { contact: { _type: "bookingContact", ...settings.booking.contact } }
                : {}),
            },
          };
        }),
      };
      for (const child of children)
        if (!child.body?.length) output.migration.warnings.push(`Descrizione da completare: ${child.title}`);
      if (!children.length) output.migration.warnings.push("Elenco dei singoli incontri non disponibile.");
      output.migration.sourceIds.push(...children.map((child) => child._id));
      documents.push(output);
      targets.push(logicalId(id));
    } else if (mode === "split") {
      for (const [index, child] of children.entries()) {
        const settings = settingsFor(child);
        const output = makeEvent(
          parent,
          child,
          settings,
          `${prefix}${logicalId(child._id)}`,
          child.slug.current,
          false,
        );
        // Shared presentation remains available on each activity; no source blocks are discarded.
        output.body = combinedBody(parent, child, true);
        if (settings.kind === "series") {
          output.series = { _type: "series", bookingMode: "none", meetings: [] };
          output.migration.warnings.push("Elenco dei singoli incontri non disponibile.");
        }
        documents.push(output);
        targets.push(logicalId(output._id));
        anchors.push({ _key: `anchor-${index}`, oldId: logicalId(child._id), targetId: logicalId(output._id) });
      }
    } else if (mode === "single" && children.length <= 1) {
      const child = children[0],
        settings = settingsFor(child);
      const id = `${prefix}${child ? logicalId(child._id) : `event-migrated-${hash(logicalId(parent._id)).slice(0, 24)}`}`;
      const output = makeEvent(parent, child, settings, id, parent.slug.current);
      documents.push(output);
      targets.push(logicalId(id));
      if (child) anchors.push({ _key: "anchor-0", oldId: logicalId(child._id), targetId: logicalId(id) });
    } else throw new Error(`Invalid grouping: ${parent._id}`);
    const retainedIds = new Set(documents.map((doc) => doc._id));
    for (const doc of [parent, ...children]) {
      mapped.add(doc._id);
      if (!retainedIds.has(doc._id)) retireIds.push(doc._id);
    }
    if (!draft)
      routes.push({
        _key: `route-${logicalId(parent._id)}`,
        year: sourceMap.get(parent.programYear._ref)?.year,
        slug: parent.slug.current,
        title: parent.title.trim(),
        targetIds: targets,
        anchors,
      });
  }
  for (const parent of parents) {
    const children = source
      .filter((doc) => doc._type === "event" && doc.date?._ref === parent._id && !doc._id.startsWith("drafts."))
      .sort((a, b) => a._createdAt.localeCompare(b._createdAt) || a._id.localeCompare(b._id));
    const decision = decisions[parent._id];
    if (!decision || decision.sourceHash !== groupHash(parent, children))
      throw new Error(`Content changed or classification missing: ${parent._id}`);
    migrateGroup(parent, children, decision);
    const draftParent = sourceMap.get(`drafts.${parent._id}`);
    const draftChildren = children.map((child) => sourceMap.get(`drafts.${child._id}`) || child);
    const draftOnlyChildren = source.filter(
      (doc) =>
        doc._type === "event" &&
        doc._id.startsWith("drafts.") &&
        doc.date?._ref === parent._id &&
        !sourceMap.has(logicalId(doc._id)),
    );
    if (draftOnlyChildren.length) throw new Error(`Draft-only children need explicit mapping: ${parent._id}`);
    if (draftParent || draftChildren.some((child) => child._id.startsWith("drafts."))) {
      const draftDecision = decision.draft;
      if (!draftDecision || draftDecision.sourceHash !== groupHash(draftParent || parent, draftChildren))
        throw new Error(`Draft mapping required: ${parent._id}`);
      migrateGroup(
        draftParent || parent,
        decision.mode === "split" && !draftParent
          ? draftChildren.filter((child) => child._id.startsWith("drafts."))
          : draftChildren,
        { ...decision, ...draftDecision },
        true,
      );
    }
  }
  const unmapped = source.filter(
    (doc) => ["appuntamento", "event"].includes(doc._type) && doc.schemaVersion !== 2 && !mapped.has(doc._id),
  );
  if (unmapped.length) throw new Error(`Unmapped documents: ${unmapped.map((doc) => doc._id).join(", ")}`);
  for (const output of documents)
    warnings.push(...output.migration.warnings.map((message) => ({ id: output._id, title: output.title, message })));
  const targetIds = new Set(documents.map((doc) => doc._id));
  for (const output of documents)
    if (sourceMap.has(output._id) && sourceMap.get(output._id)._type !== output._type)
      throw new Error(`Immutable type collision: ${output._id}`);
  const paths = new Set();
  for (const output of documents.filter((doc) => !doc._id.startsWith("drafts."))) {
    if (output._id.includes(".") || output._id.length > 128)
      throw new Error(`Published IDs must be public root IDs: ${output._id}`);
    const path = `${output.program._ref}/${output.slug.current}`;
    if (paths.has(path)) throw new Error(`Duplicate route: ${path}`);
    paths.add(path);
  }
  // Unknown incoming references block removal rather than being weakened or silently deleted.
  const removed = new Set(retireIds);
  function references(value) {
    if (!value || typeof value !== "object") return [];
    return [...(value._ref ? [value._ref] : []), ...Object.values(value).flatMap(references)];
  }
  for (const doc of source)
    if (!mapped.has(doc._id) && !targetIds.has(doc._id) && references(doc).some((id) => removed.has(id)))
      throw new Error(`Incoming reference from ${doc._id} requires mapping.`);
  return {
    documents: [...Array.from(people.values()).filter((person) => !sourceMap.has(person._id)), ...documents],
    retireIds: [...new Set(retireIds)],
    routes,
    warnings,
    complete: false,
  };
}
