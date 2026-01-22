# 📄 Specifica Tecnica Interfacce - Gestionale Apiario

**Versione:** 1.0
**Ambito:** Web Application / Frontend
**Target:** Apicoltori, Manutentori, Sviluppatori

---

## 1. Introduzione
L'interfaccia utente è il punto di contatto finale che trasforma i dati grezzi dei sensori in informazioni decisionali, permettendo all'apicoltore di intervenire tempestivamente in caso di sciamatura, fame, malattie o eventi climatici avversi.

---

## 2. Architettura Frontend
L'applicazione è una **Single Page Application (SPA)** reattiva. L'architettura è modulare e progettata per visualizzare i dati provenienti da un server REST centrale.

* **Ruolo dell'Interfaccia:** Presentazione dati e Configurazione.
* **Sicurezza:** L'accesso è protetto e subordinato al possesso di una API Key valida.
* **Reattività:** Il sistema fornisce feedback immediato sullo stato di salute della colonia (es. *Normalità, Allarme, Manutenzione*).
* **RestDB:** https://databaseclone-6d99.restdb.io/rest

---

## 3. Mappa di Navigazione
Il percorso utente è strutturato gerarchicamente per gestire la complessità dei dati (da molti apiari a un singolo sensore).

1.  **Login** (`/login`): Autenticazione univoca.
2.  **Dashboard Generale** (`/home`): Vista d'insieme della flotta e notifiche urgenti.
3.  **Vista Apiario** (`/apiario/:id`): Filtro geografico (gruppo di arnie).
4.  **Dettaglio Arnia** (`/arnia/:id`): Analisi profonda (Sensori, Grafici, Camera).

