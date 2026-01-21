import { useEffect, useState } from "react";

const RESTDB_BASE = "https://databaseclone-6d99.restdb.io/rest";

// ⚠️ Cambia questi nomi se le tue collezioni si chiamano diversamente:
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

  return (
    <div>
      <h1>Home</h1>

      {/* Barra: Home + pulsanti dinamici Apiari + Logout */}
      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <button onClick={goHome}>F3.0 - Home</button>{" "}
        <button onClick={logout}>F3.5 - Logout</button>

        <hr />

        <div>
          <b>Apiari:</b>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!apiari.length ? (
              <span>Nessun apiario</span>
            ) : (
              apiari.map((a, idx) => (
                <button
                  key={a._id}
                  onClick={() => goToApiario(a.api_id)}
                  title={a._id}
                >
                  {a.api_nome}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {isLoading && <p>Caricamento...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* F3.1 - “Mappa” (senza grafica: lista di punti cliccabili) */}
      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>F3.1 - Mappa (punti cliccabili)</h2>

        {!apiari.length ? (
          <p>Nessun apiario trovato.</p>
        ) : (
          <ul>
            {apiari.map((a, idx) => (
              <li key={a._id}>
                <button onClick={() => goToApiario(a.api_id)}>
                  Apri (click sul punto)
                </button>{" "}
                <span>
                  {a.nome || a.name || `Apiario ${idx + 1}`} — id: {a.api_id}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* F3.2 - Notifiche generali */}
      <div style={{ border: "1px solid #ccc", padding: 12 }}>
        <h2>F3.2 - Notifiche</h2>

        {!notifiche.length ? (
          <p>Nessuna notifica.</p>
        ) : (
          <ul>
            {notifiche.map((n) => (
              <li key={n._id}>
                <div>
                  <b>{n.titolo || n.title || "Notifica"}</b>
                </div>
                <div>{n.messaggio || n.message || JSON.stringify(n)}</div>
                <small>
                  {n._created
                    ? `Creato: ${new Date(n._created).toLocaleString()}`
                    : null}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}