# Migrazione riutilizzabile staging e produzione al modello Programma → Evento

Data del piano: 1 ottobre 2026.

## Obiettivo e stato

Portare i dataset del progetto Sanity `879g27iz` dal modello `program → appuntamento → event` al modello `program → event`, con eventi di tipo camminata, incontro o serie di incontri. La stessa migrazione viene eseguita prima su `staging` e, quando richiesto dall'utente, successivamente sul dataset di produzione `test2`. Gli incontri di una serie sono oggetti incorporati e ordinabili; guide e relatori fanno riferimento a documenti Persona.

Il piano è stato implementato sul solo `staging` il 1 ottobre 2026, con esecuzione `staging-v2-public`, backup verificato, collaudo e ritiro dei documenti legacy completati. Il [report di esecuzione](sanity-staging-migration-report.md) registra conteggi, verifiche e informazioni editoriali ancora da completare. Le sezioni seguenti conservano il piano di riferimento, anche per il futuro passaggio della produzione.

Il percorso di produzione è compreso nella pianificazione. La richiesta di rendere la migrazione riutilizzabile non avvia ora la migrazione di `test2`.

La difficoltà della camminata è **facoltativa**, secondo la correzione dell'utente. Numero massimo di partecipanti e contatto restano facoltativi e visibili soltanto quando la prenotazione è obbligatoria. Gli altri obblighi proposti nel riepilogo dello schema restano il riferimento di lavoro; eventuali dati mancanti vanno rilevati prima della migrazione, senza inventare valori per soddisfare le validazioni.

## Situazione verificata nel repository

- `sanity/schemaTypes/date.ts` definisce il documento `_type: appuntamento`, non un documento `_type: date`.
- L'appuntamento ha `programYear` come riferimento al programma, `date` come data, `slug`, `title`, `location`, `timeInfo`, `body` e campi editoriali condivisi.
- L'evento ha `date` come **riferimento all'appuntamento**, oltre a `title`, `slug`, `location`, `info`, `body`, `hasDescription`, `requiredPrenotation` e campi editoriali condivisi.
- `leaders` contiene stringhe con nomi e ruoli; le informazioni pratiche sono testo libero e possono essere compilate sia sul padre sia sul figlio.
- `src/lib/sanity.ts` legge i contenuti pubblicati e ricava gli eventi di un appuntamento tramite `date._ref`. Gli eventi sono ordinati per creazione, non per un ordine editoriale esplicito.
- Gli URL di dettaglio attuali appartengono agli appuntamenti: `/programma/[anno]/[slug-appuntamento]`. I singoli eventi hanno sezioni con ancore `activity-[id]`.
- `config/environment.mjs` separa lo staging dal dataset live `test2`.
- `docs/redesign-staging.md` documenta una copia iniziale di 2 programmi, 9 appuntamenti e 12 eventi. Sono numeri storici, da ricontrollare nell'inventario remoto.
- Il backup menzionato nel vecchio documento è una copia dei contenuti del live; non sostituisce un backup aggiornato dello staging.

Il piano precedente di rilascio descrive una modifica additiva compatibile con il vecchio modello. Questa migrazione è strutturale: in fase di implementazione quel documento andrà aggiornato per distinguere i due percorsi.

## Una migrazione versionata, due esecuzioni indipendenti

Il codice di trasformazione, i test, le regole di conversione e la definizione del nuovo schema sono comuni. Versionarli nel repository con un identificativo stabile della migrazione, ad esempio `program-events-v2`.

Separare invece, per ciascun dataset e ciascuna esecuzione, snapshot, manifest applicabile, revisioni attese, report, journal e ripristino. Una possibile organizzazione degli artefatti locali ignorati da Git è `.backups/program-events-v2/<dataset>/<run-id>/`.

| Riutilizzabile fra staging e produzione | Specifico della singola esecuzione |
|---|---|
| Codice e versione della migrazione | Snapshot completo del dataset selezionato |
| Nuovi schemi e validazioni | ID sorgente effettivamente presenti e loro revisioni |
| Regole deterministiche di ID e `_key` | Manifest verificato rispetto ai contenuti attuali |
| Test della trasformazione e del ripristino | Nuovi documenti, modifiche e bozze comparsi nel frattempo |
| Decisioni editoriali ancora valide | Conflitti, campi da completare e decisioni da riesaminare |
| Frontend compatibile e UX finale | Mappa URL effettiva, report e journal della singola esecuzione |

