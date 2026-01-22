import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const RESTDB_BASE = "https://clone4-9a15.restdb.io/rest";

// ⚠️ Metti i nomi ESATTI delle collezioni su RestDB
const COL_ARNIA = "arnie";
const COL_SENSORE = "sensori";
const COL_TIPO = "tipi";
const COL_RILEVAZIONE = "rilevazioni";
const COL_NOTIFICA = "notifiche";

export default function ArniaPage() {
  const { id } = useParams(); // /arnia/:id (qui id = arn_id)

  const [apik, setApik] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [arnia, setArnia] = useState(null);

  const [notifiche, setNotifiche] = useState([]);

  const [sensori, setSensori] = useState([]);
  const [tipi, setTipi] = useState([]);
  const [rilevazioni, setRilevazioni] = useState([]);

  const [soglie, setSoglie] = useState({
    peso: 0,
    temperatura: 0,
    umidita: 0,
  });

  // ✅ AGGIUNTA: draft min/max per modifiche
  const [draftSoglie, setDraftSoglie] = useState({}); // key: sensoriarnia._id -> {min,max}
  const [savingId, setSavingId] = useState(null);

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

        if (!arniaRes.ok) {
          const txt = await arniaRes.text().catch(() => "");
          throw new Error(`Errore caricamento arnia. Status=${arniaRes.status}. ${txt}`);
        }

        const arniaArr = await arniaRes.json();
        const arniaObj = Array.isArray(arniaArr) ? arniaArr[0] : null;
        if (!arniaObj) throw new Error("Arnia non trovata (arn_id).");
        setArnia(arniaObj);

        // 2) TIPI
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

        // 3) SENSORI (sensoriarnia) di questa arnia
        const sensRes = await fetch(`${RESTDB_BASE}/sensoriarnia?q={"sea_arn_id":${id}}`, {
          method: "GET",
          headers: {
            "x-apikey": apik,
            "Content-Type": "application/json",
            "cache-control": "no-cache",
          },
        });

        const sensData = await sensRes.json();
        const sensArr = Array.isArray(sensData) ? sensData : [];
        const sensTypeId = sensArr.map((s) => s.sea_tip_id);

        const sensStr = await fetch(
          `${RESTDB_BASE}/tipirilevazione?q={"tip_id":{"$in":${JSON.stringify(
            sensTypeId.concat(sensTypeId)
          )}}}`,
          {
            method: "GET",
            headers: {
              "x-apikey": apik,
              "Content-Type": "application/json",
              "cache-control": "no-cache",
            },
          }
        );

        const tipiDataRil = await sensStr.json();

        if (!sensRes.ok) {
          const txt = await sensRes.text().catch(() => "");
          throw new Error(`Errore caricamento sensori. Status=${sensRes.status}. ${txt}`);
        }

        setSensori(sensArr);

        // ✅ AGGIUNTA: inizializzo draftSoglie con sea_min/sea_max
        setDraftSoglie((prev) => {
          const next = { ...prev };
          for (const s of sensArr) {
            if (!s?._id) continue; // serve per PATCH
            next[s._id] = {
              min: s.sea_min ?? "",
              max: s.sea_max ?? "",
            };
          }
          return next;
        });

        const sensIdsNum = sensArr
          .map((s) => {
            const v = s.sea_id;
            return isNaN(Number(v)) ? null : Number(v);
          })
          .filter((v) => v !== null);

        // ✅ 4) RILEVAZIONI
        console.log("Sensori caricati:", sensIdsNum);

        if (sensIdsNum.length === 0) {
          setRilevazioni([]);
        } else {
          const rilUrl = `${RESTDB_BASE}/${COL_RILEVAZIONE}?q={"ril_sea_id":{"$in":${JSON.stringify(
            sensIdsNum.concat(sensIdsNum)
          )}}}&h={"$orderby": {"ril_dataOra": -1}}`;

          const rilRes = await fetch(rilUrl, {
            method: "GET",
            headers: {
              "x-apikey": apik,
              "Content-Type": "application/json",
              "cache-control": "no-cache",
            },
          });

          if (!rilRes.ok) {
            const txt = await rilRes.text().catch(() => "");
            throw new Error(
              `Errore caricamento rilevazioni. Status=${rilRes.status}. ${txt}`
            );
          }

          const rilData = await rilRes.json();
          const rilArr = Array.isArray(rilData) ? rilData : [];

          const sensori = sensArr.map((s) => {
            const tipo = tipiDataRil.find(
              (t) => String(t.tip_id) === String(s.sea_tip_id)
            );
            return {
              sea_id: s.sea_id,
              sea_tip_id: s.sea_tip_id,
              tip_tipologia: tipo?.tip_tipologia || "",
            };
          });

          const rilArrWithTipo = rilArr.map((r) => {
            const sens = sensori.find((s) => String(s.sea_id) === String(r.ril_sea_id));
            return {
              ...r,
              _tipo: sens ? sens.tip_tipologia : "",
            };
          });

          setRilevazioni(rilArrWithTipo);
        }

        // 5) NOTIFICHE
        const qNotif = encodeURIComponent(
          JSON.stringify({
            $or: [{ not_arn_id: Number(id) }, { not_arn_id: String(id) }],
          })
        );

        const notifTry = await fetch(
          `${RESTDB_BASE}/${COL_NOTIFICA}?q=${qNotif}&sort=-_created`,
          {
            method: "GET",
            headers: {
              "x-apikey": apik,
              "Content-Type": "application/json",
              "cache-control": "no-cache",
            },
          }
        );

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

  function goHome() {
    window.location.href = "/home";
  }

  function goBackToApiario() {
    const apiId = arnia?.arn_api_id;
    if (!apiId) return;
    window.location.href = `/apiario/${apiId}`;
  }

  function logout() {
    localStorage.removeItem("apik");
    window.location.href = "/";
  }

  const stato = useMemo(() => {
    if (!arnia) return "—";
    return arnia.arn_piena ? "OK" : "NON OK";
  }, [arnia]);

  // ---- ⬇⬇⬇  FUNZIONALITÀ MODIFICA SOGLIE (NUOVA)  ⬇⬇⬇ ----

  // Cerca sensore in sensoriarnia per tipologia (usando tipirilevazione tip_tipologia dentro rilevazioni)
  function findSensoreByTipoIncludes(needle) {
    const target = String(needle || "").toLowerCase();
    // best effort: prova a dedurre dai tipi delle rilevazioni (sea_tip_id)
    // se nel DB hai un campo "tip_tipologia" direttamente in sensoriarnia, puoi usare quello.
    // Qui facciamo un match grezzo: scegliamo il sensore che ha un tipo che appare nelle rilevazioni arricchite.
    const tipoSet = new Set(
      rilevazioni
        .map((r) => String(r._tipo || "").toLowerCase())
        .filter(Boolean)
    );

    // provo a trovare un tipo che contiene needle
    const matchedTipo = Array.from(tipoSet).find((t) => t.includes(target));
    if (!matchedTipo) return null;

    // trovo un sensore che corrisponde a quel tipo tramite sea_tip_id:
    // (non abbiamo in sensoriarr il nome tipo, quindi usiamo la prima rilevazione che ha quel tipo
    // e risaliamo a ril_sea_id -> sea_id)
    const r = rilevazioni.find((x) => String(x._tipo || "").toLowerCase().includes(target));
    if (!r) return null;

    const seaId = r.ril_sea_id;
    return sensori.find((s) => String(s.sea_id) === String(seaId)) || null;
  }

  // Salva soglie su DB (PATCH, così non serve inviare sea_id ecc.)
  async function saveSoglie(sensor) {
    if (!sensor?._id) {
      setError("Impossibile salvare: manca _id del record sensoriarnia.");
      return;
    }

    const draft = draftSoglie[sensor._id];
    if (!draft) return;

    const newMin = draft.min === "" ? null : Number(draft.min);
    const newMax = draft.max === "" ? null : Number(draft.max);

    // Validazione base
    if (newMin !== null && Number.isNaN(newMin)) return;
    if (newMax !== null && Number.isNaN(newMax)) return;
    if (newMin !== null && newMax !== null && newMin > newMax) {
      setError("Errore: min non può essere maggiore di max.");
      return;
    }

    setSavingId(sensor._id);
    setError("");

    try {
      const res = await fetch(`${RESTDB_BASE}/sensoriarnia/${sensor._id}`, {
        method: "PATCH",
        headers: {
          "x-apikey": apik,
          "Content-Type": "application/json",
          "cache-control": "no-cache",
        },
        body: JSON.stringify({
          sea_min: newMin,
          sea_max: newMax,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Errore salvataggio soglie. Status=${res.status}. ${txt}`);
      }

      // aggiorna lo state sensori
      setSensori((prev) =>
        prev.map((s) =>
          s._id === sensor._id ? { ...s, sea_min: newMin, sea_max: newMax } : s
        )
      );
    } catch (e) {
      console.error(e);
      setError(e?.message || "Errore salvataggio soglie.");
    } finally {
      setSavingId(null);
    }
  }

  function renderSogliaRow(label, sensor) {
    if (!sensor) return null;
    const d = draftSoglie[sensor._id] || { min: "", max: "" };

    return (
      <div style={{ marginBottom: 14 }}>
        <b>{label}</b>{" "}
        <small style={{ opacity: 0.7 }}>
          (DB: min={String(sensor.sea_min)} max={String(sensor.sea_max)})
        </small>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            Min{" "}
            <input
              type="number"
              value={d.min}
              onChange={(e) =>
                setDraftSoglie((p) => ({
                  ...p,
                  [sensor._id]: { ...p[sensor._id], min: e.target.value },
                }))
              }
              style={{ width: 90 }}
            />
          </label>

          <label>
            Max{" "}
            <input
              type="number"
              value={d.max}
              onChange={(e) =>
                setDraftSoglie((p) => ({
                  ...p,
                  [sensor._id]: { ...p[sensor._id], max: e.target.value },
                }))
              }
              style={{ width: 90 }}
            />
          </label>

          <button onClick={() => saveSoglie(sensor)} disabled={savingId === sensor._id}>
            {savingId === sensor._id ? "Salvo..." : "Salva"}
          </button>
        </div>
      </div>
    );
  }

  // ---- ⬆⬆⬆  FINE FUNZIONALITÀ MODIFICA SOGLIE  ⬆⬆⬆ ----

  const rilevazioniArnia = useMemo(() => {
    // nel tuo caso stai usando sea_id, quindi non filtriamo per sen_id
    return (Array.isArray(rilevazioni) ? rilevazioni : []).slice(0, 30);
  }, [rilevazioni]);

  // Per i valori: già fai find su rilevazioni con _tipo
  return (
    <div>
      <h1>Arnia</h1>

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

      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <div><b>arn_id:</b> {id}</div>
        <div><b>arn_api_id:</b> {arnia?.arn_api_id ?? "-"}</div>
        <div><b>arn_dataInst:</b> {arnia?.arn_dataInst ?? "-"}</div>
        <div><b>arn_piena:</b> {String(arnia?.arn_piena)}</div>
        <div><b>arn_MacAddress:</b> {arnia?.arn_MacAddress ?? "-"}</div>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>F5.4 - Valori</h2>
        <ul>
          <li><b>Peso:</b> {rilevazioni.find(r => r._tipo?.toLowerCase().includes("peso"))?.ril_dato ?? "—"}</li>
          <li><b>Temperatura:</b> {rilevazioni.find(r => r._tipo?.toLowerCase().includes("temperatura"))?.ril_dato ?? "—"}</li>
          <li><b>Umidità:</b> {rilevazioni.find(r => r._tipo?.toLowerCase().includes("umid"))?.ril_dato ?? "—"}</li>
        </ul>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>Notifiche (F5.3)</h2>
        <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #eee", padding: 8 }}>
          {!notifiche.length ? (
            <p>Nessuna notifica.</p>
          ) : (
            <ul>
              {notifiche.map((n) => (
                <li key={n._id} style={{ marginBottom: 10 }}>
                  <div><b>{n.not_titolo || n.title || "Notifica"}</b></div>
                  <div>{n.not_desc || n.message || ""}</div>
                  <small>{n._created ? new Date(n._created).toLocaleString() : ""}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
        <h2>F5.5 - Grafici (placeholder)</h2>
        {!rilevazioniArnia.length ? (
          <p>Nessuna rilevazione trovata per questa arnia.</p>
        ) : (
          <ul>
            {rilevazioniArnia.map((r) => (
              <li key={r._id}>
                sea_id={r.ril_sea_id} | tipo={r._tipo || "?"} | dato={r.ril_dato} | data={r.ril_dataOra}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ✅ QUI: sostituzione del blocco soglie con min/max editabili */}
      <div style={{ border: "1px solid #ccc", padding: 12 }}>
        <h2>Soglie (min / max) — salvate in sensoriarnia</h2>

        {renderSogliaRow("Peso", findSensoreByTipoIncludes("peso"))}
        {renderSogliaRow("Temperatura", findSensoreByTipoIncludes("temperatura"))}
        {renderSogliaRow("Umidità", findSensoreByTipoIncludes("umid"))}
      </div>
    </div>
  );
}
