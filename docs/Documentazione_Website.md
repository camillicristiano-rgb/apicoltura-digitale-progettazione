
# 📄 Specifica Tecnica e Interfaccia Utente - Gestionale Apiario

**Progetto:** Gestionale Monitoraggio Arnie
**Versione:** 1.0
**Tech Stack:** React (Frontend)

---

## 1. Mappa di Navigazione (Routing)

L'applicazione prevede due flussi di navigazione distinti, entrambi protetti tramite autenticazione via API Key.

### Flusso Apicoltore (User)
* `/login` : Pagina di accesso principale.
* `/home` : Home page con lista apiari e stato salute generale.
* `/apiario/:id` : Dettaglio dello specifico apiario (Griglia Arnie).
* `/arnia/:id` : Scheda tecnica della singola arnia (Grafici e Sensori).

### Flusso Amministratore (Admin)
* `/admin` : Pagina di accesso riservata agli amministratori.
* `/dashboard` : Pannello di gestione utenti, chiavi e configurazioni.

---

## 2. Dettaglio Interfacce Utente (UI)

### A. Login (Accesso Unificato via API Key)
Il sistema non utilizza username/password, ma chiavi univoche.

**1. Login Apicoltore**
* **UI Elements:**
    * Campo Input: "Inserisci la tua API Key".
    * Bottone: "Accedi".
    * Footer: Link "Accesso Admin" (per cambiare vista).
* **Comportamento:** Validazione chiave utente -> Redirect a `/dashboard`.

**2. Login Admin**
* **UI Elements:**
    * Campo Input: "Inserisci API Key Amministratore".
    * Bottone: "Entra nel Pannello Admin".
* **Comportamento:** Validazione chiave admin -> Redirect a `/dashboard`.

### B. Home Dashboard (Vista Apicoltore)
Il centro operativo per l'utente.

* **Header:** Logo, Icona Notifiche (Alert), Tasto Logout.
* **Stato Generale:** Box riassuntivo (es. "Tutto OK" o "2 Arnie critiche").
* **Lista Apiari:** Elenco card/lista degli apiari assegnati.
* **Azioni:** Collegamenti rapidi alle ispezioni o manutenzioni.

### C. Dettaglio Apiario
Vista contenitore delle arnie.

* **Info Testata:** Nome Apiario, Posizione/Mappa.
* **Griglia Arnie:** Visualizzazione delle singole unità.
* **Stato Visivo:** Ogni card arnia possiede un indicatore (es. bordo colorato o icona semaforo) che riflette lo stato di salute basato sui sensori.

### D. Dettaglio Arnia (Scheda Sensori)
Pagina di analisi profonda.

* **Info:** Identificativo Arnia e coordinate.
* **Sensori Real-time:**
    * 🌡️ **Temperatura:** Gradi centigradi interni.
    * ⚖️ **Peso:** Kg attuali (stima scorte/miele).
    * 💧 **Umidità:** Percentuale relativa.
* **Grafici:** Sezione per visualizzare l'andamento storico (ultime 24h / 7gg) dei tre parametri sopra citati.
* **Note:** Area testo per annotazioni o storico interventi manuali.

### E. Pannello Admin
Interfaccia di gestione (Back-office).

* **Gestione Utenti:** Tabella con Nome, Ruolo, API Key assegnata.
* **Azioni:**
    * "Genera Nuova Key": Crea una stringa univoca per un nuovo utente.
    * "Revoca Key": Disabilita l'accesso a un utente.
* **Configurazione Apiari:** CRUD (Create, Read, Update, Delete) degli apiari e assegnazione agli utenti.

---