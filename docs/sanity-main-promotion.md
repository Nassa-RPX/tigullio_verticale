# Passaggio del dataset di produzione a main

Il 1 ottobre 2026 l'utente ha autorizzato esplicitamente la sostituzione di `test2` con `main`, usando i contenuti aggiornati di `staging`. Staging è stato conservato senza mutazioni. Il precedente piano di trasformazione in-place su test2 è superato da questa scelta; gli altri report restano una registrazione storica.

## Operazione verificata

1. Inventario autenticato raw ed export completo di staging, senza filtri su tipi, bozze o asset.
2. Inventario ed export completo aggiuntivo di test2 prima della cancellazione.
3. Lettura degli archivi e confronto di tutti i documenti con gli snapshot; verifica degli hash degli archivi e delle revisioni prima delle mutazioni.
4. Eliminazione di test2, creazione di main con la stessa visibilità pubblica e import dell'archivio staging.
5. Confronto di tutti gli ID, tipi, contenuti e riferimenti importati. Le revisioni e i timestamp di sistema possono cambiare durante l'import.
6. Verifica che gli unici dataset siano staging e main e che nessuna revisione di staging sia stata modificata.

Main contiene 32 documenti: 11 eventi, 18 persone, 2 programmi e 1 stato di migrazione. Nell'export corrente non ci sono bozze né documenti asset. Test2 conteneva 23 documenti: 12 eventi, 9 appuntamenti e 2 programmi.

Gli archivi, gli snapshot autenticati, gli hash di verifica e il journal sono conservati nella cartella ignorata da Git `.backups/staging-to-main/production-main-2026-10-01/`. Il backup `staging.tar.gz` ha SHA-256 `d0c054f4914a5a1e3e1ec2695a095e32718135bbd6ddf092bdd3770362b3d2ad`; quello `test2.tar.gz` ha SHA-256 `d4447ce4855f6137d2ea31ab7143720ed603932b56dc002a9ad5358a50aa7b86`.

## Configurazione del rilascio

Il codice ora richiede `main` per la produzione e `staging` per sviluppo e preview. Il vecchio script `seed-staging.mjs` è disabilitato: era una copia iniziale del modello legacy che non includeva persone e stato della migrazione.

Prima del deploy del sito e dello Studio impostare nell'ambiente di produzione:

```dotenv
PUBLIC_SANITY_PROJECT_ID=879g27iz
PUBLIC_SANITY_DATASET=main
SANITY_STUDIO_PROJECT_ID=879g27iz
SANITY_STUDIO_DATASET=main
```

Vercel rileva la produzione con `VERCEL_ENV=production`; su altri host impostare `TV_ENV=production`. Lo Studio ospitato richiede un proprio deploy con le stesse variabili: il deploy del sito Astro non ripubblica automaticamente lo Studio. Se il webhook di rebuild era limitato a test2, aggiornare il suo target a main.

La configurazione `.env` locale resta su staging. Merge e deploy sono lasciati all'utente, come richiesto.

Validazione del codice: 20 test superati e build Astro completata su main con 20 pagine, usando `TV_ENV=production-readonly` e newsletter in modalità mock. L'output di prova è in `.qa/main-build/`; non è stato effettuato alcun deploy.

Main conserva lo stato della migrazione `program-events-v2` già completata: non occorre trasformare di nuovo i contenuti. Per future migrazioni main resta protetto da `--authorize-production` e `TV_ALLOW_PRODUCTION_MIGRATION=true`; non utilizzare i vecchi journal di staging per effettuare rollback su main.
