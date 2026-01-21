import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const RESTDB_BASE = "https://databaseclone-6d99.restdb.io/rest";

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

  return (
    <div>
      <h1>Arnia</h1>

      {/* Barra sinistra / comandi (simile screen, senza grafica) */}
      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <button onClick={goHome}>F5.0 - Home</button>{" "}
        <button onClick={goBackToApiario} disabled={!arnia?.arn_api_id}>
          F5.2 - Indietro ad Apiario
        </button>{" "}
        <button onClick={logout}>Logout</button>

        <hr />

        <div>
          <b>F5.1 - Stato:</b> {stato}
        </div>
      </div>

      {isLoading && <p>Caricamento...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Dati arnia */}
      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <div>
          <b>arn_id:</b> {id}
        </div>
        <div>
          <b>arn_api_id:</b> {arnia?.arn_api_id ?? "-"}
        </div>
        <div>
          <b>arn_dataInst:</b> {arnia?.arn_dataInst ?? "-"}
        </div>
        <div>
          <b>arn_piena:</b> {String(arnia?.arn_piena)}
        </div>
        <div>
          <b>arn_MacAddress:</b> {arnia?.arn_MacAddress ?? "-"}
        </div>
      </div>

      {/* F5.4 - Valori (Peso / Temperatura / Umidità) */}
      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>F5.4 - Valori</h2>
        <ul>
          <li>
            <b>Peso:</b> {peso ?? "—"}
          </li>
          <li>
            <b>Temperatura:</b> {temperatura ?? "—"}
          </li>
          <li>
            <b>Umidità:</b> {umidita ?? "—"}
          </li>
        </ul>

        <details>
          <summary>Debug sensori</summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            Sensori: {sensoriConTipo.length}
            {"\n"}Esempio sensore:{" "}
            {sensoriConTipo[0] ? JSON.stringify(sensoriConTipo[0], null, 2) : "nessuno"}
          </pre>
        </details>
      </div>

      {/* F5.3 - Notifiche con scrollbar */}
      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>Notifiche (F5.3)</h2>
        <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #eee", padding: 8 }}>
          {!notifiche.length ? (
            <p>Nessuna notifica.</p>
          ) : (
            <ul>
              {notifiche.map((n) => (
                <li key={n._id} style={{ marginBottom: 10 }}>
                  <div>
                    <b>{n.not_titolo || n.title || "Notifica"}</b>
                  </div>
                  <div>{n.not_desc || n.message || ""}</div>
                  <small>
                    {n._created ? new Date(n._created).toLocaleString() : ""}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* F5.5 - Grafici (placeholder testuale) */}
      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>F5.5 - Grafici (placeholder)</h2>
        {!rilevazioniArnia.length ? (
          <p>Nessuna rilevazione trovata per questa arnia.</p>
        ) : (
          <ul>
            {rilevazioniArnia.map((r) => (
              <li key={r._id}>
                sen_id={r.ril_sen_id} | dato={r.ril_dato} | data={r.ril_dataOra}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* F5.6 / F5.7 - Soglie */}
      <div style={{ border: "1px solid #ccc", padding: 12 }}>
        <h2>Soglie (F5.6 / F5.7)</h2>

        <div style={{ marginBottom: 10 }}>
          <b>Peso:</b> {soglie.peso}{" "}
          <button onClick={() => incSoglia("peso")}>+</button>{" "}
          <button onClick={() => decSoglia("peso")}>-</button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <b>Temperatura:</b> {soglie.temperatura}{" "}
          <button onClick={() => incSoglia("temperatura")}>+</button>{" "}
          <button onClick={() => decSoglia("temperatura")}>-</button>
        </div>

        <div>
          <b>Umidità:</b> {soglie.umidita}{" "}
          <button onClick={() => incSoglia("umidita")}>+</button>{" "}
          <button onClick={() => decSoglia("umidita")}>-</button>
        </div>
      </div>
    </div>
  );
}
