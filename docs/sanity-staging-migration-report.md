# Esecuzione staging: Programma → Evento

Data: 1 ottobre 2026. Progetto `879g27iz`, dataset **staging**, migrazione `program-events-v2`, esecuzione finale `staging-v2-public`. Stato verificato: `complete`.

Durante questa implementazione **test2 non è stato letto né modificato**. Il sito pubblico e lo Studio ospitato non sono stati distribuiti; codice e Studio aggiornati sono nel repository locale.

## Risultato

| Contenuti | Prima | Dopo |
|---|---:|---:|
| Programmi | 2 | 2 |
| Contenitori appuntamento | 9 | 0 |
| Eventi pubblicati | 12 attività figlie | 11 eventi diretti |
| Persone | 0 | 15 |
| Bozze evento | 1 | 1 |
| Stato tecnico migrazione | 0 | 1 |
| Totale documenti contenuto, esclusi `system.*` | 24 | 30 |

I nuovi eventi pubblicati sono 7 camminate, 2 incontri e 2 serie. La serie 2025 contiene quattro incontri incorporati e ordinati. La bozza di Frutti Di Autunno è stata trasformata separatamente, senza pubblicarla. I documenti tecnici Sanity `system.*` restano invariati.

I contenitori con una sola attività diventano eventi autonomi; Riconoscere il Territorio 2025 diventa una serie. Riconoscere il Territorio 2026 e La Civiltà dei Boschi diventano due eventi ciascuno. Le descrizioni condivise di questi ultimi sono conservate nelle rispettive destinazioni.

I testi originali, comprese descrizioni precedentemente nascoste, note pratiche e informazioni non traducibili con certezza in numeri, sono conservati. Le sintesi provengono dai testi originali. Nomi e qualifiche seguono le fonti, incluse eventuali grafie da rivedere editorialmente.

## Backup e ripristino

Gli artefatti sono in `.backups/program-events-v2/staging/staging-v2-public/`, ignorati da Git: snapshot sorgente, manifest, decisioni/impronte, output trasformato, export `dataset.tar.gz`, confronto del backup, journal e snapshot finale `completed.json`.

L'export autenticato è stato confrontato con tutti i 24 documenti sorgente, inclusa la bozza. Non erano presenti asset Sanity; la migrazione non modifica né elimina asset. Per esecuzioni future con asset considerare anche il backup dei binari, come indicato nel runbook.

Il ripristino è stato provato realmente sullo staging durante il collaudo iniziale: contenuti originali ricostruiti e confronto integrale superato. La prima applicazione usava ID con punti, invisibili alle letture anonime del sito; è stata ripristinata prima dell'esecuzione finale, che usa ID pubblici senza punti. Quella prova è registrata nell'esecuzione `staging-v2-authenticated/rollback.json`; non riapplicare il suo vecchio manifest.

Per ripristinare l'esecuzione finale usare il comando del runbook con `--run staging-v2-public`. Il ripristino rifiuta modifiche successive ai documenti interessati.

## Verifiche completate

- 20 test automatici passati, inclusi bozze, riferimenti, modifiche concorrenti, calendario e ripristino.
- TypeScript senza errori; schema Sanity senza errori o avvisi.
- Documenti destinazione validati da Sanity senza errori. Dodici avvisi sui campi corrispondono alle lacune editoriali sotto elencate, inclusa la bozza.
- Build Astro sui dati reali dello staging, anche dopo la pulizia: 20 pagine.
- 544 collegamenti/asset locali validi.
- 204 verifiche browser: 17 percorsi, tre larghezze, due temi, JavaScript attivo/disattivo; controllate anche le ancore legacy e le prenotazioni dei singoli incontri.
- URL storici preservati: nei casi divisi in più eventi rimane una pagina di raccordo con le vecchie ancore.
- Verifica remota dei 27 documenti trasformati e dello stato finale; seconda simulazione: zero operazioni.
- Frontend compatibile verificato anche sullo snapshot del modello legacy, senza accessi alla produzione.

Lo Studio locale carica correttamente la configurazione **Tigullio Verticale — Staging** su `http://localhost:3333`. Il browser di verifica richiede il login Sanity: il flusso di compilazione e pubblicazione dall'interfaccia non è stato esercitato con una sessione browser autenticata. Navigazione, template e validazioni sono stati controllati nel codice e con gli strumenti nativi Sanity.

## Informazioni da completare

| Evento | Informazioni non presenti nella fonte |
|---|---|
| Frana Futura | Ora di inizio e relatori |
| U pan che dorme | Ora di inizio e punto di ritrovo |
| Conferenza In Cammino | Ora di inizio e punto di ritrovo |
| Escursione tra i Castagneti | Ora di inizio e punto di ritrovo |
| Frutti Di Autunno, pubblicato e bozza | Lista dei singoli incontri |
| Riconoscere il Territorio 2025 | Descrizione narrativa degli incontri sulle tartarughe e sugli animali selvatici; conservate le informazioni originali disponibili |

Questi campi sono avvisi nei contenuti migrati. I nuovi eventi richiedono le informazioni necessarie prima della pubblicazione. La difficoltà resta facoltativa per tutte le camminate; capienza e contatto restano facoltativi anche con prenotazione obbligatoria.

Il futuro passaggio a produzione richiede un comando esplicito, un inventario aggiornato di `test2` e un manifest/backup dedicati. Non si importa lo snapshot staging sopra la produzione.
