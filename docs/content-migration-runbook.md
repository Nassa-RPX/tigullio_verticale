# Migrazione Programma → Evento: istruzioni operative

## Ambito

Lo staging è migrato: esecuzione `staging-v2-public`, stato `complete`. Vedere il [report](sanity-staging-migration-report.md) e il [modello editoriale](sanity-content-model.md). Il 1 ottobre 2026, dopo un comando esplicito dell'utente, `test2` è stato sostituito con `main` importando l'export completo di staging. Vedere il [report del passaggio](sanity-main-promotion.md).

Il comando `npm run content:migrate -- ...` usa un'unica trasformazione versionata per `staging` e, dopo un comando esplicito dell'utente, `main`. Senza autorizzazione produzione, **qualsiasi accesso a main è bloccato prima di creare il client**, anche per inventario o simulazione. Il dataset ritirato `test2` non è più un target ammesso.

Per le operazioni remote occorre una sessione Sanity CLI autenticata oppure `SANITY_AUTH_TOKEN` / `SANITY_EDITOR_TOKEN`. Un inventario anonimo non basta: potrebbe omettere bozze e documenti privati. La simulazione con `--source` locale non richiede autenticazione.

La trasformazione non copia un dataset sopra l'altro. Usa i dati aggiornati del dataset scelto e le decisioni editoriali in `scripts/migrations/program-events-v2.decisions.json`. Le decisioni sono vincolate all'impronta dei contenuti del padre e dei figli: cambiamenti o nuovi documenti richiedono una revisione, senza aggiornamento automatico delle impronte.

## Comandi staging

Inventario, con identificativo di esecuzione nuovo:

```powershell
npm run content:migrate -- audit --dataset staging --run inventario-01
```

Simulazione, senza mutazioni remote:

```powershell
npm run content:migrate -- plan --dataset staging --run migrazione-01
```

Per simulare su uno snapshot locale aggiungere `--source <percorso/source.json>`. Per una mappatura editoriale alternativa aggiungere `--decisions <percorso/decisions.json>`.

La simulazione produce `source.json`, `group-fingerprints.json`, `plan.json`, `target.json` e `target.ndjson` in `.backups/program-events-v2/staging/<run>/`. Il piano registra progetto, dataset, hash dello snapshot e hash della trasformazione. Gli artefatti contengono contenuti del CMS e restano ignorati da Git.

Una build di prova senza letture dal CMS:

```powershell
$env:SANITY_CONTENT_FILE='.backups/program-events-v2/staging/migrazione-01/target.json'
npm run build -- --outDir .qa/migration-preview
Remove-Item Env:SANITY_CONTENT_FILE
```

Verificare schema, documenti trasformati e sito, poi applicare il piano:

```powershell
npm run content:migrate -- apply --dataset staging --run migrazione-01
npm run content:migrate -- verify --dataset staging --run migrazione-01
```

`apply` verifica che nessuna revisione sia cambiata, esporta un archivio raw `dataset.tar.gz`, lo legge e lo confronta con lo snapshot. La migrazione non modifica gli asset: lo snapshot conserva i loro riferimenti e documenti originali; l'archivio raw non è una copia dei binari degli asset. Se in futuro la migrazione dovesse modificare o rimuovere asset, aggiungere prima un export completo dei binari.

L'applicazione aggiorna gli eventi e crea persone e serie in una transazione, insieme allo stato della migrazione. Conserva i documenti legacy non più attivi fino al collaudo. La versione del sito con l'adattatore usa soltanto gli eventi del nuovo modello, senza duplicare il vecchio contenitore.

Dopo il collaudo:

```powershell
npm run content:migrate -- cleanup --dataset staging --run migrazione-01
```

`cleanup` ricontrolla i contenuti destinazione e le revisioni dei documenti legacy prima di ritirarli in transazione. Poi registra lo stato `complete`. Una nuova simulazione su un dataset già migrato restituisce zero operazioni. Nuovi documenti legacy aggiunti dopo il completamento vengono segnalati.

