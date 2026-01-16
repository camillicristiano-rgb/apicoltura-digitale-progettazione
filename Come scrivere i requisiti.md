

# 🧭 [LISTA DEI REQUISITI](https://github.com/IIS-Franchetti-Salviani/apicoltura-digitale-progettazione/blob/main/REQUISITI.md#7-requisiti-per-i-4-gruppi-di-lavoro) E guida rapida: come si scrivono i requisiti (progetto “Apicoltura Digitale”)

> **Obiettivo:** trasformare idee, appunti e desideri del cliente in frasi **chiare, verificabili e tracciabili** (cioè: controllabili con un test e collegabili alla loro “fonte”).
> Nel nostro progetto, l’obiettivo generale è realizzare un sistema IoT per supportare l’apicoltore con dati remoti su produzione e stato dell’arnia, includendo device IoT, API/REST, base dati e infrastruttura di rete.
> (Contesto progetto: server REST, database, dispositivo IoT e infrastruttura di rete)

## Cosa trovi in questo documento

1. Cos’è un requisito e perché serve
2. Regole d’oro per scriverlo bene (e perché quelli “vaghi” fanno danni)
3. Requisiti **utente** vs requisiti **di sistema**
4. Requisiti **funzionali** vs **non funzionali**
5. Un *template* semplice (da copiare/incollare) per ogni requisito
6. Da appunto “buttato giù” a requisito decente (mini esempio)
7. TUTTI I REQUISITI dei 4 gruppi di lavoro:
 - Database su **restdb.io**
 - Device **ESP32-CAM**: sensori e hardware
 - Software su ESP32-CAM + comunicazione **REST**
 - Architettura di rete e infrastruttura
8. Mini nota: cos’è un file **Markdown (.md)** e come si scrive

---

## 1) Cos’è un requisito (e perché non è “una frase a caso”)
Un requisito è una proprietà **richiesta** (o desiderabile) del sistema: descrive **cosa** deve essere realizzato, non *come lo implementerai* nel dettaglio.
Serve perché:
- diventa base per accordarsi con il cliente e non “capirsi a sentimento”;
- guida lo sviluppo e la divisione del lavoro;
- guida i test (“come faccio a verificare che funziona?”).

> Nota didattica: spesso i documenti distinguono tra **definizione dei requisiti** (cosa vuole l’utente/cliente) e **specifica dei requisiti** (come deve comportarsi il sistema in modo più tecnico e misurabile).

---

## 2) Regole d’oro (se ne ignorate una… poi vi rincorre)
Quando scrivete un requisito, controllate sempre questi punti:

- **Specificità:** deve essere chiaro e senza interpretazioni ambigue.
- **Completezza:** copre tutto ciò che serve per quella funzionalità, senza buchi.
- **Verificabilità:** deve esistere un modo pratico per dire “Sì/No, è rispettato”.
- **Consistenza:** non deve contraddire altri requisiti.
- **Priorità:** non tutto è “urgentissimo” allo stesso livello.
- **Tracciabilità:** deve essere possibile risalire a “chi l’ha chiesto” e a cosa è collegato.

Queste regole sono esattamente quelle che useremo come checklist durante la revisione dei vostri documenti.

---

## 3) Requisiti *utente* vs requisiti *di sistema* (stessa cosa, ma a due zoom diversi)
### Requisiti utente (zoom “cliente”)
- Linguaggio naturale.
- Comprensibili anche senza competenze tecniche.
- Esempio: “Voglio vedere sul telefono se la temperatura scende troppo.”

### Requisiti di sistema (zoom “tecnico”)
- Più dettagliati.
- Contengono vincoli, formati dati, tempi, soglie, errori.
- Esempio: “Il sistema invia un allarme push se T < 10°C per più di 30 minuti.”

  

👉 In pratica: **prima** scrivo la versione “utente”, **poi** la rendo misurabile e testabile nella versione “di sistema”.

  

---

  

## 4) Requisiti funzionali vs non funzionali (no, non è una cosa filosofica)
### Funzionali (RF)
Dicono **cosa fa** il sistema (servizi/funzionalità): acquisire dati, inviarli, salvarli, mostrarli, ecc.

### Non funzionali (RNF)
Dicono **come deve essere** il sistema (qualità/vincoli): sicurezza, affidabilità, prestazioni, autonomia, usabilità, portabilità, ecc.

💡 Trucchetto: se una frase contiene “deve essere *veloce/sicuro/robusto*”, di solito è **non funzionale**. Se contiene “deve *inviare/salvare/mostrare*”, è **funzionale**.

---

## 5) Template minimo per ogni requisito (copialo e usalo sempre)
Scegliete un formato standard e mantenetelo uguale per tutto il documento.

### Esempio di scheda requisito (in Markdown)
```md
### RF-DB-01 — Registrazione misure sensori
**Tipo:** Funzionale (RF)
**Descrizione (deve):** Il sistema deve salvare in database le misure di temperatura, umidità, peso e audio, associate a: idArnia, timestamp, qualità del segnale.
**Motivazione:** L’apicoltore deve consultare lo storico e confrontare periodi diversi.
**Priorità:** MUST / SHOULD / COULD
**Criteri di accettazione (test):**
- Dato un payload valido, quando invio la misura, allora la misura compare nello storico entro 2 secondi.
- Se manca `idArnia`, il server rifiuta con errore 400 e messaggio esplicativo.
**Fonte:** Intervista apicoltore / docente / team
**Dipendenze:** RF-API-02 (endpoint POST /measurements)
```