Il motore deve richiedere esplicitamente il dataset. Non scegliere la destinazione implicitamente dal contesto di hosting, dall'ambiente corrente o da un precedente run. L'allowlist è `staging` e `test2`, con progetto sempre `879g27iz`; la modalità predefinita è la simulazione per entrambi.

La migrazione di produzione trasforma i dati presenti in `test2` al momento del passaggio. Non importa il dataset staging sopra il live e non riutilizza il suo NDJSON trasformato come contenuto di produzione.

### Riutilizzo delle decisioni editoriali

Separare le decisioni editoriali riutilizzabili dal manifest eseguibile, che è legato alle revisioni di un singolo snapshot. Riutilizzare le decisioni attraverso gli ID sorgente e la verifica dei contenuti da cui dipendono.

- Se il documento e il gruppo di appartenenza sono equivalenti, si può riutilizzare la classificazione, l'ordine, la mappatura delle persone e la scelta degli slug.
- Se cambiano body, titolo, luogo, prenotazioni o persone, riesaminare le sole decisioni interessate. La verifica include il padre, i figli e le versioni bozza/pubblicato pertinenti, non soltanto il singolo documento.
- Per documenti nuovi in produzione, classificare il nuovo contenuto prima di applicare la migrazione. Documenti eliminati non vengono ricreati sulla base del vecchio inventario staging.
- Sintesi, correzioni o arricchimenti creati soltanto nello staging sono proposte editoriali. Trasferirli a produzione richiede un confronto esplicito con i contenuti attuali e una decisione registrata, non una copia automatica.
- Eventi creati soltanto nello staging non vengono inseriti automaticamente in `test2`.

Fermare l'applicazione se il manifest contiene decisioni irrisolte o se lo snapshot è cambiato dopo la simulazione. L'esito positivo sullo staging prova il codice e il processo; non prova che i futuri contenuti di produzione siano identici.

## Modello di destinazione

Documenti autonomi:

- `program`: anno e titolo.
- `event`: riferimento `program`, discriminante `kind`, titolo, slug, `summary`, `body`, data, eventuale data finale, orari, luogo e collaborazioni.
- `person`: nome e biografia facoltativa.

Oggetti incorporati:

- `walk`: ritrovo, distanza, dislivello, durata, difficoltà facoltativa, equipaggiamento e guide.
- `meeting`: relatori ed eventuale moderatore.
- `series`: lista ordinata degli incontri e modalità di prenotazione.
- Incontro interno: titolo, descrizione, orari, eventuali data e luogo diversi da quelli della serie, relatori, moderatore e prenotazione quando prevista.
- Partecipazione: riferimento alla persona e qualifica facoltativa specifica dell'attività.
- `booking`: obbligatorietà, capienza facoltativa e contatto facoltativo.

`summary` è testo semplice per le schede del programma; `body` è Portable Text per il dettaglio. Non esiste più un selettore "Ha descrizione".

## Strategia di trasformazione degli appuntamenti

Preparare, per il dataset selezionato, un manifest di migrazione con una decisione esplicita per ogni appuntamento e per ogni documento figlio. Il numero di figli non determina da solo il significato editoriale.

| Situazione attuale | Destinazione proposta | Decisione da verificare |
|---|---|---|
| Appuntamento senza figli | Un evento, se contiene un'attività effettiva | Tipo, completezza e stato di pubblicazione |
| Appuntamento con un figlio | Un evento con i dati del padre e del figlio | Titolo, slug e collocazione dei due testi |
| Appuntamento con più incontri collegati editorialmente | Una serie con incontri incorporati | Titolo della serie, ordine e prenotazioni |
| Appuntamento con più incontri indipendenti | Più eventi di tipo incontro | Nessuna serie imposta solo perché condividono una data |
| Appuntamento con camminata e incontri | Eventi distinti; eventuali incontri raggruppati in una serie | Distribuzione della presentazione e delle informazioni condivise |
| Figlio senza padre valido o programma irrisolto | Caso da risolvere nell'inventario | Nessuna associazione automatica a un programma arbitrario |

