import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const RESTDB_BASE = "https://databaseclone-6d99.restdb.io/rest";

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

  return (
    <div>
      <h1>Apiario</h1>

      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <button onClick={goHome}>Home</button>{" "}
        <button onClick={logout}>Logout</button>{" "}
        <button onClick={nextArnia} disabled={!arnie.length}>
          Prossima arnia
        </button>

        <hr />

        <div>
          <b>Arnie:</b>{" "}
          <small>(trovate: {arnie.length})</small>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!arnie.length ? (
              <span>Nessuna arnia trovata</span>
            ) : (
              arnie.map((a, idx) => (
                <button
                  key={a._id || a.arn_id}
                  onClick={() => goToArnia(a.arn_id ?? a._id)}
                  style={{
                    fontWeight:
                      String(a.arn_id) === String(selectedArniaId) ? "bold" : "normal",
                  }}
                >
                  {`Arnia ${a.arn_id ?? idx + 1}`}
                </button>
              ))
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            <b>Selezionata:</b>{" "}
            {selectedArnia ? `arn_id=${selectedArnia.arn_id}` : "Nessuna"}
          </div>

          {/* DEBUG: utile per capire subito dove si rompe */}
          <details style={{ marginTop: 10 }}>
            <summary>Debug arnie</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              route id (api_id) = {String(id)}
              {"\n"}Esempio record arnia ={" "}
              {arnie[0] ? JSON.stringify(arnie[0], null, 2) : "nessuno"}
            </pre>
          </details>
        </div>
      </div>

      {isLoading && <p>Caricamento...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>{apiario?.api_nome || "Apiario"}</h2>
        <div>api_id: {id}</div>
        <div>Luogo: {apiario?.api_luogo || "-"}</div>
        <div>
          Lat: {apiario?.api_lat || "-"} | Lon: {apiario?.api_lon || "-"}
        </div>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 12 }}>
        <h2>Notifiche (debug)</h2>
        <div>Trovate: {notifiche.length}</div>
      </div>
    </div>
  );
}