---

### Parole vietate (o quasi)
- “facile”, “molto”, “in tempo reale” (se non specifichi **quanto**), “a breve”, “sempre”, “costantemente” (senza numeri).
Meglio: **misura**, **frequenza**, **soglia**, **tempo massimo**, **formato**.

---

## 6) Da appunto “buttato giù” a requisito decente (mini esempio)
Ecco un esempio tipico di frase *troppo vaga*:

> “il sistema deve monitorare costantemente la temperatura all’interno dell’arnia…”

Diventa un requisito testabile così:

```md
### RF-HW-01 — Misura temperatura interna
**Tipo:** Funzionale (RF)
**Descrizione (deve):** Il device deve acquisire la temperatura interna dell’arnia ogni 60 secondi e associare a ogni misura un timestamp.
**Criteri di accettazione:**
- La misura viene registrata localmente anche senza rete.
- La misura viene inviata al server entro 5 minuti dal ripristino della connessione.
```
Perché è meglio? Perché ora sappiamo **quanto spesso**, **dove finisce il dato**, e **cosa succede se manca la rete**.

---

# 7) Esempi di requisito

> **Documento completo dei requisiti:** Per la stesura completa di tutti i requisiti, consultare [REQUISITI.md](./REQUISITI.md)

Di seguito un esempio di requisito funzionale e non funzionale per ciascun gruppo di lavoro.

---

## Gruppo A — Database

**Esempio requisito funzionale:**
- **RF-DB-01 — Anagrafiche**: Il database deve gestire le seguenti entità: `Apiario`, `Arnia`, `Sensore`, `Rilevazione`, `Notifica` e `Utente`, con le relative relazioni e attributi.

**Esempio requisito non funzionale:**
- **RNF-DB-01 — Retention**: Lo storico misure deve essere conservato per almeno 2 mesi.

---

## Gruppo B — Hardware Sensori

**Esempio requisito funzionale:**
- **RF-HW-01 — Monitoraggio Peso**: Il device deve misurare il peso totale dell'arnia con risoluzione minima di 100g e calcolare il guadagno netto giornaliero (funzione mielometro).
  - _Nota dominio:_ Il peso cresce con nettare e colonia, e diminuisce quando la colonia consuma miele o muore.

**Esempio requisito non funzionale:**
- **RNF-HW-01 — Resistenza Ambientale Esterna (IP Rating)**: I sensori esterni devono avere un grado di protezione minimo IP65 o IP67.
  - _Nota dominio:_ L'attrezzatura è esposta a pioggia battente, raggi UV diretti, gelo invernale e fango.

---

## Gruppo C — Firmware e Comunicazione REST

**Esempio requisito funzionale:**
- **RF-SW-01 — TM, Temperatura Interna**: Il sensore misura la temperatura interna dell'arnia.
- **RF-SW-07 — TM, Frequenza di Aggiornamento**: Il sensore aggiorna la misurazione ogni 6 minuti.

**Esempio requisito non funzionale:**
- **RNF-SW-01 — TM, Persistenza Dati**: Il sensore salva i dati nella memoria locale dell'ESP32 in caso di assenza di connessione.

---

## Gruppo D — Architettura di Rete

**Esempio requisito funzionale:**
- **RF-NET-01 — Router dedicato all'apiario**: Deve essere utilizzato un router LTE con SIM all'interno di una scatola (IP67/IP68), in grado di garantire stabilità di connessione.

**Esempio requisito non funzionale:**
- **RNF-NET-01 — Alimentazione autonoma**: Il sistema di rete (router e dispositivi) deve essere alimentato tramite batteria integrata, protetta da un box resistente agli agenti atmosferici.

---

# 8) Mini nota: cos’è un file Markdown (.md) e perché lo usiamo
**Markdown** è un modo semplice per scrivere documenti usando solo testo, ma con una sintassi leggera per titoli, elenchi, grassetti e blocchi di codice.  
È perfetto per GitHub e per consegne “pulite” in cui versionare modifiche e lavorare in gruppo

### Mini cheat sheet Markdown

```md
# Titolo
## Sezione
**grassetto** *corsivo*

- elenco puntato
1. elenco numerato

`codice in linea`
```

```md
| Colonna | Valore |
|--------:|:------ |
| id | RF-01 |

```

---

# 9) Consegna consigliata (struttura del vostro file requirements.md)
1. **Introduzione** (scopo + contesto del progetto)
2. **Glossario** (arnia, alveare, melario, ecc.)
3. **Stakeholder** (apicoltore, docenti, “utente smartphone”, manutentore…)
4. **Requisiti utente** (pochi, chiari)
5. **Requisiti di sistema** (molti, testabili)
6. **Casi d’uso / scenari** (almeno 2: uno normale, uno con errore)
7. **Requisiti non funzionali** (sicurezza, affidabilità, prestazioni…)
8. **Tracciabilità** (tabellina requisito → fonte → test → componente)

Buon lavoro: i requisiti non sono “burocrazia”, sono l’unico modo per non litigare con il futuro voi stessi. 😄
