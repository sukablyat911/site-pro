# Peluso Group

Un marketplace automobilistico con tema scuro, sviluppato con React, Node.js, Express e MongoDB.

Per una panoramica in italiano delle funzionalità del sito PRO, consulta la [guida utente](./GUIDA-PRO.md).

Le bozze dei documenti legali si trovano nella cartella [`legal/`](./legal/); completa i campi contrassegnati come segnaposto e sottoponili a una revisione legale prima di pubblicare il sito. Dopo aver effettuato l'accesso, gli amministratori possono modificare le versioni Markdown pubblicate da **Dashboard → Impostazioni → Documenti legali**. Le versioni salvate vengono archiviate in MongoDB e sostituiscono le bozze presenti nel repository.

Il server genera automaticamente `robots.txt` e un file `sitemap.xml` che tiene conto dei veicoli presenti nel catalogo. Le pagine pubbliche espongono anche i metadati Open Graph e i dati Schema.org relativi alla concessionaria e ai singoli veicoli.

I clienti autenticati possono gestire le proprie credenziali ed eliminare il proprio account dalla sezione **Area personale → Privacy e account**.

## Stack tecnologico

- Frontend: React + Vite + CSS personalizzato e responsive.
- Backend: Node.js + Express.
- Database: MongoDB.

## Struttura delle cartelle

- `client/` - applicazione frontend.
- `server/` - API backend.

## Guida all'installazione

1. Copia il file `.env.example` in `.env`, imposta `MONGO_URI` e configura i valori `SMTP_*` relativi alla casella di posta che invierà le notifiche dei messaggi di contatto.

2. Installa le dipendenze principali:

   ```bash
   npm install
   ```

3. Installa le dipendenze del client:

   ```bash
   cd client
   npm install
   ```

4. Avvia l'applicazione:

   ```bash
   cd ..
   npm run dev
   ```

5. Apri l'applicazione nel browser:

   `http://localhost:5173`

## Account e modulo di contatto

La registrazione e l'accesso agli account utilizzano utenti archiviati in MongoDB e sessioni gestite lato server.

Le password vengono sottoposte ad hashing prima di essere salvate; i token di sessione vengono conservati in cookie HTTP-only.

Per modificare le credenziali o eliminare un account, i clienti devono confermare la propria password attuale. Anche le modifiche all'indirizzo e-mail richiedono un codice di verifica inviato al nuovo indirizzo tramite SMTP.

Le richieste inviate in precedenza mantengono i dati di contatto forniti al momento dell'invio.

L'eliminazione di un account revoca immediatamente l'accesso e invalida tutte le sessioni. Le richieste, le conversazioni, gli acquisti e le recensioni esistenti rimangono archiviati separatamente, mentre l'account eliminato non viene più mostrato come acquirente nello storico delle vendite.

I messaggi inviati tramite il modulo di contatto vengono salvati nella raccolta `contact_inquiries` e inviati via e-mail a `CONTACT_EMAIL` (il valore predefinito è `luigi_peluso26@proton.me`).