Il modello proposto non comprende una serie mista di camminate e incontri. Le giornate miste si scompongono in eventi del programma. Se un contenitore misto è editorialmente indispensabile, si risolve quel caso nel modello prima di scrivere la migrazione.

Il manifest deve contenere: progetto, dataset, identificativo e versione del codice di migrazione, ID dell'esecuzione, hash dello snapshot, ID e revisioni sorgente, ID destinazione, programma, tipo, stato bozza/pubblicato, provenienza dei campi, incontri assorbiti, ordine, gestione dei testi, persone, URL precedenti e nuovi, questioni aperte. Non applicare un manifest di staging a produzione cambiandone soltanto il nome del dataset.

## Mappatura dei campi e conservazione dei contenuti

| Campo sorgente | Campo destinazione / regola |
|---|---|
| `appuntamento.programYear` | `event.program`, mantenendo il riferimento allo stesso programma |
| `appuntamento.date` | `event.date`; per una serie, eventuali date dei singoli incontri vengono verificate separatamente |
| `event.date._ref` | Collegamento utilizzato dal manifest per trovare il padre; viene sostituito dalla data soltanto nella fase di applicazione |
| Titoli e slug del padre e del figlio | Scelta esplicita nel manifest; preservare l'URL precedente quando rappresenta correttamente il nuovo evento |
| `event.location` / `appuntamento.location` | Luogo specifico del figlio, altrimenti quello condiviso del padre; conflitti da verificare |
| `subtitle` | Candidato per `summary`, soltanto se descrive correttamente l'evento risultante |
| `body` del padre | Descrizione generale della serie oppure testo da ricollocare negli eventi risultanti |
| `body` del figlio | Descrizione del nuovo evento oppure dell'incontro interno |
| `hasDescription` | Nessun nuovo campo; verificare i testi presenti ma precedentemente nascosti prima di renderli visibili |
| `info` e `timeInfo` | Orari quando inequivocabili; conservare le altre indicazioni nella descrizione con collocazione editoriale verificata |
| `leaders` | Persone e partecipazioni, dopo aver separato e verificato nomi e ruoli |
| `practicalInfo.meeting` | Ritrovo della camminata; orario separato quando identificabile |
| `distance`, `elevation`, `duration` | Valori numerici soltanto quando unità e significato sono certi |
| `difficulty` e `equipment` | Difficoltà facoltativa ed equipaggiamento; concordare la scala prima di convertire le difficoltà esistenti |
| `requiredPrenotation` | `booking.required` del soggetto cui si riferisce |
| `practicalInfo.booking` | Contatto, capienza e altre istruzioni soltanto dopo verifica del testo |
| `partners` | Collaborazioni sul soggetto pertinente |

Regole di conservazione:

- Preservare i Portable Text come blocchi, incluse annotazioni, link e oggetti: nessuna conversione di andata e ritorno attraverso HTML o testo semplice.
- Quando due body confluiscono nello stesso array, verificare l'univocità delle `_key`; registrare eventuali rimappature deterministiche delle chiavi senza alterare il contenuto.
- Non copiare una presentazione collettiva su tutti gli eventi senza una decisione editoriale.
- Un valore come "3–4 km" o "circa due ore, soste incluse" non diventa automaticamente un numero esatto. Conservare l'indicazione nella descrizione e lasciare il campo numerico vuoto fino alla verifica.
- Sintesi mancanti, guide o relatori mancanti e orari ambigui vengono riportati come attività editoriali. Nessun testo generato viene pubblicato automaticamente.
- Una stringa con nome e qualifica non diventa indiscriminatamente il nome di una Persona. La deduplicazione dei nomi va verificata, anche per omonimie.
- Informazioni pratiche o prenotazioni del padre non si propagano a tutti i figli senza aver verificato che valgano per ciascuna attività.

## ID, bozze e riferimenti

