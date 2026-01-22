import { useEffect, useMemo, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import { MapContainer } from 'react-leaflet/MapContainer'
import { TileLayer } from 'react-leaflet/TileLayer'

const RESTDB_BASE = "https://clone4-9a15.restdb.io/rest";

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

  // --- GRAFICA (replica stile screenshot) ---
  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        background: "#f5d88b", // giallo sabbia
        display: "flex",
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      },

      sidebar: {
        width: 86,
        background: "#f1d083",
        borderRight: "2px solid rgba(0,0,0,0.08)",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.35)",
        padding: "10px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
      },

      navItem: {
        width: 64,
        borderRadius: 10,
        padding: "8px 6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        userSelect: "none",
      },

      navItemActive: {
        background: "rgba(255,255,255,0.32)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
      },

      iconBox: {
        width: 42,
        height: 42,
        borderRadius: 10,
        background: "rgba(255,255,255,0.45)",
        display: "grid",
        placeItems: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
        border: "1px solid rgba(0,0,0,0.06)",
      },

      navLabel: {
        fontSize: 12,
        color: "rgba(0,0,0,0.65)",
        lineHeight: 1,
      },

      apiarioBtn: {
        width: 64,
        borderRadius: 10,
        padding: "8px 6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        background: "transparent",
        border: "none",
      },

      apiarioIcon: {
        width: 42,
        height: 42,
        borderRadius: 10,
        background: "rgba(255,255,255,0.45)",
        display: "grid",
        placeItems: "center",
        border: "1px solid rgba(0,0,0,0.06)",
      },

      content: {
        flex: 1,
        padding: 14,
      },

      // contenitore centrale come screenshot: mappa sopra e notifiche sotto
      card: {
        height: "calc(100vh - 28px)",
        background: "#f2d48a",
        borderRadius: 14,
        border: "2px solid rgba(0,0,0,0.06)",
        boxShadow: "0 10px 18px rgba(0,0,0,0.06)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflow: "hidden",
      },

      mapBox: {
        height: "60%",
        background: "#b9d3bf", // verde-grigio
        borderRadius: 12,
        border: "2px solid rgba(0,0,0,0.06)",
        position: "relative",
        overflow: "hidden",
      },

      notifHeader: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 2px",
      },

      notifTitle: {
        fontSize: 28,
        fontWeight: 800,
        color: "rgba(0,0,0,0.65)",
        letterSpacing: 0.2,
      },

      bell: {
        width: 22,
        height: 22,
        display: "inline-block",
      },

      notifBox: {
        flex: 1,
        background: "#d7b974", // beige più scuro
        borderRadius: 12,
        border: "2px solid rgba(0,0,0,0.06)",
        overflow: "hidden",
        position: "relative",
      },

      ruled: {
        position: "absolute",
        inset: 0,
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.24), rgba(255,255,255,0.24) 2px, transparent 2px, transparent 32px)",
        pointerEvents: "none",
      },

      notifItem: {
        padding: "6px 8px 10px 8px",
        paddingTop: 4,
        borderRadius: 10,
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(0,0,0,0.05)",
        marginBottom: 22,      // distanza tra una riga e l’altra
        lineHeight: "28px",    // testo allineato sopra la riga
      },
      notifItem: {
        padding: "10px 8px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(0,0,0,0.05)",
        marginBottom: 10,
      },

      notifItemTitle: {
        fontWeight: 800,
        color: "rgba(0,0,0,0.72)",
        marginBottom: 4,
      },

      notifItemBody: {
        color: "rgba(0,0,0,0.66)",
        fontSize: 14,
        position: "relative",
        top: -6,               // 👈 questo lo porta SOPRA la riga
      },

      metaRow: {
        marginTop: 6,
        fontSize: 12,
        color: "rgba(0,0,0,0.5)",
      },

      statusRow: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "0 2px",
        fontSize: 13,
        color: "rgba(0,0,0,0.65)",
      },

      // marker (pin) stile screenshot
      pin: {
        position: "absolute",
        transform: "translate(-50%, -100%)",
        cursor: "pointer",
        filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.15))",
      },
    }),
    []
  );

  // posizioni pins (distribuite) – clic porta all’apiario
  const pins = useMemo(() => {
    const list = Array.isArray(apiari) ? apiari : [];
    const n = Math.min(list.length, 8);
    if (!n) return [];

    // distribuzione “a mano” simile screenshot
    const positions = [
      { left: 18, top: 52 },
      { left: 38, top: 44 },
      { left: 55, top: 64 },
      { left: 82, top: 46 },
      { left: 70, top: 34 },
      { left: 30, top: 70 },
      { left: 48, top: 30 },
      { left: 90, top: 70 },
    ].slice(0, n);

    return list.slice(0, n).map((a, i) => ({ apiario: a, ...positions[i] }));
  }, [apiari]);

  const BellIcon = () => (
    <svg
      style={styles.bell}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(0,0,0,0.65)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );

  const PinIcon = ({ size = 26 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 22s7-4.4 7-12a7 7 0 10-14 0c0 7.6 7 12 7 12z"
        fill="#d63b2f"
      />
      <circle cx="12" cy="10" r="3" fill="#fff" />
      <circle cx="12" cy="10" r="1.3" fill="#d63b2f" />
    </svg>
  );

  const HomeIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-10.5z"
        fill="#cc5a5a"
        opacity="0.95"
      />
      <rect x="9.2" y="11" width="5.6" height="4.2" rx="0.8" fill="#5dc1ff" />
    </svg>
  );

  const HiveIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="8" height="8" rx="2" fill="#56c271" />
      <rect x="13" y="6" width="8" height="8" rx="2" fill="#5a79ff" />
      <rect x="8" y="12" width="8" height="8" rx="2" fill="#f0c24f" />
      <circle cx="12" cy="16" r="1.3" fill="rgba(0,0,0,0.55)" />
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="rgba(0,0,0,0.55)" strokeWidth="2" />
      <path
        d="M12 7v7"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.8 12.8L12 15.9l3.2-3.1"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const LogoutIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="9" height="16" rx="2" fill="#88c1c8" />
      <path
        d="M14 12h7"
        stroke="#d15b5b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 9l3 3-3 3"
        stroke="#d15b5b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div style={styles.page}>
      {/* SIDEBAR (come screenshot) */}
      <aside style={styles.sidebar}>
        {/* Home */}
        <div
          style={{ ...styles.navItem, ...styles.navItemActive }}
          onClick={goHome}
          role="button"
          tabIndex={0}
          title="Home"
        >
          <div style={styles.iconBox}>
            <HomeIcon />
          </div>
          <div style={styles.navLabel}>Home</div>
        </div>

        {/* Pulsanti Apiari (verticali) */}
        {apiari?.slice(0, 3).map((a, idx) => (
          <button
            key={a._id}
            style={styles.apiarioBtn}
            onClick={() => goToApiario(a.api_id)}
            title={a.api_nome || `Apiario ${idx + 1}`}
          >
            <div style={styles.apiarioIcon}>
              <HiveIcon />
            </div>
            <div style={styles.navLabel}>{`Apiario ${idx + 1}`}</div>
          </button>
        ))}

        {/* “Download” icona (solo grafica, come nello screenshot) */}
        <div style={{ flex: 1 }} />

        <div style={styles.navItem} title="Download">
          <div style={styles.iconBox}>
            <DownloadIcon />
          </div>
        </div>

        {/* Logout */}
        <div
          style={styles.navItem}
          onClick={logout}
          role="button"
          tabIndex={0}
          title="Logout"
        >
          <div style={styles.iconBox}>
            <LogoutIcon />
          </div>
          <div style={styles.navLabel}>Logout</div>
        </div>
      </aside>

      {/* CONTENUTO */}
      <main style={styles.content}>
        <div style={styles.card}>
          {/* Status (mantiene loading/error senza “rovinare” la grafica) */}
          <div style={styles.statusRow}>
            {isLoading ? <span>Caricamento...</span> : <span>&nbsp;</span>}
            {error ? <span style={{ color: "#b00020" }}>{error}</span> : null}
          </div>

          {/* F3.1 - MAPPA grafica */}
          <div style={styles.mapBox} aria-label="Mappa">
            <MapContainer center={[43.385117, 12.203588]} zoom={12} maxZoom={18} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <Marker position={[43.385117, 12.203588]}>
                <Popup>
                  A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* F3.2 - NOTIFICHE */}
          <div style={styles.notifHeader}>
            <div style={styles.notifTitle}>Notifiche</div>
            <BellIcon />
          </div>

          <section style={styles.notifBox}>
            <div style={styles.ruled} />
            <div style={styles.notifList}>
              {!notifiche.length ? (
                <div style={{ padding: 10, color: "rgba(0,0,0,0.6)" }}>
                  Nessuna notifica.
                </div>
              ) : (
                notifiche.map((n) => (
                  <div key={n._id} style={styles.notifItem}>
                    <div style={styles.notifItemTitle}>
                      {n.titolo || n.title || "Notifica"}
                    </div>
                    <div style={styles.notifItemBody}>
                      {n.messaggio || n.message || JSON.stringify(n)}
                    </div>
                    {n._created ? (
                      <div style={styles.metaRow}>
                        Creato: {new Date(n._created).toLocaleString()}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
