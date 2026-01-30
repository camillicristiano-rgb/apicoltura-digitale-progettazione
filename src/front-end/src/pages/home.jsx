import { useEffect, useMemo, useState } from "react";
import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

//const RESTDB_BASE = import.meta.env.VITE_RESTDB_BASE;
const RESTDB_BASE = "https://clone7-b263.restdb.io";
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

  function goHome() {
    window.location.href = "/home";
  }

  function logout() {
    localStorage.removeItem("apik");
    window.location.href = "/";
  }

  function goToApiario(apiarioId) {
    window.location.href = `/apiario/${apiarioId}`;
  }

  // ✅ ICONA LEAFLET PERSONALIZZATA (immagine in /public/apiario.png)
  const apiarioLeafletIcon = useMemo(() => {
    return L.icon({
      iconUrl: "/apiario.png",
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34],
      className: "apiario-marker",
    });
  }, []);

  // ✅ Helpers notifiche: titolo / descrizione / data (NO JSON)
  const getNotifTitle = (n) =>
    String(n?.not_titolo ?? n?.titolo ?? n?.title ?? "Notifica");

  const getNotifDesc = (n) =>
    String(
      n?.not_desc ??
        n?.not_dex ?? // (se nel DB hai not_dex)
        n?.not_testo ??
        n?.not_message ??
        n?.messaggio ??
        n?.message ??
        n?.desc ??
        ""
    );

  const getNotifDate = (n) => {
    const raw = n?.not_dataOra ?? n?.not_data ?? n?._created ?? n?.created ?? null;
    if (!raw) return "";
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString();
  };

  // ---------- STYLES ----------
  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        background: "#f5d88b",
        display: "flex",
        padding: 10,
        gap: 14,
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      },
      sidebar: {
        width: 86,
        background: "#f1d083",
        borderRadius: 14,
        padding: "10px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
        border: "2px solid rgba(0,0,0,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
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
        background: "#b9d3bf",
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
      bell: { width: 22, height: 22, display: "inline-block" },
      notifBox: {
        flex: 1,
        background: "#d7b974",
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
    }),
    []
  );

  // ---------- ICONS ----------
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
      <path d="M12 7v7" stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round" />
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
      <path d="M14 12h7" stroke="#d15b5b" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M18 9l3 3-3 3"
        stroke="#d15b5b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // ---------- COORDS ----------
  const apiariWithCoords = useMemo(() => {
    const list = Array.isArray(apiari) ? apiari : [];
    return list
      .map((a) => ({ a, pos: [Number(a.api_lat), Number(a.api_lon)] }))
      .filter((x) => Number.isFinite(x.pos[0]) && Number.isFinite(x.pos[1]));
  }, [apiari]);

  const mapCenter = useMemo(() => {
    if (apiariWithCoords.length) return apiariWithCoords[0].pos;
    return [43.385117, 12.203588];
  }, [apiariWithCoords]);

  return (
    <div style={styles.page}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
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

        <div style={{ flex: 1 }} />

        <div style={styles.navItem} title="Download">
          <div style={styles.iconBox}>
            <DownloadIcon />
          </div>
        </div>

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
          <div style={styles.statusRow}>
            {isLoading ? <span>Caricamento...</span> : <span>&nbsp;</span>}
            {error ? <span style={{ color: "#b00020" }}>{error}</span> : null}
            {!isLoading && !error ? (
              <span>
                Apiari con coordinate: <b>{apiariWithCoords.length}</b> / {apiari.length}
              </span>
            ) : null}
          </div>

          {/* MAPPA */}
          <div style={styles.mapBox} aria-label="Mappa">
            <MapContainer
              center={mapCenter}
              zoom={12}
              maxZoom={18}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />

              {apiariWithCoords.map(({ a, pos }) => (
                <Marker
                  key={a._id}
                  position={pos}
                  icon={apiarioLeafletIcon}
                  eventHandlers={{ click: () => goToApiario(a.api_id) }}
                >
                  <Popup>
                    <b>{a.api_nome ?? "Apiario"}</b>
                    <br />
                    ID: {a.api_id}
                    <br />
                    Lat/Lng: {pos[0]}, {pos[1]}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* NOTIFICHE */}
          <div style={styles.notifHeader}>
            <div style={styles.notifTitle}>Notifiche</div>
            <BellIcon />
          </div>

          <section style={styles.notifBox}>
            <div style={styles.ruled} />
            <div style={{ padding: 10 }}>
              {!notifiche.length ? (
                <div style={{ color: "rgba(0,0,0,0.6)" }}>Nessuna notifica.</div>
              ) : (
                notifiche.slice(0, 50).map((n) => (
                  <div key={n._id} style={styles.notifItem}>
                    <div style={styles.notifItemTitle}>{getNotifTitle(n)}</div>

                    <div style={styles.notifItemBody}>{getNotifDesc(n) || "—"}</div>

                    <div style={styles.metaRow}>
                      {getNotifDate(n) ? <>Data: {getNotifDate(n)}</> : "Data: —"}
                    </div>
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