- Mantenere gli ID dei programmi.
- Mantenere gli ID degli eventi che rimangono documenti autonomi, dove possibile.
- Per un appuntamento che diventa un nuovo evento o una serie, creare un ID nuovo e deterministico, derivato dall'ID sorgente e registrato nel manifest. Non modificare `_type` del documento appuntamento: Sanity considera `_type` immutabile. [Documentazione sulle migrazioni](https://www.sanity.io/docs/content-lake/schema-and-content-migrations).
- La funzione che genera gli ID non dipende dal nome del dataset: lo stesso documento sorgente, quando esiste in entrambi i dataset, produce la stessa identità di destinazione. Il journal e le revisioni restano separati per dataset. Individuare collisioni con documenti preesistenti prima di scrivere.
- Gli eventi assorbiti in una serie diventano oggetti con `_key` deterministiche. Registrare la corrispondenza tra ID precedente e chiave dell'incontro per URL, verifiche e ripristino.
- Inventariare separatamente documenti pubblicati, `drafts.*` ed eventuali versioni di Content Releases. Il solo risultato delle query pubbliche del sito non basta.
- Migrare pubblicato e bozza separatamente, senza usare il contenuto della bozza per aggiornare il pubblicato. Le modifiche in bozza di un padre condiviso richiedono una decisione su quali bozze degli eventi risultanti creare.
- Gestire anche i documenti presenti soltanto in bozza. Non pubblicarli durante la migrazione.
- Se ci sono Content Releases, includerne esplicitamente le versioni e i riferimenti nel manifest; non ignorarle durante la pulizia.
- Analizzare i riferimenti entranti da qualunque tipo di documento prima di ritirare un padre o assorbire un figlio.
- Creare le persone pubblicate necessarie prima dei documenti pubblicati che le referenziano; non pubblicare automaticamente una persona o un contenuto esistente soltanto in bozza.

## Fasi operative, prima staging e poi test2

Le fasi seguenti si applicano al dataset scelto. Il primo ciclo è sullo staging; il secondo, in un momento successivo, riparte dall'inventario aggiornato di `test2`, usando la versione della migrazione collaudata.

| Fase | Attività | Risultato / criterio di completamento |
|---|---|---|
| 1. Inventario | Leggere il dataset selezionato in prospettiva raw; rilevare tutti i tipi, stati, relazioni, URL e contenuti | Inventario aggiornato e lista delle anomalie |
| 2. Snapshot | Esportare l'intero dataset selezionato, incluse bozze e asset; registrare conteggi, revisioni e hash | Archivio leggibile, non sovrascritto, e procedura di ripristino provata |
| 3. Mappatura | Classificare ogni appuntamento, preparare persone, sintesi e collocazione dei contenuti | Manifest completo, senza casi strutturali irrisolti |
| 4. Implementazione locale | Nuovi schemi e UX Studio, trasformazione, query, componenti, URL e validazioni | Anteprima verificabile sulla rappresentazione trasformata locale |
| 5. Simulazione | Trasformare lo snapshot senza scrivere al dataset selezionato; produrre diff, NDJSON e report | Tutti i dati sorgente hanno una destinazione o una motivazione documentata |
| 6. Applicazione | Sospendere le modifiche editoriali, ricontrollare le revisioni, prendere un backup finale e applicare il manifest | Documenti destinazione coerenti, operazioni registrate e nessuna modifica ad altri dataset |
| 7. Collaudo | Validazioni, build e verifica nel sito e nello Studio | Criteri di accettazione soddisfatti, inclusi ripristino e seconda esecuzione |
| 8. Pulizia | Dopo il collaudo, ritirare documenti/campi legacy e aggiornare la documentazione | Dataset e Studio usano soltanto il nuovo modello attivo |