Configura le seguenti variabili nel file `.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

La variabile `SMTP_FROM` è facoltativa e, se non specificata, utilizza il valore di `SMTP_USER`.

Utilizza le credenziali SMTP o il token specifico per le applicazioni fornito dal tuo gestore di posta elettronica, che potrebbe essere diverso dalla normale password dell'account.

Per Proton Mail, utilizza le credenziali o il token SMTP di invio e un indirizzo mittente autorizzato dal provider.

L'API restituisce un errore se la configurazione SMTP è assente o se l'invio non va a buon fine. Tuttavia, la richiesta inviata rimane salvata in MongoDB e il relativo stato di invio dell'e-mail viene registrato.

I visitatori possono richiedere un appuntamento presso la concessionaria direttamente dalla pagina dei dettagli di un'auto, selezionando una data e un orario futuri.

Le richieste vengono salvate nella raccolta `dealer_visit_requests` e gestite dalla sezione `/admin/visits`.

Gli amministratori possono specificare una motivazione quando accettano o rifiutano una richiesta. Se SMTP è configurato, la decisione viene comunicata al cliente tramite e-mail.

Eventuali problemi nell'invio delle notifiche agli amministratori vengono mostrati nell'area amministrativa, mentre la richiesta rimane comunque disponibile per la gestione.

Gli annunci dei veicoli vengono letti da MongoDB: non è presente un inventario dimostrativo preconfigurato.

L'amministratore può aggiungere, modificare o eliminare gli annunci dalla sezione `/admin`.

Le fotografie dei veicoli caricate da quest'area vengono salvate in `server/uploads/cars/` e rese disponibili tramite l'applicazione.

Durante la distribuzione in produzione, assicurati che questa directory utilizzi uno spazio di archiviazione persistente. I file caricati sono esclusi da Git.

Ogni annuncio può includere fino a 20 immagini nei formati JPEG, PNG o WebP, con una dimensione massima di 8 MB ciascuna.

L'amministratore può inoltre scegliere quale delle immagini caricate utilizzare come immagine principale dell'annuncio.

Gli annunci possono includere anche informazioni facoltative relative a:

- Potenza del motore in kW.
- Classe di emissioni (ad esempio Euro 6D).
- Anno di revisione.

Questi dettagli vengono mostrati nella scheda informativa del veicolo, se disponibili.

I clienti autenticati possono inviare una proposta privata di vendita del proprio veicolo, inserendo le relative informazioni e allegando fino a 20 fotografie.

Queste proposte non vengono pubblicate come annunci visibili al pubblico.

Gli amministratori possono esaminarle, aggiornarne lo stato, accettarle o rifiutarle, oppure inviare una controproposta e scambiare messaggi tramite `/admin/messages`.

I clienti possono monitorare lo stato di ogni proposta e proseguire la conversazione privata dalla sezione `/account`.

I clienti possono anche presentare un'offerta sul prezzo di un veicolo disponibile in magazzino, aggiungendo eventualmente un commento, dalla sezione dedicata alle offerte di prezzo in `/account`.

Le offerte, le controproposte e le risposte vengono visualizzate in uno storico cronologico della negoziazione.

I clienti possono accettare o rifiutare una controproposta oppure inviare una nuova offerta economica direttamente da questa sezione.

Gli amministratori gestiscono queste trattative dall'area dedicata `/admin/offers`.

Le fotografie allegate alle proposte vengono archiviate separatamente in `server/uploads/sell-submissions/` e sono accessibili esclusivamente agli amministratori e al cliente proprietario della proposta.

In ambiente di produzione, assicurati che anche questa directory utilizzi uno spazio di archiviazione persistente.

Dall'inventario amministrativo, è possibile contrassegnare un veicolo in vendita come venduto e selezionare l'account del cliente acquirente tramite il suo indirizzo e-mail registrato.

Questa operazione trasferisce una copia dei dati dell'auto nello storico pubblico delle vendite, senza eliminare le relative fotografie.

Solo l'account del cliente associato alla vendita può inviare una recensione per quell'acquisto, direttamente dalla sezione `/account`.

La recensione viene pubblicata con il consenso del cliente e con il suo nome. L'amministratore può visualizzarla in `/admin/messages`.

## Accesso amministratore e sicurezza

L'accesso amministrativo viene configurato tramite le seguenti variabili nel file `.env`:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_PIN_HASH`
- `ADMIN_EMAIL` (facoltativa).

Lascia non impostati il nome utente e l'hash della password per disabilitare l'accesso amministrativo.

L'accesso all'area amministrativa richiede prima la password e successivamente un PIN di quattro cifre.

Il PIN viene salvato sotto forma di hash bcrypt e non viene mai memorizzato direttamente nel codice sorgente.

Per generare gli hash bcrypt senza inserire le credenziali nel codice sorgente, utilizza i seguenti comandi:

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "choose-a-unique-strong-password"

node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "choose-your-four-digit-pin"
```

Inserisci i valori generati nelle variabili `ADMIN_PASSWORD_HASH` e `ADMIN_PIN_HASH`.

Il PIN deve essere composto esattamente da quattro cifre.

Dopo aver verificato correttamente la password, il server crea una sessione di verifica con privilegi limitati, che scade dopo 60 secondi.

La schermata di inserimento del PIN viene aperta in una pagina dedicata, mostra un conto alla rovescia e mantiene inaccessibili le API amministrative fino alla corretta verifica del PIN.

Tre tentativi errati di inserimento del PIN comportano un blocco di 30 minuti sull'intero account amministratore, anche in caso di nuove sessioni o cambiamenti della rete.

La disconnessione revoca tutte le sessioni server associate a quell'account e cancella il cookie del browser.

Il ruolo di amministratore viene configurato automaticamente all'avvio del server.

Non distribuire mai il sito utilizzando la password di esempio debole `123password`. Sostituiscila con una password robusta e univoca prima di rendere il sito accessibile pubblicamente.

## Informazioni di contatto del team

Le schede dei contatti del team mostrano ancora un numero di telefono segnaposto per Luigi e un indirizzo di esempio riservato per Gerardo.

Verifica e conferma questi dati prima di pubblicare il sito.

## Build di produzione