Ripristino del dataset e verifica dei contenuti originali:

```powershell
npm run content:migrate -- rollback --dataset staging --run migrazione-01
```

Il ripristino usa il journal di quel dataset, ricrea i documenti ritirati, ripristina quelli aggiornati e rimuove soltanto quelli creati dalla migrazione. Rifiuta di sovrascrivere modifiche effettuate successivamente: conservarle e riesaminare il piano prima di ripristinare. Ripristinare anche il codice/schema se si desidera tornare integralmente al vecchio sistema di editing; l'adattatore del sito sa già leggere il contenuto legacy.

## Dashboard Sanity

Avviare `npm run sanity:dev`. La navigazione è `Programmi → anno → Eventi del programma`; `Dati del programma` consente di modificare l'edizione. La rubrica `Persone` è separata.

La creazione offre Nuova camminata, Nuovo incontro e Nuova serie di incontri. Programma e tipo sono precompilati. Le schede raggruppano Presentazione, Data e luogo, Dettagli e Prenotazione. Le persone si possono cercare o creare dal campo di riferimento; gli incontri della serie sono ordinabili nella stessa scheda.

La difficoltà della camminata è facoltativa. Capienza e contatto sono facoltativi e appaiono solo quando la prenotazione è obbligatoria. La serie distingue Nessuna prenotazione, Intera serie e Singoli incontri.

I contenuti storici migrati non ricevono orari, ritrovi, relatori o descrizioni inventati. Le informazioni obbligatorie assenti nei documenti sorgente sono evidenziate come avvisi sui campi. Per eventi nuovi gli stessi requisiti sono errori bloccanti. Le descrizioni complete restano nelle pagine di dettaglio; le sintesi sono testo dei contenuti originali destinato alle card del programma.

## Ripetizione futura su produzione

`main` è già migrato: conserva lo stato `complete` importato da staging e una nuova simulazione restituisce zero operazioni. Per qualsiasi futura esecuzione su produzione occorrono un comando esplicito dell'utente e **entrambe** le condizioni `--authorize-production` e `TV_ALLOW_PRODUCTION_MIGRATION=true`. La selezione del dataset da sola non autorizza l'accesso.

Per una futura trasformazione: nuovo inventario di produzione, revisione dei contenuti cambiati e dei nuovi documenti, nuovo piano, snapshot e backup specifici di produzione. Non riutilizzare su main il journal di una migrazione eseguita su staging: l'import conserva i dati e il marker, ma crea nuove revisioni.

Il motore rileva le bozze e le Content Releases. Le bozze richiedono una mappatura `draft` esplicita con la propria impronta. Documenti soltanto in bozza e versioni di release non ancora mappati bloccano la migrazione, senza pubblicazione o eliminazione implicita. Risolvere quelle mappature prima di una futura applicazione quando si presentano nell'inventario.

Mantenere l'ultimo sito statico pubblicato durante la trasformazione e coordinare webhook/build automatiche. Il frontend incluso legge sia il modello legacy sia il nuovo. Pubblicare il nuovo Studio e il nuovo output del sito in modo coordinato, dopo la verifica del dataset. Rimuovere la compatibilità legacy solo dopo la migrazione degli ambienti interessati.

## Verifiche

- `npm test`: integrità, trasformazione, modifiche concorrenti, separazione delle bozze, prenotazioni e ripristino.
- `node scripts/run.mjs sanity schemas validate`: controllo locale dello schema.
- `node scripts/run.mjs sanity documents validate --file <target.ndjson> --format json`: controllo Sanity dei documenti trasformati, con configurazione staging.
- TypeScript e build Astro su snapshot sia legacy sia trasformato.
- Verifiche statiche e browser dei nuovi percorsi, vecchi indirizzi, ancore, dispositivi, temi e funzionamento senza JavaScript.

Un cambio di codice della trasformazione dopo la simulazione blocca `apply` e `cleanup`: rigenerare e verificare il piano aggiornato.