```import Login from "./pages/login.jsx";
import Home from "./pages/home.jsx";
import ApiarioPage from "./pages/apiario.jsx";
import ArniaPage from "./pages/arnia.jsx";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />, // Componente che reindirizza alla pagina di login
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/home',
    element: <Home />,
  },
  {
    path: '/apiario/:id',
    element: <ApiarioPage />,
  },
  {
    path: '/arnia/:id',
    element: <ArniaPage />,
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

---

## 4. Descrizione Dettagliata delle Interfacce

### A. Portale di Accesso (Login)
* **Percorso:** `/login`
* **Target:** Apicoltori (produzione) e Sviluppatori (debug).
* **Funzionalità:** Inserimento API Key.
* **Logica:** Verifica immediata della validità della chiave.

```export default function Login() {
  const [apik, setApik] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setError("");

    // 1. Controllo Minuscole
    if (apik !== apik.toLowerCase()) {
      setError("Errore: la chiave deve essere tutta in minuscolo.");
      return;
    }

    // 2. Controllo Lunghezza (le API Key di restdb.io sono solitamente di 24 caratteri)
    if (apik.length < 20) { 
      setError("Errore: la chiave è troppo corta.");
      return;
    }

    setIsLoading(true);

    try {
      // 3. Controllo connessione reale verso RestDB
      // Sostituisci 'nome-database' con il nome del tuo DB su restdb.io
      // Usiamo una collezione esistente o semplicemente una chiamata di test
      const response = await fetch("https://databaseclone-6d99.restdb.io/rest/_ping", {
        method: "GET",
        headers: {
          "x-apikey": apik, // Header specifico richiesto da restdb.io
          "Content-Type": "application/json",
          "cache-control": "no-cache"
        }
      });

      if (response.ok) {
        // Se il server risponde 200 OK
        localStorage.setItem("apik", apik);
        window.location.href = "/home";
      } else {
        // Se la chiave è errata (es. errore 401 Unauthorized)
        setError("Chiave API non valida per il DB.");
      }
    } catch (err) {
      // Errore di rete o URL errato
      setError("Impossibile connettersi. Controlla la key o la connessione.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  ```

### B. Dashboard Operativa (Home)
* **Percorso:** `/home`
* **Scopo:** Fornisce la "Situational Awareness" immediata. L'utente deve capire a colpo d'occhio se ci sono emergenze.

**Elementi Chiave:**
* **Stato Complessivo:** Un indicatore semaforico globale.
    > *Logica:* Se anche solo un'arnia presenta parametri critici (es. Peso < soglia o Umidità > 90%), lo stato cambia.
* **Lista Apiari:** Card riassuntive per ogni postazione.
* **Log Notifiche:** Visualizzazione degli eventi generati dalla logica di backend (es. *"Batteria scarica"*, *"Inizio sciamatura rilevato"*).

```const RESTDB_BASE = "https://databaseclone-6d99.restdb.io/rest";

const COL_APIARI = "apiari";
const COL_NOTIFICHE = "notifiche";

export default function Home() {
  const [apik, setApik] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [apiari, setApiari] = useState([]);
  const [notifiche, setNotifiche] = useState([]);

  useEffect(() => {
    const k = localStorage.getItem("apik");
    if (!k) {
      window.location.href = "/";
      return;
    }
    setApik(k);
  }, []);

  useEffect(() => {
    async function loadAll() {
      if (!apik) return;

      setIsLoading(true);
      setError("");

      try {
        const [apiariRes, notifRes] = await Promise.all([
          fetch(`${RESTDB_BASE}/${COL_APIARI}`, {
            method: "GET",
            headers: {
              "x-apikey": apik,
              "Content-Type": "application/json",
              "cache-control": "no-cache",
            },
          }),
          fetch(`${RESTDB_BASE}/${COL_NOTIFICHE}?sort=-_created`, {
            method: "GET",
            headers: {
              "x-apikey": apik,
              "Content-Type": "application/json",
              "cache-control": "no-cache",
            },
          }),
        ]);

        if (!apiariRes.ok) {
          throw new Error(
            "Errore nel caricamento apiari (controlla API key/collezione)."
          );
        }
        if (!notifRes.ok) {
          throw new Error(
            "Errore nel caricamento notifiche (controlla API key/collezione)."
          );
        }

        const apiariData = await apiariRes.json();
        const notifData = await notifRes.json();

        setApiari(Array.isArray(apiariData) ? apiariData : []);
        setNotifiche(Array.isArray(notifData) ? notifData : []);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Errore generico di caricamento.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAll();
  }, [apik]);

  // F3.0: torna alla home
  function goHome() {
    window.location.href = "/home";
  }

  // F3.5: logout
  function logout() {
    localStorage.removeItem("apik");
    window.location.href = "/";
  }

  // Porta alla pagina di uno specifico apiario
  function goToApiario(apiarioId) {
    window.location.href = `/apiario/${apiarioId}`;
  }
  ```

### C. Vista Apiario
* **Percorso:** `/apiario/:id`
* **Scopo:** Permette di confrontare le arnie vicine tra loro (fondamentale per capire se un'anomalia è singola o ambientale).

**Elementi Chiave:**
* **Griglia Arnie:** Ogni arnia è un blocco che mostra i parametri vitali (Peso, Temp, Stato).
* **Evidenziazione Anomalie:** Le arnie che richiedono intervento (es. sensore disconnesso o valori fuori soglia) sono evidenziate visivamente (bordo rosso/arancione).

```const RESTDB_BASE = "https://databaseclone-6d99.restdb.io/rest";

// METTI QUI I NOMI ESATTI delle collezioni come appaiono su RestDB
const COL_APIARIO = "apiari";
const COL_ARNIA = "arnie";      // <-- PROVA "arnie" (molto probabile)
const COL_NOTIFICA = "notifiche";

export default function ApiarioPage() {
  const { id } = useParams(); // id = api_id passato nella route

  const [apik, setApik] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [apiario, setApiario] = useState(null);

  const [arnie, setArnie] = useState([]);
  const [selectedArniaId, setSelectedArniaId] = useState(null);

  const [notifiche, setNotifiche] = useState([]);

  const selectedArnia = useMemo(() => {
    return arnie.find((a) => String(a.arn_id) === String(selectedArniaId)) || null;
  }, [arnie, selectedArniaId]);

  useEffect(() => {
    const k = localStorage.getItem("apik");
    if (!k) {
      window.location.href = "/";
      return;
    }
    setApik(k);
  }, []);

  useEffect(() => {
    async function loadAll() {
      if (!apik || !id) return;

      setIsLoading(true);
      setError("");

      try {
        // 1) APIARIO (prendo il primo con api_id = id)
        const apiarioRes = await fetch(
          `${RESTDB_BASE}/${COL_APIARIO}?q=${encodeURIComponent(
            JSON.stringify({ api_id: Number(id) })
          )}`,
          {
            method: "GET",
            headers: {
              "x-apikey": apik,
              "Content-Type": "application/json",
              "cache-control": "no-cache",
            },
          }
        );

        if (!apiarioRes.ok) throw new Error("Errore caricamento apiario.");
        const apiarioArr = await apiarioRes.json();
        setApiario(Array.isArray(apiarioArr) ? apiarioArr[0] : null);

        // 2) ARNIE filtrate per arn_api_id
        // ✅ query robusta: prova sia NUMERO che STRINGA
        const qArnieObj = {
          $or: [{ arn_api_id: Number(id) }, { arn_api_id: String(id) }],
        };

        const arnieUrl = `${RESTDB_BASE}/${COL_ARNIA}?q=${encodeURIComponent(
          JSON.stringify(qArnieObj)
        )}`;

        const arnieRes = await fetch(arnieUrl, {
          method: "GET",
          headers: {
            "x-apikey": apik,
            "Content-Type": "application/json",
            "cache-control": "no-cache",
          },
        });

        if (!arnieRes.ok) {
          const txt = await arnieRes.text().catch(() => "");
          throw new Error(
            `Errore caricamento arnie. Status=${arnieRes.status}. ${txt}`
          );
        }

        const arnieData = await arnieRes.json();
        const arnieArr = Array.isArray(arnieData) ? arnieData : [];
        setArnie(arnieArr);

        // selezione di default
        if (arnieArr.length && !selectedArniaId) {
          setSelectedArniaId(arnieArr[0].arn_id ?? arnieArr[0]._id);
        }

        // 3) NOTIFICHE (come avevi)
        const notifRes = await fetch(`${RESTDB_BASE}/${COL_NOTIFICA}?sort=-_created`, {
          method: "GET",
          headers: {
            "x-apikey": apik,
            "Content-Type": "application/json",
            "cache-control": "no-cache",
          },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifiche(Array.isArray(notifData) ? notifData : []);
        }
      } catch (e) {
        console.error(e);
        setError(e?.message || "Errore generico.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apik, id]);

  function goHome() {
    window.location.href = "/home";
  }

  function logout() {
    localStorage.removeItem("apik");
    window.location.href = "/";
  }

  function goToArnia(arnId) {
    window.location.href = `/arnia/${arnId}`;
  }

  function nextArnia() {
    if (!arnie.length) return;
    const idx = arnie.findIndex(
      (a) => String(a.arn_id) === String(selectedArniaId)
    );
    const nextIdx = idx === -1 ? 0 : (idx + 1) % arnie.length;
    setSelectedArniaId(arnie[nextIdx].arn_id);
  }
```

### D. Dettaglio Arnia (Pannello di Controllo)
* **Percorso:** `/arnia/:id`
* **Scopo:** Interfaccia principale dove convergono i dati di tutti i sensori.

#### 1. Pannello Sensori (Dati Real-time)
L'interfaccia traduce i dati numerici in stati comprensibili:

| Sensore | Parametro | Logica UI & Casi d'Uso |
| :--- | :--- | :--- |
| **Temperatura** (DS18B20) | Valore in °C | • **34-36°C:** Icona Verde (Covata OK)<br>• **< 10°C:** Allarme "Rischio Collasso/Fame"<br>• **> 37°C:** Allarme "Possibile Sciamatura"<br>• **= Temp Esterna:** Allarme Critico "Perdita Colonia" |
| **Umidità** (SHT21/HTU21) | Percentuale % | • **55-70%:** Stato "Ottimale"<br>• **< 60%:** Notifica "Maturazione Miele"<br>• **> 90%:** Allarme "Rischio Condensa/Malattie" |
| **Peso** (HX711) | Totale in Kg | • **Grafico Trend:** Variazione produzione vs consumo.<br>• **Logica:** Evidenzia cali improvvisi (furto/sciamatura) o lenti (fame invernale). |

```const RESTDB_BASE = "https://databaseclone-6d99.restdb.io/rest";

// ⚠️ Metti i nomi ESATTI delle collezioni su RestDB
const COL_ARNIA = "arnie";
const COL_SENSORE = "sensori";
const COL_TIPO = "tipi";
const COL_RILEVAZIONE = "rilevazioni";
const COL_NOTIFICA = "notifiche";

export default function ArniaPage() {
  const { id } = useParams(); // /arnia/:id  (qui id = arn_id)

  const [apik, setApik] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Dati arnia
  const [arnia, setArnia] = useState(null);

  // Notifiche (specifiche arnia) -> se nel DB hai not_arn_id, filtriamo. Altrimenti mostriamo tutto.
  const [notifiche, setNotifiche] = useState([]);

  // Sensori + tipi + ultime rilevazioni
  const [sensori, setSensori] = useState([]);
  const [tipi, setTipi] = useState([]);
  const [rilevazioni, setRilevazioni] = useState([]); // ultime N

  // Soglie (UI locale per + e -)
  const [soglie, setSoglie] = useState({
    peso: 0,
    temperatura: 0,
    umidita: 0,
  });

  useEffect(() => {
    const k = localStorage.getItem("apik");
    if (!k) {
      window.location.href = "/";
      return;
    }
    setApik(k);
  }, []);

  useEffect(() => {
    async function loadAll() {
      if (!apik || !id) return;
      setIsLoading(true);
      setError("");

      try {
        // 1) ARNIA singola (per arn_id)
        const qArnia = encodeURIComponent(JSON.stringify({ arn_id: Number(id) }));
        const arniaRes = await fetch(`${RESTDB_BASE}/${COL_ARNIA}?q=${qArnia}`, {
          method: "GET",
          headers: {
            "x-apikey": apik,
            "Content-Type": "application/json",
            "cache-control": "no-cache",
          },
        });

        if (!arniaRes.ok) throw new Error("Errore caricamento arnia.");
        const arniaArr = await arniaRes.json();
        const arniaObj = Array.isArray(arniaArr) ? arniaArr[0] : null;
        if (!arniaObj) throw new Error("Arnia non trovata (arn_id).");
        setArnia(arniaObj);

        // 2) TIPI (per mappare tip_id -> descrizione)
        const tipiRes = await fetch(`${RESTDB_BASE}/${COL_TIPO}`, {
          method: "GET",
          headers: {
            "x-apikey": apik,
            "Content-Type": "application/json",
            "cache-control": "no-cache",
          },
        });
        const tipiData = tipiRes.ok ? await tipiRes.json() : [];
        setTipi(Array.isArray(tipiData) ? tipiData : []);

        // 3) SENSORI di questa arnia (sen_arn_id)
        const qSensori = encodeURIComponent(
          JSON.stringify({
            $or: [{ sen_arn_id: Number(id) }, { sen_arn_id: String(id) }],
          })
        );
        const sensRes = await fetch(`${RESTDB_BASE}/${COL_SENSORE}?q=${qSensori}`, {
          method: "GET",
          headers: {
            "x-apikey": apik,
            "Content-Type": "application/json",
            "cache-control": "no-cache",
          },
        });
        const sensData = sensRes.ok ? await sensRes.json() : [];
        const sensArr = Array.isArray(sensData) ? sensData : [];
        setSensori(sensArr);

        // 4) RILEVAZIONI: prendo le ultime N (globali) e poi filtro per i sensori dell'arnia
        // (Se vuoi, si può fare una query più sofisticata, ma così è robusto e semplice)
        const rilRes = await fetch(`${RESTDB_BASE}/${COL_RILEVAZIONE}?sort=-ril_dataOra&max=200`, {
          method: "GET",
          headers: {
            "x-apikey": apik,
            "Content-Type": "application/json",
            "cache-control": "no-cache",
          },
        });
        const rilData = rilRes.ok ? await rilRes.json() : [];
        const rilArr = Array.isArray(rilData) ? rilData : [];
        setRilevazioni(rilArr);

        // 5) NOTIFICHE: se hai un campo not_arn_id, filtriamo
        // Se non ce l'hai (come nel tuo ER iniziale), le mostriamo tutte
        // Provo prima a filtrare, se torna vuoto, carico tutte.
        const qNotif = encodeURIComponent(
          JSON.stringify({
            $or: [{ not_arn_id: Number(id) }, { not_arn_id: String(id) }],
          })
        );

        const notifTry = await fetch(`${RESTDB_BASE}/${COL_NOTIFICA}?q=${qNotif}&sort=-_created`, {
          method: "GET",
          headers: {
            "x-apikey": apik,
            "Content-Type": "application/json",
            "cache-control": "no-cache",
          },
        });

        if (notifTry.ok) {
          const dataTry = await notifTry.json();
          const arrTry = Array.isArray(dataTry) ? dataTry : [];
          if (arrTry.length) {
            setNotifiche(arrTry);
          } else {
            const notifAll = await fetch(`${RESTDB_BASE}/${COL_NOTIFICA}?sort=-_created`, {
              method: "GET",
              headers: {
                "x-apikey": apik,
                "Content-Type": "application/json",
                "cache-control": "no-cache",
              },
            });
            const allData = notifAll.ok ? await notifAll.json() : [];
            setNotifiche(Array.isArray(allData) ? allData : []);
          }
        } else {
          const notifAll = await fetch(`${RESTDB_BASE}/${COL_NOTIFICA}?sort=-_created`, {
            method: "GET",
            headers: {
              "x-apikey": apik,
              "Content-Type": "application/json",
              "cache-control": "no-cache",
            },
          });
          const allData = notifAll.ok ? await notifAll.json() : [];
          setNotifiche(Array.isArray(allData) ? allData : []);
        }
      } catch (e) {
        console.error(e);
        setError(e?.message || "Errore generico.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAll();
  }, [apik, id]);

  // ---- Navigazione (F5.0 e F5.2) ----
  function goHome() {
    window.location.href = "/home"; // F5.0
  }

  function goBackToApiario() {
    const apiId = arnia?.arn_api_id;
    if (!apiId) return;
    window.location.href = `/apiario/${apiId}`; // F5.2
  }

  function logout() {
    localStorage.removeItem("apik");
    window.location.href = "/";
  }

  // ---- Stato arnia (F5.1) ----
  // Semplice: se arnia.arn_piena true => "OK" (puoi cambiare logica)
  const stato = useMemo(() => {
    if (!arnia) return "—";
    return arnia.arn_piena ? "OK" : "NON OK";
  }, [arnia]);

  // ---- Helpers: valore corrente per Peso/Temp/Umidità (F5.4) ----
  // Mappo tipo -> sensore -> ultima rilevazione
  const tipoById = useMemo(() => {
    const m = new Map();
    for (const t of tipi) m.set(String(t.tip_id), t);
    return m;
  }, [tipi]);

  const sensoriConTipo = useMemo(() => {
    return sensori.map((s) => {
      const t = tipoById.get(String(s.sen_tip_id));
      return { ...s, _tipo: t?.tip_descrizione || t?.descrizione || t?.tip_nome || "" };
    });
  }, [sensori, tipoById]);

  const latestBySenId = useMemo(() => {
    const m = new Map();
    // rilevazioni già ordinate desc (sort=-ril_dataOra), prendo la prima per sensore
    for (const r of rilevazioni) {
      const sid = String(r.ril_sen_id);
      if (!m.has(sid)) m.set(sid, r);
    }
    return m;
  }, [rilevazioni]);

  function getLatestValueForType(typeNameIncludes) {
    // typeNameIncludes: "peso" / "temperatura" / "umid"
    const target = typeNameIncludes.toLowerCase();
    const sens = sensoriConTipo.find((s) =>
      String(s._tipo || "").toLowerCase().includes(target)
    );
    if (!sens) return null;
    const latest = latestBySenId.get(String(sens.sen_id));
    if (!latest) return null;
    return latest.ril_dato;
  }

  const peso = getLatestValueForType("peso");
  const temperatura = getLatestValueForType("temperatura");
  const umidita = getLatestValueForType("umid");

  // ---- Soglie (F5.6 / F5.7) ----
  function incSoglia(key) {
    setSoglie((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  }
  function decSoglia(key) {
    setSoglie((prev) => ({ ...prev, [key]: (prev[key] ?? 0) - 1 }));
  }

  // ---- Grafici (F5.5) ----
  // Per ora: lista delle ultime rilevazioni della singola arnia (testuale).
  // Puoi sostituire con un grafico vero (Chart.js, Recharts, ecc.)
  const rilevazioniArnia = useMemo(() => {
    const sensIds = new Set(sensori.map((s) => String(s.sen_id)));
    return rilevazioni.filter((r) => sensIds.has(String(r.ril_sen_id))).slice(0, 30);
  }, [sensori, rilevazioni]);
  ```

#### 2. Modulo Camera (Visione Remota)
Interfaccia di controllo per l'ESP32-CAM.
* **Pulsante "Richiedi Foto":** Invia un comando al server per scattare una foto realtime dell'ingresso.
* **Galleria Storica:** Visualizzazione immagini archiviate per monitorare attività di volo o intrusioni.

#### 3. Configurazione Soglie (Attuatori Logici)
Permette la modifica dei parametri di allarme senza riprogrammare il firmware.
* Controlli `+ / -` per le soglie di **Peso Minimo** e **Temperatura Massima**.

---

## 5. Requisiti Non Funzionali dell'Interfaccia
* **Leggibilità:** Alto contrasto per visibilità all'aperto.
* **Efficienza Dati:** Richiesta stretta dei soli dati necessari per minimizzare il consumo su connessioni mobili rurali instabili.
* **Resilienza:** Se un sensore non invia dati (es. guasto), l'interfaccia mostra *"Dato non disponibile"* o *"Manutenzione"* senza bloccare l'intera pagina.

---

## 6. Riferimenti Grafici
La struttura visiva fa riferimento alla documentazione di design allegata:
# [Funzionigramma](../docs/UI/Funzionigramma.pdf)
# [Mockup](../docs/UI/mockup.pdf)
# [ProgettazioneMockup](../docs/UI/ProgettazioneMockup_SitoApicoltore.pdf)