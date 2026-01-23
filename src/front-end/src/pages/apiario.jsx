import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const RESTDB_BASE = import.meta.env.VITE_RESTDB_BASE;

// METTI QUI I NOMI ESATTI delle collezioni come appaiono su RestDB
const COL_APIARIO = "apiari";
const COL_ARNIA = "arnie"; // <-- PROVA "arnie" (molto probabile)
const COL_NOTIFICA = "notifiche";

/* =========================
   HELPERS COORDINATE (ROBUSTI)
   ========================= */
function parseCoord(v) {
  if (v === null || v === undefined) return null;

  if (typeof v === "number" && !Number.isNaN(v)) return v;

  // supporta stringhe tipo "45,1234" -> 45.1234
  if (typeof v === "string") {
    const cleaned = v.trim().replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function extractLatLon(apiario) {
  if (!apiario) return { lat: null, lon: null };

  // 1) campi "piatti" più comuni
  const latCandidates = [
    apiario.api_lat,
  ];

  const lonCandidates = [
    apiario.api_lon,
  ];

  let lat = latCandidates.map(parseCoord).find((x) => x !== null) ?? null;
  let lon = lonCandidates.map(parseCoord).find((x) => x !== null) ?? null;

  // 2) location object: { location: { lat, lng } } o { location: { latitude, longitude } }
  if ((lat === null || lon === null) && apiario.location) {
    const l = apiario.location;
    const lat2 = parseCoord(l.lat ?? l.latitude);
    const lon2 = parseCoord(l.lng ?? l.lon ?? l.longitude);
    if (lat === null) lat = lat2;
    if (lon === null) lon = lon2;
  }

  // 3) GeoJSON: coordinates: [lon, lat]
  const geo = apiario.geo ?? apiario.geolocation ?? apiario.position;
  const coords =
    geo?.coordinates ??
    apiario.location?.coordinates ??
    apiario.geojson?.coordinates ??
    null;

  if (
    (lat === null || lon === null) &&
    Array.isArray(coords) &&
    coords.length >= 2
  ) {
    const lon3 = parseCoord(coords[0]);
    const lat3 = parseCoord(coords[1]);
    if (lat === null) lat = lat3;
    if (lon === null) lon = lon3;
  }

  return { lat, lon };
}

export default function ApiarioPage() {
  const { id } = useParams(); // id = api_id passato nella route

  const [apik, setApik] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [apiario, setApiario] = useState(null);

  const [arnie, setArnie] = useState([]);
  const [selectedArniaId, setSelectedArniaId] = useState(null);

  const [notifiche, setNotifiche] = useState([]);

  // =========================
  // METEO (Open-Meteo)
  // =========================
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const selectedArnia = useMemo(() => {
    return (
      arnie.find((a) => String(a.arn_id) === String(selectedArniaId)) || null
    );
  }, [arnie, selectedArniaId]);

  // =========================
  // NOTE LOCALI (localStorage)
  // =========================
  const notesStorageKey = useMemo(() => {
    const safeApi = id ?? "noapi";
    const safeArn = selectedArniaId ?? "noarn";
    return `notes:${safeApi}:${safeArn}`;
  }, [id, selectedArniaId]);

  const [noteText, setNoteText] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteSavedMsg, setNoteSavedMsg] = useState("");

  // carica nota quando cambia apiario/arnia
  useEffect(() => {
    if (!id) return;

    try {
      const raw = localStorage.getItem(notesStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setNoteText(String(parsed?.text ?? ""));
      } else {
        setNoteText("");
      }
    } catch {
      setNoteText("");
    }

    setIsEditingNote(false);
    setNoteSavedMsg("");
  }, [notesStorageKey, id]);

  function saveLocalNote() {
    try {
      localStorage.setItem(
        notesStorageKey,
        JSON.stringify({
          text: noteText,
          updatedAt: new Date().toISOString(),
          api_id: id,
          arn_id: selectedArniaId ?? null,
        })
      );
      setIsEditingNote(false);
      setNoteSavedMsg("Salvato ✅");
      setTimeout(() => setNoteSavedMsg(""), 1500);
    } catch (e) {
      console.error(e);
      setNoteSavedMsg("Errore salvataggio ❌");
      setTimeout(() => setNoteSavedMsg(""), 2000);
    }
  }

  function startEditNote() {
    setIsEditingNote(true);
    setNoteSavedMsg("");
  }

  // =========================
  // METEO: usa coordinate apiario dal DB (fallback geoloc opzionale)
  // =========================
  useEffect(() => {
    async function loadWeather(lat, lon) {
      setWeatherLoading(true);
      setWeatherError("");

      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${encodeURIComponent(lat)}` +
          `&longitude=${encodeURIComponent(lon)}` +
          `&current=temperature_2m,weather_code` +
          `&daily=temperature_2m_max,temperature_2m_min` +
          `&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Meteo non disponibile.");

        const data = await res.json();

        const temp = data?.current?.temperature_2m;
        const max = data?.daily?.temperature_2m_max?.[0];
        const min = data?.daily?.temperature_2m_min?.[0];
        const code = data?.current?.weather_code;

        if (temp === undefined || temp === null) {
          throw new Error("Risposta meteo senza temperatura.");
        }

        setWeather({ temp, max, min, code });
      } catch (e) {
        console.error("METEO ERROR:", e);
        setWeather(null);
        setWeatherError(e?.message || "Errore meteo.");
      } finally {
        setWeatherLoading(false);
      }
    }

    if (!apiario) return;

    const { lat, lon } = extractLatLon(apiario);

    // 🔎 debug utilissimo
    // console.log("APIARIO:", apiario);
    // console.log("COORD ESTRATTE:", { lat, lon });

    if (lat != null && lon != null) {
      loadWeather(lat, lon);
      return;
    }

    // fallback: geolocalizzazione browser (puoi anche rimuoverlo)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          setWeather(null);
          setWeatherError("Coordinate apiario mancanti: aggiungi lat/lon nel DB.");
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else {
      setWeather(null);
      setWeatherError("Geolocalizzazione non supportata.");
    }
  }, [apiario]);

  // =========================
  // API KEY
  // =========================
  useEffect(() => {
    const k = localStorage.getItem("apik");
    if (!k) {
      window.location.href = "/";
      return;
    }
    setApik(k);
  }, []);

  // =========================
  // LOAD RESTDB
  // =========================
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
        const apiarioObj = Array.isArray(apiarioArr) ? apiarioArr[0] : null;
        setApiario(apiarioObj);

        // 2) ARNIE filtrate per arn_api_id
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

        // selezione di default (se non ancora selezionata)
        if (arnieArr.length && !selectedArniaId) {
          setSelectedArniaId(arnieArr[0].arn_id ?? arnieArr[0]._id);
        }

        // 3) NOTIFICHE (non usate nella UI note, ma le lasciamo)
        const notifRes = await fetch(
          `${RESTDB_BASE}/${COL_NOTIFICA}?sort=-_created`,
          {
            method: "GET",
            headers: {
              "x-apikey": apik,
              "Content-Type": "application/json",
              "cache-control": "no-cache",
            },
          }
        );
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

  const titleApiario = apiario?.api_nome || "Apiario";

  // --- ICONE ---
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

  return (
    <div className="ap-wrap">
      <style>{`
:root{
  --bg: #f5d88b;
  --sidebar: #f1d083;
  --card: #f2d48a;
  --panel: #d7b974;
  --shadow: rgba(0,0,0,.14);
  --text: rgba(0,0,0,.55);
  --stroke: rgba(0,0,0,.07);
}
*{ box-sizing:border-box; }

.ap-wrap{
  min-height: 100vh;
  background: var(--bg);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
  display:flex;
  padding: 10px;
}
.ap-shell{
  width: 100%;
  margin: 0 auto;
  display:flex;
  gap: 14px;
  align-items: stretch;
}
.ap-sidebar{
  width: 86px;
  background: var(--sidebar);
  border-radius: 14px;
  padding: 10px 8px;
  border-right: 2px solid rgba(0,0,0,0.08);
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.35);
  display:flex;
  flex-direction:column;
  align-items:center;
  gap: 10px;
}
.ap-navItem{
  width: 70px;
  border-radius: 10px;
  padding: 6px 6px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap: 6px;
  cursor:pointer;
  user-select:none;
}
.ap-navItemActive{
  background: rgba(255,255,255,0.28);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
}
.ap-iconBox{
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(255,255,255,0.40);
  display:grid;
  place-items:center;
  border: 1px solid var(--stroke);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
}
.ap-navLabel{
  font-size: 12px;
  color: rgba(0,0,0,0.55);
  line-height: 1;
  text-align:center;
}
.ap-arnie-stack{
  width: 100%;
  display:flex;
  flex-direction:column;
  gap: 10px;
  align-items:center;
  margin-top: 2px;
}
.ap-apiarioBtn{
  width: 70px;
  border-radius: 10px;
  padding: 6px 6px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap: 6px;
  cursor:pointer;
  background: transparent;
  border: none;
}
.ap-apiarioIcon{
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display:grid;
  place-items:center;
  border: 1px solid var(--stroke);
  position: relative;
  overflow:hidden;
  background: linear-gradient(to bottom,#ffffff 0%,#ffffff 32%,#5a66d9 32%,#5a66d9 100%);
  box-shadow: 0 10px 14px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.45);
}
.ap-apiarioIcon svg{ display:none; }
.ap-apiarioIcon::after{
  content:"";
  position:absolute;
  left: 50%;
  top: 64%;
  transform: translate(-50%,-50%);
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #0a0a0a;
}
.ap-selected .ap-apiarioIcon{ outline: 3px solid rgba(0,0,0,0.14); }

.ap-main{
  flex: 1;
  display:flex;
  flex-direction:column;
  gap: 10px;
  align-items: center;
}
.ap-topbar{
  width: 100%;
  display:flex;
  justify-content:center;
  align-items:center;
  padding-top: 2px;
}
.ap-title{
  font-size: 40px;
  letter-spacing: .4px;
  font-weight: 900;
  color: rgba(0,0,0,.55);
  line-height: 1;
  text-shadow: 0 3px 0 rgba(255,255,255,.22);
  text-align: center;
}
.ap-center{ width: min(820px, 100%); }

.ap-weather{
  background: var(--card);
  border-radius: 14px;
  border: 2px solid rgba(0,0,0,0.06);
  box-shadow: 0 10px 18px rgba(0,0,0,0.06);
  height: 74px;
  padding: 16px 18px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 16px;
}
.ap-temp{
  display:flex;
  flex-direction:column;
  gap: 4px;
  font-size: 26px;
  font-weight: 900;
  color: rgba(0,0,0,.55);
}
.ap-temp small{
  font-size: 12px;
  font-weight: 800;
  color: rgba(0,0,0,.45);
  line-height: 1.2;
}
.ap-sun{
  width: 54px;
  height: 54px;
  display:grid;
  place-items:center;
  position: relative;
  opacity: .8;
}
.ap-sun .c{
  position:absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 3px solid rgba(0,0,0,.55);
}
.ap-sun .ray{
  position:absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 10px;
  background: rgba(0,0,0,.55);
  border-radius: 2px;
  transform-origin: center center;
}
.ap-sun .ray:nth-child(1){ transform: translate(-50%,-50%) rotate(0deg) translateY(-18px); }
.ap-sun .ray:nth-child(2){ transform: translate(-50%,-50%) rotate(45deg) translateY(-18px); }
.ap-sun .ray:nth-child(3){ transform: translate(-50%,-50%) rotate(90deg) translateY(-18px); }
.ap-sun .ray:nth-child(4){ transform: translate(-50%,-50%) rotate(135deg) translateY(-18px); }
.ap-sun .ray:nth-child(5){ transform: translate(-50%,-50%) rotate(180deg) translateY(-18px); }
.ap-sun .ray:nth-child(6){ transform: translate(-50%,-50%) rotate(225deg) translateY(-18px); }
.ap-sun .ray:nth-child(7){ transform: translate(-50%,-50%) rotate(270deg) translateY(-18px); }
.ap-sun .ray:nth-child(8){ transform: translate(-50%,-50%) rotate(315deg) translateY(-18px); }

.ap-section-title{
  display:flex;
  align-items:center;
  gap: 10px;
  font-size: 28px;
  font-weight: 900;
  color: rgba(0,0,0,.55);
  margin: 14px 0 8px 4px;
}
.ap-pencil{
  width: 22px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to bottom,#f6d36a,#e6bb42);
  position: relative;
  transform: rotate(-20deg);
  box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.5);
}
.ap-pencil::after{
  content:"";
  position:absolute;
  right: -8px;
  top: 0;
  width: 0;
  height: 0;
  border-left: 8px solid #3a2a1a;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}
.ap-pencil::before{
  content:"";
  position:absolute;
  left: -5px;
  top: 0;
  width: 5px;
  height: 8px;
  background: #e39aa0;
  border-radius: 3px 0 0 3px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.4);
}

.ap-notes{
  background: var(--card);
  border-radius: 14px;
  border: 2px solid rgba(0,0,0,0.06);
  box-shadow: 0 10px 18px rgba(0,0,0,0.06);
  padding: 16px 16px 14px 16px;
  position: relative;
}
.ap-add{
  position:absolute;
  right: 12px;
  top: 12px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: none;
  background: rgba(0,0,0,.65);
  color: white;
  font-size: 26px;
  line-height: 40px;
  cursor:pointer;
  box-shadow: 0 10px 16px rgba(0,0,0,.22);
}
.ap-add:active{ transform: scale(.98); }

.ap-note-list{
  margin-top: 48px;
  display:flex;
  flex-direction:column;
  gap: 10px;
}
.ap-note-row{
  width: 100%;
  height: 42px;
  background: var(--panel);
  border-radius: 12px;
  border: 2px solid rgba(0,0,0,0.06);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.22);
  display:flex;
  align-items:center;
  padding: 0 14px;
}
.ap-note-date{ display:none; }
.ap-note-text{
  flex: 1;
  color: rgba(0,0,0,.45);
  font-style: normal;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ap-status{
  margin-top: 10px;
  color: rgba(0,0,0,.65);
  font-weight: 800;
  text-align:center;
}
.ap-error{
  margin-top: 10px;
  color: #7a1513;
  font-weight: 900;
  background: rgba(255,255,255,.22);
  padding: 10px 12px;
  border-radius: 12px;
  box-shadow: 0 10px 16px rgba(0,0,0,.12);
}

@media (max-width: 820px){
  .ap-shell{ flex-direction: column; }
  .ap-sidebar{ width: 100%; flex-direction: row; justify-content: space-between; }
  .ap-arnie-stack{ flex-direction: row; justify-content:center; flex-wrap: wrap; }
  .ap-title{ font-size: 34px; }
  .ap-center{ width: 100%; }
}
`}</style>

      <div className="ap-shell">
        {/* SIDEBAR */}
        <aside className="ap-sidebar">
          <div
            className="ap-navItem ap-navItemActive"
            onClick={goHome}
            role="button"
            tabIndex={0}
            title="Home"
          >
            <div className="ap-iconBox">
              <HomeIcon />
            </div>
            <div className="ap-navLabel">Home</div>
          </div>

          <div className="ap-arnie-stack">
            {arnie.map((a, idx) => {
              const arnId = a.arn_id ?? a._id ?? idx + 1;
              const selected = String(arnId) === String(selectedArniaId);

              return (
                <button
                  key={a._id || a.arn_id || idx}
                  className={`ap-apiarioBtn ${selected ? "ap-selected" : ""}`}
                  onClick={() => goToArnia(a.arn_id ?? a._id)}
                  title={`Arnia ${arnId}`}
                >
                  <div className="ap-apiarioIcon">
                    <HiveIcon />
                  </div>
                  <div className="ap-navLabel">{`Arnia ${arnId}`}</div>
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          <div className="ap-navItem" title="Download">
            <div className="ap-iconBox">
              <DownloadIcon />
            </div>
          </div>

          <div
            className="ap-navItem"
            onClick={logout}
            role="button"
            tabIndex={0}
            title="Logout"
          >
            <div className="ap-iconBox">
              <LogoutIcon />
            </div>
            <div className="ap-navLabel">Logout</div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="ap-main">
          <div className="ap-topbar">
            <div className="ap-title">{titleApiario}</div>
          </div>

          <div className="ap-center">
            {/* METEO */}
            <div className="ap-weather">
              <div className="ap-temp">
                {weatherLoading ? (
                  <>
                    Caricamento...
                    <small>
                      <br />{" "}
                    </small>
                  </>
                ) : weather ? (
                  <>
                    {Math.round(weather.temp)}°C
                    <small>
                      Max: {weather.max != null ? Math.round(weather.max) : "—"}°C
                      <br />
                      Min: {weather.min != null ? Math.round(weather.min) : "—"}°C
                    </small>
                  </>
                ) : (
                  <>
                    —
                    <small>
                      {weatherError ? (
                        <>
                          <br />
                          {weatherError}
                        </>
                      ) : (
                        <>
                          <br />
                          Meteo non disponibile
                        </>
                      )}
                    </small>
                  </>
                )}
              </div>

              <div className="ap-sun" aria-hidden="true">
                <div className="ray" />
                <div className="ray" />
                <div className="ray" />
                <div className="ray" />
                <div className="ray" />
                <div className="ray" />
                <div className="ray" />
                <div className="ray" />
                <div className="c" />
              </div>
            </div>

            {/* NOTE (locali) */}
            <div style={{ marginTop: 14 }}>
              <div className="ap-section-title">
                Note <span className="ap-pencil" />
              </div>

              <div className="ap-notes">
                <button
                  className="ap-add"
                  onClick={startEditNote}
                  title="Aggiungi / Modifica nota"
                  aria-label="Aggiungi"
                >
                  +
                </button>

                {isEditingNote ? (
                  <div
                    style={{
                      marginTop: 48,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Scrivi qui le tue note..."
                      style={{
                        width: "100%",
                        minHeight: 120,
                        resize: "vertical",
                        padding: 12,
                        borderRadius: 12,
                        border: "2px solid rgba(0,0,0,0.10)",
                        background: "rgba(255,255,255,0.35)",
                        color: "rgba(0,0,0,0.70)",
                        outline: "none",
                        fontSize: 14,
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => {
                          setIsEditingNote(false);
                          setNoteSavedMsg("");
                          try {
                            const raw = localStorage.getItem(notesStorageKey);
                            const parsed = raw ? JSON.parse(raw) : null;
                            setNoteText(String(parsed?.text ?? ""));
                          } catch {}
                        }}
                        style={{
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: "rgba(0,0,0,0.25)",
                          color: "white",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Annulla
                      </button>

                      <button
                        onClick={saveLocalNote}
                        style={{
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: "rgba(0,0,0,0.70)",
                          color: "white",
                          fontWeight: 900,
                          cursor: "pointer",
                          boxShadow: "0 10px 16px rgba(0,0,0,.18)",
                        }}
                      >
                        Salva
                      </button>
                    </div>

                    {noteSavedMsg && (
                      <div
                        style={{
                          fontWeight: 900,
                          color: "rgba(0,0,0,0.60)",
                        }}
                      >
                        {noteSavedMsg}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ap-note-list">
                    {noteText?.trim() ? (
                      noteText
                        .split("\n")
                        .filter((x) => x.trim().length > 0)
                        .slice(0, 4)
                        .map((line, i) => (
                          <div className="ap-note-row" key={i}>
                            <div className="ap-note-date">—</div>
                            <div className="ap-note-text">“{line}”</div>
                          </div>
                        ))
                    ) : (
                      <>
                        <div className="ap-note-row">
                          <div className="ap-note-date">—</div>
                          <div className="ap-note-text">
                            “Nessuna nota salvata per questa arnia”
                          </div>
                        </div>
                        <div className="ap-note-row">
                          <div className="ap-note-date">—</div>
                          <div className="ap-note-text">
                            “Premi + per aggiungerne una”
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isLoading && <div className="ap-status">Caricamento...</div>}
            {error && <div className="ap-error">{error}</div>}

            {/* DEBUG: qui vedi davvero quali campi ha il record apiario */}
            <details style={{ marginTop: 12, opacity: 0.9 }}>
              <summary style={{ cursor: "pointer" }}>Debug</summary>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                route id (api_id) = {String(id)}
                {"\n"}Trovate arnie = {String(arnie.length)}
                {"\n"}Apiario = {apiario ? JSON.stringify(apiario, null, 2) : "nessuno"}
                {"\n"}Coord estratte ={" "}
                {apiario ? JSON.stringify(extractLatLon(apiario), null, 2) : "—"}
                {"\n"}Esempio record arnia ={" "}
                {arnie[0] ? JSON.stringify(arnie[0], null, 2) : "nessuno"}
              </pre>
            </details>

            {/* notifiche le lasciamo nello state (se ti servono dopo) */}
          </div>
        </main>
      </div>
    </div>
  );
}