La separazione fra schema e contenuto è necessaria: modificare uno schema non riscrive i documenti esistenti. Sanity documenta export, simulazione e validazione come parti della migrazione. [Procedura ufficiale](https://www.sanity.io/docs/content-lake/important-considerations-for-schema-and-content-migrations).

### Applicazione controllata e ripetibile

Implementare una trasformazione pura dei documenti esportati, separata dal componente che invia mutazioni e parametrizzata dal target esplicito. La modalità predefinita produce soltanto il report; la scrittura è una modalità esplicita. Il componente e i comandi devono supportare entrambi i dataset senza dover modificare lo script prima del passaggio a produzione.

Il componente di scrittura deve:

- Controllare esattamente progetto `879g27iz`, target esplicito nell'allowlist e corrispondenza fra target, snapshot, manifest e journal, indipendentemente dai valori di default dell'ambiente.
- Abilitare la scrittura su `test2` soltanto nell'esecuzione di produzione richiesta dall'utente; mantenere la simulazione come comportamento predefinito e un'opzione di applicazione produzione distinta dalla sola selezione del dataset.
- Usare credenziali solo nel processo di migrazione, senza esporle al frontend o nei log.
- Applicare un manifest associato al preciso snapshot sorgente. Se le revisioni sono cambiate, fermarsi e rigenerare il piano interessato.
- Usare condizioni sulle revisioni per gli aggiornamenti ed evitare di sovrascrivere dati modificati dopo la simulazione.
- Non sovrascrivere documenti nuovi con ID deterministici se contengono modifiche editoriali successive.
- Registrare gli ID creati, gli aggiornamenti e gli eventuali documenti ritirati, con gli originali necessari al ripristino. Ogni record di journal e completamento include progetto, dataset, migrazione e ID di esecuzione.
- Usare transazioni per i gruppi di mutazioni dipendenti e un journal per riprendere un'applicazione interrotta fra gruppi.
- Registrare temporaneamente una versione del modello, ad esempio `schemaVersion: 2`, sui documenti migrati: durante il collaudo le query del nuovo frontend leggono solo questi eventi e non duplicano i figli legacy assorbiti.
- Conservare i documenti appuntamento e i figli non più attivi fino al collaudo. Durante questa finestra lo Studio di editing resta sospeso; le validazioni dei documenti destinazione si valutano separatamente dagli errori legacy attesi.
- Eliminare i documenti legacy soltanto nella fase finale, dopo aver risolto tutti i riferimenti entranti. Completare allora la validazione dell'intero dataset.

Il marker di versione e il journal sono dettagli della migrazione e non campi da chiedere agli editor. Anche i nuovi eventi creati nello Studio usano la versione corretta del modello. Una seconda esecuzione completata sullo stesso dataset, in assenza di nuovi contenuti legacy, deve produrre zero operazioni, senza ripubblicare, duplicare o annullare modifiche manuali. Il completamento sullo staging non deve far saltare l'esecuzione su `test2`. La ripresa di un'esecuzione interrotta usa il journal del solo dataset interessato.

### Passaggio del sito e dello Studio

Prima di applicare le mutazioni, preparare il frontend del nuovo modello e verificarlo sui dati trasformati locali. Al passaggio dello staging usare quel frontend insieme al nuovo Studio: il vecchio codice richiede `event.date._ref` e non deve continuare a essere il frontend dello staging migrato.

Durante il lavoro sullo staging, la produzione resta sul suo codice e sul dataset `test2`. Preparare e collaudare un adattatore frontend capace di leggere entrambi i modelli prima del successivo passaggio della produzione. L'adattatore seleziona il percorso di lettura per lo stato di migrazione del dataset e non mostra insieme il contenitore legacy e gli eventi derivati. Per un'esecuzione incompleta va definito e verificato il comportamento: mantenere l'ultimo sito statico pubblicato fino al completamento, senza pubblicare build con contenuti parziali.

### Successivo passaggio della produzione

Quando l'utente richiede la migrazione di produzione:

1. Fissare la versione del codice collaudata sullo staging e verificare gli eventuali aggiornamenti allo schema intervenuti nel frattempo.
2. Fare un inventario e un export nuovi di `test2`, includendo bozze, asset ed eventuali release. Confrontare i contenuti con le decisioni già verificate e risolvere nuovi casi e conflitti.
3. Generare il manifest di produzione e ripetere la simulazione sullo snapshot di produzione. Provare la build con i dati trasformati prima delle mutazioni remote.
4. Pubblicare il frontend compatibile e verificarlo contro il modello ancora legacy di `test2`. Preparare il nuovo Studio senza attivare l'editing del nuovo modello prima della migrazione.
5. Nella finestra di passaggio, sospendere l'editing e le pubblicazioni di release interessate, coordinare le build automatiche e prendere il backup finale. Il frontend statico già pubblicato continua a servire la versione precedente mentre i dati vengono trasformati.
6. Ricontrollare le revisioni, rigenerare e verificare il manifest se necessario, poi applicare la stessa migrazione a `test2` con target e modalità di applicazione produzione espliciti. Le mutazioni non devono essere replicate nello staging.
7. Verificare il dataset attivo, eseguire la build del nuovo sito, controllare le pagine e pubblicare il nuovo output. Attivare lo Studio del nuovo modello e verificare insieme sito e dashboard.
8. In caso di errore, conservare il sito statico precedente e ripristinare soltanto `test2` con il suo backup e journal. Ripristinare anche lo Studio compatibile.
9. Dopo il collaudo positivo, riprendere editing e build automatiche, completare la pulizia legacy e validare l'intero dataset. Rimuovere l'adattatore legacy soltanto quando tutti gli ambienti interessati sono migrati e il ripristino non ne richiede più l'uso.

L'integrazione del provider di hosting e dei webhook va inventariata prima della finestra di produzione: non è stata verificata preparando questo piano. La migrazione deve impedire che build automatiche espongano uno stato intermedio; una build fallita non deve sostituire l'ultimo output funzionante. Qualunque prova su copie temporanee del dataset richiede target di prova distinti e una configurazione dedicata; non modificare implicitamente le protezioni in `config/environment.mjs`.

Aggiornamenti necessari nel progetto:

- Schemi in `sanity/schemaTypes/` e navigazione in `sanity.config.ts`: programmi, eventi filtrati per programma e rubrica persone; creazione con programma e tipo precompilati.
- `src/lib/content.ts`: tipi discriminati per i tre eventi e validazione dei riferimenti, date, serie e percorsi.
- `src/lib/sanity.ts`: fetch di programmi ed eventi diretti, persone e incontri incorporati; prospettiva pubblicata per il sito.
- Liste e card del programma: sintesi, data, tipo, luogo e link del nuovo evento.
- Pagina dettaglio: descrizione completa, informazioni specifiche, persone e prenotazioni; serie con incontri nell'ordine editoriale.
- Home, anteprima del prossimo evento, calendario, link correlati e script che usano gli appuntamenti: passaggio agli eventi preservando i selettori necessari alle animazioni.
- Serie su più giorni: definire e verificare il criterio del calendario; una serie non risulta già conclusa dopo il solo primo giorno.
- Test esistenti: adattare quelli di integrità dei contenuti e calendario; introdurre casi significativi per la trasformazione e il ripristino.
- `.qa/static-check.mjs`: sostituire l'attesa fissa di 16 pagine con il numero di percorsi previsto dal manifest e dalle pagine del sito. Il nuovo numero di eventi può essere diverso dal precedente numero di appuntamenti.

### URL e ancore

- Per un appuntamento che diventa un singolo evento o una serie, riutilizzare lo slug precedente quando appropriato.
- Per un appuntamento che si divide in più eventi, assegnare slug distinti e conservare una pagina statica di raccordo al vecchio indirizzo con i link alle destinazioni. Un redirect unico sarebbe appropriato solo se esiste una destinazione editoriale principale chiaramente individuata.
- Mappare le vecchie ancore `activity-[id]` agli eventi autonomi o agli incontri della serie. I fragment non arrivano al server: la compatibilità richiede gli ID nell'HTML o una gestione esplicita nella pagina di raccordo, non soltanto redirect HTTP.
- Rendere gli slug univoci entro lo stesso programma, consentendo lo stesso slug in anni diversi.
- Definire redirect reali secondo il provider quando necessario; una build Astro statica da sola non garantisce che il provider applichi risposte HTTP 301.

## Criteri di accettazione

- Ogni documento e campo editoriale sorgente è contabilizzato nel manifest; i conteggi finali seguono la trasformazione, non una falsa corrispondenza uno-a-uno.
- Nessun Portable Text, link, annotazione o informazione pratica viene perso; i testi prima nascosti sono stati esaminati.
- Nessuna bozza o versione di release viene promossa accidentalmente a pubblicato.
- Tutti gli eventi attivi hanno il riferimento corretto al programma; tutte le partecipazioni hanno persone valide.
- Ogni serie ha almeno un incontro, ordine esplicito e gestione delle prenotazioni coerente.
- La difficoltà assente non impedisce la pubblicazione di una camminata.
- Capienza e contatto assenti non impediscono la pubblicazione quando la prenotazione è obbligatoria.
- Le informazioni dei rami non pertinenti non sono mostrate dal sito anche se temporaneamente presenti nel documento.
- Sintesi e descrizione compaiono nelle viste concordate; card e dettaglio funzionano anche con i campi facoltativi vuoti.
- Tutti gli URL precedenti hanno una destinazione o una pagina di raccordo, incluse le ancore utilizzate dal sito.
- `npm test`, validazione dello schema/documenti, `npm run build` e verifica delle pagine statiche passano sul nuovo modello. Dopo la pulizia la validazione riguarda l'intero dataset.
- Nello Studio si può creare e pubblicare un esempio completo di ciascun tipo, riutilizzare o creare una Persona e riordinare gli incontri di una serie.
- Una seconda esecuzione non modifica documenti e una prova di ripristino ricostruisce il contenuto iniziale.
- Eseguire la stessa versione contro due snapshot equivalenti produce destinazioni equivalenti al netto dei metadati tecnici e degli artefatti di esecuzione. Il journal dello staging non influenza il run di produzione.
- Verificare casi in cui produzione ha documenti nuovi, testi aggiornati, bozze differenti o documenti eliminati rispetto allo staging: la simulazione evidenzia le differenze e non reintroduce dati obsoleti.
- Il frontend compatibile funziona con il vecchio modello di produzione e con il nuovo modello prima della rimozione dell'adattatore. Nessuna build pubblicata durante il passaggio contiene soltanto una parte degli eventi.

## Ripristino

Conservare per ciascun dataset lo snapshot completo immediatamente precedente all'applicazione, il manifest, il journal e lo stato del codice/schema precedente. Il ripristino di `test2` usa esclusivamente i suoi artefatti: un backup o un journal staging non è una sorgente di ripristino produzione.

Per un'applicazione parziale, annullare i gruppi registrati dal journal: ripristinare i documenti modificati, ricreare quelli eventualmente ritirati e rimuovere soltanto i documenti creati dalla migrazione, rispettando le dipendenze dei riferimenti. Fermarsi in presenza di revisioni cambiate dopo la migrazione: preservare quelle modifiche prima di procedere.

Per un ripristino completo usare lo snapshot e riconciliare esattamente gli ID: reimportare con sostituzione non elimina i documenti creati dopo il backup. Rimuovere soltanto gli ID aggiuntivi inventariati e ricontrollare il contenuto, escludendo dal confronto le revisioni e i timestamp tecnici rigenerati. [Semantica del ripristino Sanity](https://www.sanity.io/docs/content-lake/backups).

Ripristinare anche frontend e Studio precedenti, poi verificare che le query legacy e tutti gli URL iniziali funzionino. Riattivare l'editing soltanto dopo aver verificato la coerenza fra dataset, Studio e sito.

`scripts/seed-staging.mjs` non è uno strumento di rollback: confronta lo staging con il live e rifiuta lo staging divergente. Non va adattato per sovrascrivere il lavoro di migrazione.

## Deliverable dell'implementazione

1. Inventario aggiornato e backup completo verificato per ogni esecuzione e dataset, conservati in area ignorata da Git, ad esempio `.backups/`.
2. Decisioni editoriali riutilizzabili e manifest applicabile separato per ogni dataset, con elenco delle decisioni risolte e delle provenienze.
3. Nuovi schemi, UX Studio e frontend verificati localmente.
4. Un'unica trasformazione versionata e parametrizzata per staging e produzione; simulazione, file trasformato e report delle differenze per ciascuna esecuzione.
5. Componente di applicazione protetto, journal separato per dataset e procedura di ripristino provata.
6. Mappa degli URL, report delle verifiche, adattatore frontend compatibile e procedura del passaggio di produzione.
7. Documentazione aggiornata con versione collaudata sullo staging e registrazione della versione successivamente applicata a `test2`.

L'inventario e la mappatura dello staging sono completati. Il risultato comprende 11 eventi pubblicati, 15 persone e una bozza conservata separatamente. Quando verrà richiesto il passaggio a produzione, si ripeterà l'inventario sui dati aggiornati di `test2` e si eseguirà la migrazione verificata, con gli adattamenti editoriali necessari registrati nel suo manifest.
