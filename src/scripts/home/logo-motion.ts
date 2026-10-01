import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

/** Four flat bands spring into the landscape; the summit mark lands last. */
export function animateHeroLogo(container: HTMLElement): () => void {
  const waves = Array.from(container.querySelectorAll<SVGPathElement>('path:not(.logo-square)'));
  const mark = Array.from(container.querySelectorAll<SVGPathElement>('.logo-square'));
  const parts = [...waves, ...mark];
  const originals = new Map(parts.map(path => [path, new Map(Array.from(path.attributes, attr => [attr.name, attr.value]))]));
  const timeline = gsap.timeline();
  const restore = () => {
    for (const [path, attributes] of originals) {
      for (const attr of Array.from(path.attributes)) if (!attributes.has(attr.name)) path.removeAttribute(attr.name);
      for (const [name, value] of attributes) path.setAttribute(name, value);
    }
    container.classList.remove('is-logo-preparing');
  };

  if (!waves.length) { restore(); return () => {}; }

  // Match points before playback, while hidden, to keep the first frame flat
  // and avoid any geometric jump when the morph starts.
  const bands = waves.reverse().map(path => {
    const box = path.getBBox();
    const floor = box.y + box.height;
    const flat = `M${box.x + box.width},${floor}H${box.x}V${floor - 10}H${box.x + box.width}Z`;
    const [start, end] = MorphSVGPlugin.normalizeStrings(flat, path.getAttribute('d')!, { shapeIndex: 'auto', map: 'position' });
    path.setAttribute('d', start);
    return { path, end };
  });
  gsap.set(waves, { opacity: 0 });
  gsap.set(mark, { opacity: 0, y: -145, rotation: -16, scale: .65, svgOrigin: '461.75 65.35' });
  container.classList.remove('is-logo-preparing');

  timeline.to(waves, { opacity: 1, duration: .18, stagger: .035 }, 0);
  bands.forEach(({ path, end }, index) => {
    timeline.to(path, {
      morphSVG: { shape: end, shapeIndex: 0 },
      duration: 1.2,
      ease: 'elastic.out(1.08, 0.42)',
    }, .24 + index * .12);
  });
  timeline.to(mark, { opacity: 1, duration: .14 }, .95)
    .to(mark, { y: 0, rotation: 0, scale: 1, duration: .62, ease: 'bounce.out' }, .95)
    .to(mark, { scaleX: 1.16, scaleY: .84, duration: .1, ease: 'power2.inOut' }, 1.57)
    .to(mark, { scaleX: 1, scaleY: 1, duration: .5, ease: 'elastic.out(1, 0.38)' }, 1.67)
    .call(restore);

  return () => { timeline.kill(); restore(); };
}
