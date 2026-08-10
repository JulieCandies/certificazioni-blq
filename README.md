# Certifica — piattaforma interna di certificazione

App Next.js con:
- login **Amministratore** (password) e **Utente aeroportuale** (codice fiscale + password del test)
- test a risposta multipla auto-correttivi con validità configurabile
- certificato PDF scaricabile (dall'addetto appena finisce, e di nuovo dall'admin quando vuole)
- pagina admin con riepilogo di chi è in scadenza nei prossimi 2 mesi

Dati demo già pronti al primo avvio: due addetti fittizi (Mario Rossi, Sofia Bianchi) e un test con codice `PROVA`, validità 24 mesi.

## Come funziona il database

Usa **Vercel KV** (un database chiave-valore gratuito nel piano hobby di Vercel). Non serve scrivere query SQL né creare tabelle: si collega con un click e le variabili d'ambiente vengono generate da sole.

---

## Guida passo-passo al deploy

### 1. Carica il codice su GitHub
1. Vai su [github.com/new](https://github.com/new) e crea un repository (es. `certifica-interna`), anche privato.
2. Nella cartella di questo progetto, sul tuo computer:
   ```
   git init
   git add .
   git commit -m "Prima versione"
   git branch -M main
   git remote add origin https://github.com/TUO-UTENTE/certifica-interna.git
   git push -u origin main
   ```
   (Se non hai `git` o preferisci farlo senza terminale, GitHub Desktop permette di trascinare la cartella e pubblicarla senza righe di comando.)

### 2. Crea un nuovo progetto su Vercel
Va bene anche se hai già un altro progetto Vercel aperto: sono indipendenti.
1. Vai su [vercel.com/new](https://vercel.com/new).
2. Clicca **"Import"** accanto al repository `certifica-interna` che hai appena creato.
3. Lascia le impostazioni di build predefinite (Vercel riconosce Next.js da solo).
4. **Non premere ancora "Deploy"** — prima aggiungi le variabili d'ambiente al passo 3, altrimenti dovrai rifare il deploy dopo.

### 3. Aggiungi le variabili d'ambiente
Nella stessa schermata di importazione, apri **"Environment Variables"** e aggiungi:

| Nome | Valore |
|---|---|
| `ADMIN_PASSWORD` | una password a tua scelta per l'accesso admin |
| `SESSION_SECRET` | una stringa lunga e casuale (es. generala su [1password.com/password-generator](https://1password.com/password-generator/) o simili) |

Ora clicca **Deploy**. Il sito verrà pubblicato con un indirizzo tipo `certifica-interna.vercel.app`.

### 4. Collega il database Vercel KV
1. Nella pagina del progetto appena creato su Vercel, vai sulla scheda **"Storage"**.
2. Clicca **"Create Database"** → scegli **"KV"** (a volte mostrato come "Upstash for Redis" nel marketplace).
3. Segui la procedura guidata, poi clicca **"Connect"** al tuo progetto quando te lo chiede.
4. Vercel aggiunge da solo le variabili `KV_REST_API_URL`, `KV_REST_API_TOKEN`, ecc. — non devi copiarle a mano.

### 5. Rifai il deploy
Dopo aver collegato il database, vai su **"Deployments"** → sui tre puntini dell'ultimo deploy → **"Redeploy"**, così l'app riparte con il database collegato.

### 6. Prova il sito
- Apri il tuo indirizzo `.vercel.app`.
- Clicca **Amministratore**, inserisci la password che hai scelto: dovresti già vedere Mario Rossi e Sofia Bianchi nella sezione Addetti, e il test `PROVA` nella sezione Test.
- Clicca **Utente aeroportuale**, prova con il codice fiscale `RSSMRA93A01H501U` e password test `PROVA`.

---

## Dopo il primo deploy

- Ogni volta che modifichi il codice e fai `git push`, Vercel ripubblica automaticamente il sito.
- Per cambiare la password admin: Project → Settings → Environment Variables → modifica `ADMIN_PASSWORD` → Redeploy.
- I dati demo (Mario Rossi, Sofia Bianchi, test PROVA) sono fittizi: puoi eliminarli dalla sezione admin quando avrai inserito i tuoi addetti e test reali.

## Sviluppo in locale (facoltativo)

```
npm install
cp .env.example .env.local   # poi compila ADMIN_PASSWORD e SESSION_SECRET
npm run dev
```
In locale, senza un database KV collegato, le funzioni di lettura/scrittura falliranno: per sviluppare in locale serve comunque collegare un database KV di test (Vercel permette di scaricare le variabili con `vercel env pull`).
