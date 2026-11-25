# 🚘 PelusoGroup PRO

**Guida pratica per visitatori, clienti e amministratori**

PelusoGroup PRO è un sito per presentare le auto della concessionaria e gestire
le richieste dei clienti. Un visitatore può esplorare il catalogo, chiedere
informazioni su acquisto o noleggio e prenotare una visita. Con un account può
anche salvare le auto, seguire le proprie richieste e proporre la vendita della
propria vettura.

> ℹ️ **Da sapere:** le richieste inviate dal sito non concludono automaticamente
> un acquisto o un noleggio. Disponibilità, prezzo e condizioni vengono
> confermati dal team.

---

## 🧭 Indice

| Cerchi informazioni su... | Vai alla sezione |
| --- | --- |
| Le pagine e i servizi del sito | [Dove iniziare](#dove-iniziare) |
| Acquisto, noleggio e area personale | [Per chi visita il sito](#visitatori) |
| Inventario, richieste e gestione | [Per l'amministratore](#amministratore) |
| Configurazione e pubblicazione | [Note per chi gestisce il progetto](#note-progetto) |

<a id="dove-iniziare"></a>

## 📍 Dove iniziare

| Pagina | Cosa puoi fare |
| --- | --- |
| 🏠 **Home** · `/` | Scoprire la concessionaria e i servizi, consultare alcune auto in vendita e a noleggio e trovare risposte alle domande frequenti. |
| 🚘 **Catalogo** · `/catalogo` | Cercare e filtrare le auto disponibili per vendita o noleggio. |
| 🔎 **Scheda auto** · `/auto/...` | Consultare foto, prezzo, caratteristiche e contattare il team per quella vettura. |
| 🔄 **Vendi auto** · `/vendi-auto` | Inviare una proposta privata per far valutare la propria auto. |
| ✉️ **Contatti** · `/contatti` | Scrivere al team e consultare recapiti, indirizzo e orari. |
| 👤 **Area personale** · `/account` | Ritrovare attività, richieste, trattative e acquisti collegati al proprio account. |

---

<a id="visitatori"></a>

## 👥 Per chi visita il sito

### 🔎 Trovare un'auto

1. Apri **Catalogo** e usa la ricerca o i filtri per restringere i risultati.
2. Seleziona un'auto per aprire la scheda con immagini, prezzo e dati disponibili.
3. Usa le azioni nella scheda per inviare una richiesta o contattare il team.

Per un'auto **in vendita** puoi:

- richiedere informazioni per l'acquisto, lasciando i tuoi recapiti;
- inviare una proposta di prezzo, con un messaggio facoltativo;
- richiedere una visita in concessionaria.

Per un'auto **a noleggio**, scegli ritiro e riconsegna nel calendario e invia
i tuoi contatti. Il sito mostra una stima del costo: la richiesta non blocca
l'auto e il team conferma disponibilità e condizioni.

> ✅ **Senza account:** puoi inviare richieste di acquisto, proposte di prezzo,
> richieste di noleggio e richieste di visita.

### 👤 Salvare e seguire le proprie attività

Crea un account o accedi per:

- salvare le auto nella **selezione** e ritrovare quelle viste di recente;
- consultare le richieste di acquisto collegate al proprio account;
- seguire le proposte di prezzo, rispondere alle controfferte e consultare la
  cronologia della trattativa;
- seguire le proposte di vendita della propria auto e scambiare messaggi privati
  con il concessionario;
- lasciare una recensione verificata per una vendita associata al proprio account.

### 🔄 Proporre la vendita della propria auto

1. Accedi al tuo account e apri **Vendi auto**.
2. Inserisci recapiti, dati e condizioni della vettura; il prezzo desiderato è
   facoltativo.
3. Aggiungi da 1 a 20 foto JPG, PNG o WebP, massimo 8 MB ciascuna, e invia.
4. Segui la valutazione e le risposte nella sezione **Le tue proposte** dell'area
   personale.

> 🔒 **Proposta privata:** non diventa automaticamente un annuncio nel catalogo.

### ✉️ Contatti e privacy

La pagina **Contatti** permette di inviare un messaggio o usare i recapiti
disponibili. Le preferenze cookie sono modificabili dal relativo pulsante:
statistiche e contenuti esterni, come la mappa, richiedono il consenso previsto
dal sito.

In **Area personale → Privacy e account** (`/account/privacy`) puoi aggiornare
nome utente, password e email, gestire i cookie e consultare le informative.
Per cambiare email è necessario verificare il codice inviato al nuovo indirizzo.
Puoi anche cancellare l'accesso: richieste, conversazioni, acquisti e recensioni
già registrati restano conservati separatamente.

---

<a id="amministratore"></a>

## 🛠️ Per l'amministratore

L'area amministrativa è il punto di lavoro per pubblicare le auto, seguire i
clienti e aggiornare le informazioni della concessionaria. La navigazione
laterale permette di passare da una sezione all'altra; i contatori aiutano a
individuare le richieste in attesa.

### Mappa dell'area amministrativa

| Sezione | Percorso | Per cosa usarla |
| --- | --- | --- |
| 🔐 [Accesso e verifica](#admin-accesso) | Pagina di verifica | Completare l'accesso amministratore. |
| 📊 [Dashboard](#admin-dashboard) | `/admin` | Panoramica e collegamenti rapidi. |
| 🚗 [Inventario](#admin-inventario) | `/admin/inventory` | Pubblicare e aggiornare le auto. |
| 🛒 [Richieste di acquisto](#admin-acquisti) | `/admin/purchases` | Gestire le richieste dei clienti. |
| 💬 [Proposte di prezzo](#admin-offerte) | `/admin/offers` | Valutare offerte e controfferte. |
| 🔑 [Noleggi](#admin-noleggi) | `/admin/rentals` | Gestire richieste e disponibilità. |
| 📅 [Visite prenotate](#admin-visite) | `/admin/visits` | Accettare o rifiutare appuntamenti. |
| 📈 [Statistiche](#admin-statistiche) | `/admin/analytics` | Analizzare attività e traffico. |
| ✉️ [Messaggi e vendite](#admin-messaggi) | `/admin/messages` | Gestire valutazioni e storico vendite. |
| ✅ [Registrare una vendita](#admin-vendita) | `/admin/inventory` | Associare la vendita a un cliente. |
| ⚙️ [Impostazioni](#admin-impostazioni) | `/admin/settings` | Aggiornare informazioni e disponibilità del sito. |
| 🛡️ [Sicurezza](#admin-sicurezza) | `/admin/security` | Gestire accessi e controlli disponibili. |

<a id="admin-accesso"></a>

### 🔐 Accesso e verifica

1. Accedi con le credenziali del tuo account amministratore.
2. Nella pagina di verifica dedicata inserisci il PIN di quattro cifre.
3. Una volta verificato l'accesso, apri la **Dashboard** e scegli la sezione
   da gestire.

> 🔐 **Sicurezza dell'accesso:** il PIN prevede **60 secondi e tre tentativi**.
> Tre PIN errati comportano un blocco temporaneo dell'account di 30 minuti.
> Se configurati, un codice dell'app autenticatore o un codice di recupero
> possono essere usati in alternativa al PIN. Non condividere credenziali o
> codici di recupero.

<a id="admin-dashboard"></a>

### 📊 Dashboard

**Percorso:** `/admin`

La dashboard offre una panoramica del lavoro in corso: auto in inventario,
vendite, auto a noleggio e richieste in attesa. Mostra inoltre attività recenti,
collegamenti rapidi e grafici per consultare richieste e vendite nel tempo.

Usala per individuare rapidamente le attività da approfondire; per gestire
una richiesta o modificare un'auto apri la rispettiva sezione.

<a id="admin-inventario"></a>

### 🚗 Inventario

**Percorso:** `/admin/inventory`

Qui puoi pubblicare e aggiornare le auto in vendita o a noleggio.

**Per aggiungere un'auto:**

1. Nel modulo **Aggiungi una nuova auto**, scegli vendita o noleggio e compila
   i campi obbligatori, tra cui marca, modello, anno, prezzo e caratteristiche.
2. Inserisci la descrizione e carica le foto in formato JPG, PNG o WebP:
   massimo 20 immagini da 8 MB ciascuna. Seleziona la foto principale.
3. Aggiungi, se disponibili e verificati, dati facoltativi come dotazioni,
   garanzia, manutenzione, emissioni o condizioni rateali.
4. Se l'auto è in vendita, puoi indicare il trattamento IVA e un prezzo
   scontato, permanente o con scadenza. La stima IVA mostrata dal modulo è
   indicativa: verifica il regime applicabile.
5. Seleziona **Aggiungi auto** e controlla che la scheda sia corretta.

Nell'elenco puoi cercare, filtrare e ordinare le auto, modificare una scheda,
rimuoverla o esportare in CSV i veicoli visibili. Le auto in vendita possono
essere registrate come vendute seguendo la [procedura dedicata](#admin-vendita).

<a id="admin-acquisti"></a>

### 🛒 Richieste di acquisto

**Percorso:** `/admin/purchases`

Questa sezione raccoglie le richieste per le auto in vendita. Cerca per cliente
o vettura, filtra per stato e apri la richiesta per consultare contatti, auto e
prezzo. Dopo le verifiche puoi selezionare **Accetta richiesta** e contattare
il cliente tramite i recapiti disponibili.

> ⚠️ **Richiesta ≠ vendita:** accettare una richiesta non registra
> automaticamente la vendita. Quando l'operazione è conclusa, usa
> **Segna venduta** nell'inventario.

<a id="admin-offerte"></a>

### 💬 Proposte di prezzo

**Percorso:** `/admin/offers`

Qui gestisci le offerte inviate per un'auto in vendita:

1. Cerca la trattativa o filtra le proposte per stato.
2. Consulta l'ultima cifra, il prezzo di riferimento, la differenza e lo
   storico dei messaggi e degli importi.
3. Per una proposta da valutare, scegli se accettare o rifiutare. Se il
   cliente ha un account collegato, puoi anche inviare una controfferta con
   una nota facoltativa.
4. Se la proposta proviene da un visitatore senza account, contattalo
   direttamente usando i recapiti mostrati.

Puoi aggiornare l'elenco ed esportare in CSV le proposte attualmente visibili.
La trattativa rimane distinta dalla registrazione della vendita.

<a id="admin-noleggi"></a>

### 🔑 Noleggi

**Percorso:** `/admin/rentals`

Il calendario mostra, per l'auto selezionata, i periodi di noleggio
confermati. Puoi cercare le richieste per cliente o auto, filtrare per stato
e ordinarle anche per data di ritiro.

Per gestire una richiesta, controlla il periodo, la stima, i recapiti e le
eventuali note; dopo aver verificato disponibilità e tariffa, aggiorna lo stato
secondo l'esito. I periodi **confermati** aggiornano il calendario; le
richieste in attesa non bloccano le date. Controlla eventuali avvisi sullo
stato delle notifiche email.

<a id="admin-visite"></a>

### 📅 Visite prenotate

**Percorso:** `/admin/visits`

Consulta le richieste di appuntamento, cerca un cliente o un'auto e filtra
per richieste da gestire, accettate o rifiutate. Ogni scheda mostra la data
richiesta, i recapiti e l'eventuale messaggio del cliente.

Per una richiesta in attesa puoi **accettare** o **rifiutare** la visita,
aggiungendo facoltativamente un motivo. Controlla lo stato della notifica:
la decisione viene salvata anche se l'email al cliente non è configurata o
non viene inviata correttamente.

<a id="admin-statistiche"></a>

### 📈 Statistiche

**Percorso:** `/admin/analytics`

La pagina aiuta a leggere l'attività del sito e delle auto:

- filtra i dati del parco auto per tutte le vetture, vendita o noleggio;
- consulta auto pubblicate, visualizzazioni, richieste, vendite e fatturato
  registrato, dove applicabili;
- confronta l'**indice di interesse** e le classifiche delle auto più
  visualizzate, delle richieste per auto o delle vendite per marca;
- osserva l'andamento giornaliero degli **ultimi 30 giorni**;
- consulta visite, pagine viste, permanenza media e distribuzione giornaliera
  del traffico pubblico.

I valori del parco auto sono cumulativi, salvo i grafici giornalieri. Le
metriche di richieste e vendite indicate nella pagina riguardano le auto in
vendita; i dati storici possono essere parziali e il traffico dipende anche
dalle preferenze di consenso dei visitatori.

<a id="admin-messaggi"></a>

### ✉️ Messaggi e vendite

**Percorso:** `/admin/messages`

In **Proposte ricevute** trovi le auto che i clienti desiderano vendere alla
concessionaria. Ogni proposta include foto, caratteristiche, condizioni,
recapiti e conversazione privata.

Puoi inviare un messaggio, aggiornare lo stato, accettare o rifiutare la
proposta, formulare una controfferta o chiudere la trattativa. Per
un'accettazione o controfferta occorre indicare il prezzo; per una
controfferta è richiesto anche un messaggio. Le proposte non diventano
automaticamente annunci pubblici.

La sezione **Storico vendite** mostra le vendite registrate, il cliente
associato quando disponibile e le eventuali recensioni.

<a id="admin-vendita"></a>

### ✅ Registrare una vendita

1. In **Inventario**, individua un'auto in vendita e seleziona
   **Segna venduta**.
2. Scegli dall'elenco un account cliente che ha richiesto l'acquisto di
   quell'auto. Senza una richiesta collegata a un account non è possibile
   selezionare il cliente in questa procedura.
3. Inserisci l'**importo finale effettivamente incassato** e conferma.
   L'importo precompilato è indicativo e va verificato.
4. Consulta la vendita nello storico. Il cliente associato potrà lasciare
   una recensione verificata dalla propria area personale.

<a id="admin-impostazioni"></a>

### ⚙️ Impostazioni

**Percorso:** `/admin/settings`

| Area | Cosa puoi aggiornare |
| --- | --- |
| **Profilo attività** | Nome, indirizzo, partita IVA, email e telefono generali. |
| **Preferenze operative** | Fuso orario e tipologia predefinita per le nuove auto. |
| **Identità e contatti** | Logo, immagine principale della home e contatti pubblici del team. |
| **Orari e chiusure** | Orari settimanali, festività e chiusure straordinarie. |
| **Banner informativo** | Messaggio, tipo e scadenza. |
| **Disponibilità del sito** | Modalità manutenzione o offline e messaggio ai visitatori. |

Usa **Salva sezione** dopo aver modificato i dati della sezione interessata.
Logo e immagine home vengono invece salvati al termine del caricamento.
> ⚠️ **Modalità offline:** nasconde il sito pubblico e blocca le API pubbliche.
> Attivala solo quando necessario.

<a id="admin-sicurezza"></a>

### 🛡️ Sicurezza

**Percorso:** `/admin/security`

| Strumento | Cosa permette di fare |
| --- | --- |
| **Credenziali** | Modificare password e PIN, completando le verifiche richieste. |
| **App autenticatore** | Configurare TOTP se la chiave di cifratura del server è stata predisposta. I codici di recupero sono mostrati una sola volta e ciascuno è utilizzabile una sola volta: conservali in sicurezza. |
| **Email e amministratori** | Gestire le email previste e creare o revocare account amministratore. L'email di un nuovo amministratore va verificata prima dell'attivazione. |
| **Traffico e IP** | Consultare contatori ed eventi e configurare limiti applicativi e regole per singoli IP. Non sostituisce una protezione DDoS di rete o CDN. |
| **Token API** | Creare o revocare token di sola lettura per inventario e/o statistiche aggregate. Il token completo è mostrato solo alla creazione: trattalo come una credenziale riservata. |

> ⚠️ **Passkey e chiavi FIDO2 non sono attive** in questa versione. Prima di
> modificare accessi, limiti o disponibilità del sito, verifica l'impatto su
> clienti e altri amministratori.

---

<a id="note-progetto"></a>

## 🧩 Note per chi gestisce il progetto

- Le notifiche email dipendono dalla configurazione SMTP del server.
- Database e immagini caricate richiedono archiviazione persistente e backup.
- Prima della pubblicazione, controlla contatti, credenziali e configurazione
  dell'ambiente; non inserire segreti nei file condivisi.
- Per installazione, configurazione e avvio consulta il [README tecnico](./README.md).
