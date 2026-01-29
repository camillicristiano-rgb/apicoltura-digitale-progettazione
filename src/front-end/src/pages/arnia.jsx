import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

//const RESTDB_BASE = import.meta.env.VITE_RESTDB_BASE;
const RESTDB_BASE = "https://databaseprova-82e0.restdb.io";

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

  // ✅ UI: notifica selezionata (modal)
  const [openNotifica, setOpenNotifica] = useState(null);

  // ✅ UI: toggle sensori (switch)
  const [togglingId, setTogglingId] = useState(null);

  // ✅ interna: tipirilevazione arricchita (per match robusto)
  const [tipiRilevazione, setTipiRilevazione] = useState([]);

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
        setTipiRilevazione(Array.isArray(tipiDataRil) ? tipiDataRil : []);

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
            throw new Error(`Errore caricamento rilevazioni. Status=${rilRes.status}. ${txt}`);
          }

          const rilData = await rilRes.json();
          const rilArr = Array.isArray(rilData) ? rilData : [];

          const sensori = sensArr.map((s) => {
            const tipo = (Array.isArray(tipiDataRil) ? tipiDataRil : []).find(
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

  function findSensoreByTipoIncludes(needle) {
    const target = String(needle || "").toLowerCase();

    const candidates = sensori
      .map((s) => {
        const tr = (Array.isArray(tipiRilevazione) ? tipiRilevazione : []).find(
          (t) => String(t.tip_id) === String(s.sea_tip_id)
        );
        return { sensor: s, name: String(tr?.tip_tipologia || "").toLowerCase() };
      })
      .filter((x) => x.name);

    const best = candidates.find((x) => x.name.includes(target));
    if (best) return best.sensor;

    const r = rilevazioni.find((x) => String(x._tipo || "").toLowerCase().includes(target));
    if (!r) return null;
    const seaId = r.ril_sea_id;
    return sensori.find((s) => String(s.sea_id) === String(seaId)) || null;
  }

  async function saveSoglie(sensor) {
    if (!sensor?._id) {
      setError("Impossibile salvare: manca _id del record sensoriarnia.");
      return;
    }

    const draft = draftSoglie[sensor._id];
    if (!draft) return;

    const newMin = draft.min === "" ? null : Number(draft.min);
    const newMax = draft.max === "" ? null : Number(draft.max);

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

      setSensori((prev) =>
        prev.map((s) => (s._id === sensor._id ? { ...s, sea_min: newMin, sea_max: newMax } : s))
      );
    } catch (e) {
      console.error(e);
      setError(e?.message || "Errore salvataggio soglie.");
    } finally {
      setSavingId(null);
    }
  }

  // ✅ Switch sensore: salva su DB il campo sea_stato (true/false)
  async function toggleSensore(sensor) {
    if (!sensor?._id) return;

    const current = Boolean(sensor.sea_stato ?? sensor.sea_attivo ?? sensor.sea_on ?? sensor.sea_enabled ?? true);
    const next = !current;

    setTogglingId(sensor._id);
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
          sea_stato: next, // ✅ richiesto
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Errore toggle sensore. Status=${res.status}. ${txt}`);
      }

      setSensori((prev) => prev.map((s) => (s._id === sensor._id ? { ...s, sea_stato: next } : s)));
    } catch (e) {
      console.error(e);
      setError(e?.message || "Errore toggle sensore.");
    } finally {
      setTogglingId(null);
    }
  }

  function renderSogliaRow(label, sensor) {
    if (!sensor) return null;
    const d = draftSoglie[sensor._id] || { min: "", max: "" };

    return (
      <div className="ar-th-row">
        <div className="ar-th-left">
          <div className="ar-th-label">{label}</div>
          <div className="ar-th-sub">
            Min: <b>{sensor.sea_min ?? "—"}</b> · Max: <b>{sensor.sea_max ?? "—"}</b>
          </div>
        </div>

        <div className="ar-th-controls">
          <div className="ar-step">
            <div className="ar-step-badge">Min</div>
            <button
              className="ar-step-btn"
              onClick={() =>
                setDraftSoglie((p) => ({
                  ...p,
                  [sensor._id]: {
                    ...p[sensor._id],
                    min:
                      p?.[sensor._id]?.min === "" || p?.[sensor._id]?.min == null
                        ? 0
                        : Number(p[sensor._id].min) - 1,
                  },
                }))
              }
              title="Diminuisci"
            >
              −
            </button>
            <input
              className="ar-step-input"
              type="number"
              value={d.min}
              onChange={(e) =>
                setDraftSoglie((p) => ({
                  ...p,
                  [sensor._id]: { ...p[sensor._id], min: e.target.value },
                }))
              }
            />
            <button
              className="ar-step-btn"
              onClick={() =>
                setDraftSoglie((p) => ({
                  ...p,
                  [sensor._id]: {
                    ...p[sensor._id],
                    min:
                      p?.[sensor._id]?.min === "" || p?.[sensor._id]?.min == null
                        ? 1
                        : Number(p[sensor._id].min) + 1,
                  },
                }))
              }
              title="Aumenta"
            >
              +
            </button>
          </div>

          <div className="ar-step">
            <div className="ar-step-badge">Max</div>
            <button
              className="ar-step-btn"
              onClick={() =>
                setDraftSoglie((p) => ({
                  ...p,
                  [sensor._id]: {
                    ...p[sensor._id],
                    max:
                      p?.[sensor._id]?.max === "" || p?.[sensor._id]?.max == null
                        ? 0
                        : Number(p[sensor._id].max) - 1,
                  },
                }))
              }
              title="Diminuisci"
            >
              −
            </button>
            <input
              className="ar-step-input"
              type="number"
              value={d.max}
              onChange={(e) =>
                setDraftSoglie((p) => ({
                  ...p,
                  [sensor._id]: { ...p[sensor._id], max: e.target.value },
                }))
              }
            />
            <button
              className="ar-step-btn"
              onClick={() =>
                setDraftSoglie((p) => ({
                  ...p,
                  [sensor._id]: {
                    ...p[sensor._id],
                    max:
                      p?.[sensor._id]?.max === "" || p?.[sensor._id]?.max == null
                        ? 1
                        : Number(p[sensor._id].max) + 1,
                  },
                }))
              }
              title="Aumenta"
            >
              +
            </button>
          </div>

          <button className="ar-save" onClick={() => saveSoglie(sensor)} disabled={savingId === sensor._id}>
            {savingId === sensor._id ? "..." : "Salva"}
          </button>
        </div>
      </div>
    );
  }

  // ---- ⬆⬆⬆  FINE FUNZIONALITÀ MODIFICA SOGLIE  ⬆⬆⬆ ----

  const rilevazioniArnia = useMemo(() => {
    return (Array.isArray(rilevazioni) ? rilevazioni : []).slice(0, 200);
  }, [rilevazioni]);

  const valPeso = useMemo(() => {
    return rilevazioni.find((r) => r._tipo?.toLowerCase().includes("peso"))?.ril_dato ?? null;
  }, [rilevazioni]);
  const valTemp = useMemo(() => {
    return rilevazioni.find((r) => r._tipo?.toLowerCase().includes("temperatura"))?.ril_dato ?? null;
  }, [rilevazioni]);
  const valUmi = useMemo(() => {
    return rilevazioni.find((r) => r._tipo?.toLowerCase().includes("umid"))?.ril_dato ?? null;
  }, [rilevazioni]);

  const sensorPeso = useMemo(() => findSensoreByTipoIncludes("peso"), [sensori, tipiRilevazione, rilevazioni]);
  const sensorTemp = useMemo(
    () => findSensoreByTipoIncludes("temperatura"),
    [sensori, tipiRilevazione, rilevazioni]
  );
  const sensorUmi = useMemo(() => findSensoreByTipoIncludes("umid"), [sensori, tipiRilevazione, rilevazioni]);

  const num = (v) => {
    if (v === null || v === undefined || v === "—") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const isOut = (value, sensor) => {
    const x = num(value);
    if (x == null || !sensor) return false;
    const min = sensor.sea_min;
    const max = sensor.sea_max;
    if (min != null && min !== "" && Number.isFinite(Number(min)) && x < Number(min)) return true;
    if (max != null && max !== "" && Number.isFinite(Number(max)) && x > Number(max)) return true;
    return false;
  };

  const alarmIsOk = useMemo(() => {
    const outPeso = isOut(valPeso, sensorPeso);
    const outTemp = isOut(valTemp, sensorTemp);
    const outUmi = isOut(valUmi, sensorUmi);
    return !(outPeso || outTemp || outUmi);
  }, [valPeso, valTemp, valUmi, sensorPeso, sensorTemp, sensorUmi]);

  const alarmText = useMemo(() => {
    const name = arnia?.arn_nome || `Arnia ${id}`;
    const s = alarmIsOk ? "OK" : "NON OK";
    return `${name} · ${s}`;
  }, [arnia, id, alarmIsOk]);

  const pesoSeries = useMemo(() => {
    const rows = (Array.isArray(rilevazioni) ? rilevazioni : [])
      .filter((r) => String(r._tipo || "").toLowerCase().includes("peso"))
      .map((r) => ({
        t: r.ril_dataOra ? new Date(r.ril_dataOra).getTime() : null,
        v: num(r.ril_dato),
      }))
      .filter((x) => x.t != null && x.v != null)
      .sort((a, b) => a.t - b.t)
      .slice(-30);
    return rows;
  }, [rilevazioni]);

  const tempSeries = useMemo(() => {
    const rows = (Array.isArray(rilevazioni) ? rilevazioni : [])
      .filter((r) => String(r._tipo || "").toLowerCase().includes("temperatura"))
      .map((r) => ({
        t: r.ril_dataOra ? new Date(r.ril_dataOra).getTime() : null,
        v: num(r.ril_dato),
      }))
      .filter((x) => x.t != null && x.v != null)
      .sort((a, b) => a.t - b.t)
      .slice(-30);
    return rows;
  }, [rilevazioni]);

  const umiSeries = useMemo(() => {
    const rows = (Array.isArray(rilevazioni) ? rilevazioni : [])
      .filter((r) => String(r._tipo || "").toLowerCase().includes("umid"))
      .map((r) => ({
        t: r.ril_dataOra ? new Date(r.ril_dataOra).getTime() : null,
        v: num(r.ril_dato),
      }))
      .filter((x) => x.t != null && x.v != null)
      .sort((a, b) => a.t - b.t)
      .slice(-30);
    return rows;
  }, [rilevazioni]);

  // Recharts AreaChart (shadcn charts style)
  function PesoAreaChart({ data }) {
    if (!data || data.length < 2) {
      return <div className="ar-chart-empty">Nessun dato (peso) per disegnare il grafico.</div>;
    }

    return (
      <ChartContainer className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 6, right: 8, top: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="areaPeso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d15b5b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#d15b5b" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.15)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              tick={{ fontSize: 11, fill: "rgba(0,0,0,.6)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(0,0,0,.6)" }}
              axisLine={false}
              tickLine={false}
              width={34}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [String(value), "Peso"]}
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                />
              }
            />
            <Area type="monotone" dataKey="v" stroke="#d15b5b" strokeWidth={3} fill="url(#areaPeso)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  function TempAreaChart({ data }) {
    if (!data || data.length < 2) {
      return <div className="ar-chart-empty">Nessun dato (temperatura) per disegnare il grafico.</div>;
    }

    return (
      <ChartContainer className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 6, right: 8, top: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="areaTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e0a33a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#e0a33a" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.15)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              tick={{ fontSize: 11, fill: "rgba(0,0,0,.6)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(0,0,0,.6)" }}
              axisLine={false}
              tickLine={false}
              width={34}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} °C`, "Temperatura"]}
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                />
              }
            />
            <Area type="monotone" dataKey="v" stroke="#e0a33a" strokeWidth={3} fill="url(#areaTemp)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  function UmiAreaChart({ data }) {
    if (!data || data.length < 2) {
      return <div className="ar-chart-empty">Nessun dato (umidità) per disegnare il grafico.</div>;
    }

    return (
      <ChartContainer className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 6, right: 8, top: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="areaUmi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3aa0e0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3aa0e0" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.15)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              tick={{ fontSize: 11, fill: "rgba(0,0,0,.6)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(0,0,0,.6)" }}
              axisLine={false}
              tickLine={false}
              width={34}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} %`, "Umidità"]}
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                />
              }
            />
            <Area type="monotone" dataKey="v" stroke="#3aa0e0" strokeWidth={3} fill="url(#areaUmi)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  // --- ICONE (copiate da ApiarioPage) ---
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
      <path d="M18 9l3 3-3 3" stroke="#d15b5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const BackIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="rgba(0,0,0,0.55)" strokeWidth="2" />
      <path
        d="M13.8 8.8L10.7 12l3.1 3.2"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // ✅ Helpers notifiche: titolo / descrizione / data
  const getNotifTitle = (n) => String(n?.not_titolo ?? n?.title ?? "Notifica");
  const getNotifDesc = (n) =>
    String(
      n?.not_desc ??
        n?.not_dex ?? // (nel tuo screenshot c'è not_dex)
        n?.not_testo ??
        n?.not_message ??
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

  // ✅✅✅ AGGIUNTA: data/ora presa DAL DB RILEVAZIONI (ril_dataOra)
  const extractNumber = (txt) => {
    const m = String(txt || "").replace(",", ".").match(/(-?\d+(\.\d+)?)/);
    return m ? Number(m[1]) : null;
  };
  const formatDateTime = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString();
  };

  const getNotifDateFromRilevazioni = (n) => {
    if (!n) return "";

    // 1) se la notifica ha un ril_id (es. not_ril_id) → match diretto
    const rilId = n?.not_ril_id ?? n?.ril_id ?? null;
    if (rilId != null) {
      const r = (rilevazioni || []).find((x) => String(x.ril_id) === String(rilId));
      if (r?.ril_dataOra) return formatDateTime(r.ril_dataOra);
    }

    // 2) se la notifica ha un sea_id (es. not_sea_id) → ultima rilevazione di quel sensore
    const seaId = n?.not_sea_id ?? n?.sea_id ?? null;
    if (seaId != null) {
      const rr = (rilevazioni || [])
        .filter((x) => String(x.ril_sea_id) === String(seaId))
        .sort((a, b) => new Date(b.ril_dataOra) - new Date(a.ril_dataOra));
      if (rr[0]?.ril_dataOra) return formatDateTime(rr[0].ril_dataOra);
    }

    // 3) fallback: deduco tipo da testo e prendo ultima rilevazione del sensore corrispondente
    const text = `${getNotifTitle(n)} ${getNotifDesc(n)}`.toLowerCase();

    let targetSeaId = null;
    if (text.includes("peso")) targetSeaId = sensorPeso?.sea_id;
    else if (text.includes("temp")) targetSeaId = sensorTemp?.sea_id;
    else if (text.includes("umid")) targetSeaId = sensorUmi?.sea_id;

    if (targetSeaId != null) {
      const targetVal = extractNumber(text);

      const candidates = (rilevazioni || [])
        .filter((x) => String(x.ril_sea_id) === String(targetSeaId))
        .sort((a, b) => new Date(b.ril_dataOra) - new Date(a.ril_dataOra));

      if (!candidates.length) return "";

      // Se nel testo c'è un numero (es: 50kg), prova a prendere la rilevazione con stesso valore
      if (targetVal != null) {
        const near = candidates.find((x) => {
          const v = num(x.ril_dato);
          return v != null && Math.abs(v - targetVal) < 0.0001;
        });
        if (near?.ril_dataOra) return formatDateTime(near.ril_dataOra);
      }

      // fallback: ultima rilevazione
      return formatDateTime(candidates[0]?.ril_dataOra);
    }

    return "";
  };

  // UI helper: chip valore (rosso se fuori soglia)
  const ValueChip = ({ label, value, sensor, unit }) => {
    const off = isOut(value, sensor);
    const active = Boolean(sensor?.sea_stato ?? sensor?.sea_attivo ?? sensor?.sea_on ?? sensor?.sea_enabled ?? true);
    return (
      <div className={`ar-chip ${off ? "ar-chip-bad" : ""} ${!active ? "ar-chip-off" : ""}`}>
        <div className="ar-chip-icon" aria-hidden="true">
          {label === "Peso" ? "⚖️" : label === "Temperatura" ? "🌡️" : "💧"}
        </div>
        <div className="ar-chip-main">
          <div className="ar-chip-title">{label}</div>
          <div className="ar-chip-value">
            {value == null ? "—" : String(value)}
            {unit ? <span className="ar-chip-unit">{unit}</span> : null}
          </div>
          <div className="ar-chip-sub">
            <span>Min {sensor?.sea_min ?? "—"}</span>
            <span>Max {sensor?.sea_max ?? "—"}</span>
          </div>
        </div>
      </div>
    );
  };

  const Switch = ({ checked, onChange, disabled }) => {
    return (
      <button
        className={`ar-switch ${checked ? "ar-switch-on" : ""} ${disabled ? "ar-switch-dis" : ""}`}
        onClick={onChange}
        disabled={disabled}
        type="button"
        aria-pressed={checked}
        title={checked ? "Acceso" : "Spento"}
      >
        <span className="ar-switch-dot" />
      </button>
    );
  };

  const sensorActive = (s) => Boolean(s?.sea_stato ?? s?.sea_attivo ?? s?.sea_on ?? s?.sea_enabled ?? true);

  const labelForSensor = (s, fallback) => {
    if (!s) return fallback;
    const tr = (Array.isArray(tipiRilevazione) ? tipiRilevazione : []).find(
      (t) => String(t.tip_id) === String(s.sea_tip_id)
    );
    return tr?.tip_tipologia || fallback;
  };

  return (
    <div className="ar-wrap">
      <style>{`
:root{
  --bg: #f5d88b;
  --sidebar: #f1d083;
  --card: #f2d48a;
  --panel: #d7b974;
  --shadow: rgba(0,0,0,.14);
  --text: rgba(0,0,0,.55);
  --stroke: rgba(0,0,0,.07);
  --ok: #56c271;
  --bad: #cc5a5a;
}
*{ box-sizing:border-box; }

.ar-wrap{
  min-height: 100vh;
  background: var(--bg);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
  display:flex;
  padding: 10px;
}
.ar-shell{
  width: 100%;
  margin: 0 auto;
  display:flex;
  gap: 14px;
  align-items: stretch;
}

/* SIDEBAR (come ApiarioPage) */
.ar-sidebar{
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
.ar-navItem{
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
.ar-navItemActive{
  background: rgba(255,255,255,0.28);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
}
.ar-iconBox{
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(255,255,255,0.40);
  display:grid;
  place-items:center;
  border: 1px solid var(--stroke);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
}
.ar-navLabel{
  font-size: 12px;
  color: rgba(0,0,0,0.55);
  line-height: 1;
  text-align:center;
}
.ar-spacer{ flex: 1; }

/* MAIN */
.ar-main{
  flex: 1;
  display:flex;
  flex-direction:column;
  gap: 10px;
  align-items: center;
}
.ar-center{ width: min(980px, 100%); }

/* top header (ALLARME) */
.ar-top{
  width: 100%;
  display:flex;
  align-items:center;
  gap: 10px;
}
.ar-topTitle{
  flex: 1;
  background: ${alarmIsOk ? "rgba(86,194,113,.95)" : "rgba(204,90,90,.95)"};
  color: rgba(255,255,255,.95);
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 900;
  letter-spacing: .6px;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow: 0 10px 18px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.25);
}
.ar-topTitle small{
  font-weight: 800;
  opacity: .95;
  margin-left: 10px;
}

/* layout 2 colonne come mock */
.ar-grid{
  display:grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 14px;
  margin-top: 8px;
}
.ar-card{
  background: var(--card);
  border-radius: 14px;
  border: 2px solid rgba(0,0,0,0.06);
  box-shadow: 0 10px 18px rgba(0,0,0,0.06);
  padding: 12px;
}
.ar-titleRow{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap: 10px;
  padding: 2px 4px 8px 4px;
}
.ar-h1{
  font-size: 40px;
  letter-spacing: .4px;
  font-weight: 900;
  color: rgba(0,0,0,.55);
  line-height: 1;
  text-shadow: 0 3px 0 rgba(255,255,255,.22);
  margin: 0;
}
.ar-h2{
  font-size: 28px;
  font-weight: 900;
  color: rgba(0,0,0,.55);
  margin: 0;
}
.ar-panel{
  background: rgba(255,255,255,.22);
  border: 2px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 12px;
}

/* chips */
.ar-chips{
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ar-chip{
  background: rgba(255,255,255,.24);
  border: 2px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 10px;
  display:flex;
  gap: 10px;
  align-items:center;
  min-height: 88px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.25);
}
.ar-chip-bad{
  outline: 3px solid rgba(204,90,90,.28);
}
.ar-chip-off{
  opacity: .55;
}
.ar-chip-icon{
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(255,255,255,.40);
  display:grid;
  place-items:center;
  border: 1px solid var(--stroke);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.35);
  font-size: 22px;
}
.ar-chip-main{ flex: 1; }
.ar-chip-title{
  font-weight: 900;
  color: rgba(0,0,0,.55);
  margin-bottom: 2px;
}
.ar-chip-value{
  font-size: 20px;
  font-weight: 900;
  color: rgba(0,0,0,.60);
  line-height: 1.1;
}
.ar-chip-unit{
  font-size: 12px;
  font-weight: 900;
  opacity: .55;
  margin-left: 6px;
}
.ar-chip-sub{
  display:flex;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
  opacity: .55;
  margin-top: 4px;
}

/* switch */
.ar-switch{
  width: 44px;
  height: 24px;
  border-radius: 999px;
  border: none;
  background: rgba(204,90,90,.75);
  position: relative;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.25);
}
.ar-switch-on{ background: rgba(86,194,113,.85); }
.ar-switch-dis{ opacity: .6; cursor: not-allowed; }
.ar-switch-dot{
  position:absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(255,255,255,.95);
  box-shadow: 0 6px 12px rgba(0,0,0,.18);
  transition: transform .18s ease;
}
.ar-switch-on .ar-switch-dot{ transform: translateX(20px); }

/* notifiche */
.ar-notifs{
  position: relative;
  padding-right: 10px;
}
.ar-scroll{
  max-height: 240px;
  overflow:auto;
  border-radius: 14px;
}
.ar-notifRow{
  background: rgba(255,255,255,.22);
  border: 2px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 10px 12px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  margin-bottom: 10px;
  cursor:pointer;
}
.ar-notifRow:hover{ transform: translateY(-1px); }
.ar-notifTitle{
  font-weight: 900;
  color: rgba(0,0,0,.60);
  margin-bottom: 4px;
}
.ar-notifSub{
  font-size: 12px;
  font-weight: 800;
  opacity: .6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}
.ar-pillDate{
  font-size: 12px;
  font-weight: 900;
  opacity: .55;
  white-space: nowrap;
}

/* grafico */
.ar-chartWrap{
  height: 200px;
  display:flex;
  flex-direction:column;
  gap: 8px;
}
.ar-chartBox{
  flex: 1;
  background: rgba(255,255,255,.22);
  border: 2px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 10px;
}
.ar-chart-empty{
  height: 100%;
  display:grid;
  place-items:center;
  font-weight: 900;
  opacity: .55;
}
.ar-chart-svg{
  width: 100%;
  height: 100%;
  display:block;
}

/* soglie */
.ar-th-row{
  background: rgba(255,255,255,.22);
  border: 2px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 10px 10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.ar-th-left{ min-width: 160px; }
.ar-th-label{
  font-weight: 1000;
  color: rgba(0,0,0,.62);
}
.ar-th-sub{
  font-size: 12px;
  font-weight: 900;
  opacity: .55;
  margin-top: 2px;
}
.ar-th-controls{
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content:flex-end;
}
.ar-step{
  display:flex;
  align-items:center;
  gap: 6px;
  background: rgba(0,0,0,.08);
  border-radius: 999px;
  padding: 6px 8px;
}
.ar-step-badge{
  font-size: 12px;
  font-weight: 1000;
  opacity: .7;
  margin-right: 4px;
}
.ar-step-btn{
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: none;
  background: rgba(0,0,0,.25);
  color: white;
  font-weight: 1000;
  cursor:pointer;
}
.ar-step-btn:active{ transform: scale(.98); }
.ar-step-input{
  width: 70px;
  height: 30px;
  border-radius: 10px;
  border: 2px solid rgba(0,0,0,0.12);
  background: rgba(255,255,255,.35);
  padding: 0 8px;
  font-weight: 900;
  color: rgba(0,0,0,.65);
  outline:none;
}
.ar-save{
  height: 34px;
  border-radius: 12px;
  border: none;
  background: rgba(0,0,0,.65);
  color: white;
  font-weight: 1000;
  padding: 0 14px;
  cursor:pointer;
  box-shadow: 0 10px 16px rgba(0,0,0,.16);
}
.ar-save:disabled{ opacity:.6; cursor:not-allowed; box-shadow:none; }

/* modal */
.ar-modalOverlay{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 18px;
  z-index: 999;
}
.ar-modal{
  width: min(740px, 100%);
  background: var(--card);
  border-radius: 16px;
  border: 2px solid rgba(0,0,0,0.08);
  box-shadow: 0 24px 50px rgba(0,0,0,.25);
  padding: 14px;
}
.ar-modalHead{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap: 10px;
}
.ar-modalTitle{
  font-size: 20px;
  font-weight: 1000;
  color: rgba(0,0,0,.65);
}
.ar-modalClose{
  border:none;
  background: rgba(0,0,0,.55);
  color: white;
  font-weight: 1000;
  border-radius: 12px;
  padding: 8px 10px;
  cursor:pointer;
}
.ar-modalBody{
  margin-top: 10px;
  background: rgba(255,255,255,.22);
  border-radius: 14px;
  border: 2px solid rgba(0,0,0,0.06);
  padding: 12px;
  color: rgba(0,0,0,.65);
  font-weight: 900;
}
.ar-bullets{
  margin-top: 10px;
  display:flex;
  flex-direction:column;
  gap: 8px;
  font-weight: 1000;
  color: rgba(0,0,0,.70);
}
.ar-bulletRow{
  background: rgba(255,255,255,.18);
  border: 2px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 10px 12px;
  display:flex;
  gap: 10px;
  align-items:flex-start;
}
.ar-dash{
  width: 18px;
  flex: 0 0 18px;
  opacity: .7;
}
.ar-bulletText{
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

/* errors */
.ar-status{
  margin-top: 10px;
  color: rgba(0,0,0,.65);
  font-weight: 900;
  text-align:center;
}
.ar-error{
  margin-top: 10px;
  color: #7a1513;
  font-weight: 1000;
  background: rgba(255,255,255,.22);
  padding: 10px 12px;
  border-radius: 12px;
  box-shadow: 0 10px 16px rgba(0,0,0,.12);
}

@media (max-width: 980px){
  .ar-grid{ grid-template-columns: 1fr; }
  .ar-chips{ grid-template-columns: 1fr; }
}
@media (max-width: 820px){
  .ar-shell{ flex-direction: column; }
  .ar-sidebar{ width: 100%; flex-direction: row; justify-content: space-between; }
  .ar-top{ flex-wrap: wrap; }
}
`}</style>

      <div className="ar-shell">
        {/* SIDEBAR */}
        <aside className="ar-sidebar">
          <div className="ar-navItem ar-navItemActive" onClick={goHome} role="button" tabIndex={0} title="Home">
            <div className="ar-iconBox">
              <HomeIcon />
            </div>
            <div className="ar-navLabel">Home</div>
          </div>

          <div className="ar-navItem" onClick={goBackToApiario} role="button" tabIndex={0} title="Indietro">
            <div className="ar-iconBox">
              <BackIcon />
            </div>
            <div className="ar-navLabel">Back</div>
          </div>

          <div className="ar-spacer" />

          <div className="ar-navItem" title="Download">
            <div className="ar-iconBox">
              <DownloadIcon />
            </div>
          </div>

          <div className="ar-navItem" onClick={logout} role="button" tabIndex={0} title="Logout">
            <div className="ar-iconBox">
              <LogoutIcon />
            </div>
            <div className="ar-navLabel">Logout</div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="ar-main">
          <div className="ar-center">
            {/* TOP BAR ALLARME */}
            <div className="ar-top">
              <div className="ar-topTitle">
                ALLARME <small>{alarmText}</small>
              </div>
            </div>

            <div className="ar-titleRow" style={{ marginTop: 10 }}>
              <h1 className="ar-h1">Arnia</h1>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="ar-panel" style={{ padding: "8px 12px" }}>
                  <div style={{ fontWeight: 1000, color: "rgba(0,0,0,.62)" }}>
                    Stato: {alarmIsOk ? "OK" : "NON OK"}
                  </div>
                </div>
              </div>
            </div>

            {isLoading && <div className="ar-status">Caricamento...</div>}
            {error && <div className="ar-error">{error}</div>}

            <div className="ar-grid">
              {/* SINISTRA */}
              <div className="ar-card">
                <div className="ar-titleRow" style={{ paddingBottom: 6 }}>
                  <h2 className="ar-h2">Valori</h2>
                </div>

                <div className="ar-panel">
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Switch
                        checked={sensorActive(sensorPeso)}
                        disabled={!sensorPeso || togglingId === sensorPeso?._id}
                        onChange={() => toggleSensore(sensorPeso)}
                      />
                      <div style={{ fontWeight: 1000, opacity: 0.7 }}>{labelForSensor(sensorPeso, "Peso")}</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Switch
                        checked={sensorActive(sensorTemp)}
                        disabled={!sensorTemp || togglingId === sensorTemp?._id}
                        onChange={() => toggleSensore(sensorTemp)}
                      />
                      <div style={{ fontWeight: 1000, opacity: 0.7 }}>{labelForSensor(sensorTemp, "Temperatura")}</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Switch
                        checked={sensorActive(sensorUmi)}
                        disabled={!sensorUmi || togglingId === sensorUmi?._id}
                        onChange={() => toggleSensore(sensorUmi)}
                      />
                      <div style={{ fontWeight: 1000, opacity: 0.7 }}>{labelForSensor(sensorUmi, "Umidità")}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }} className="ar-chips">
                    <ValueChip label="Peso" value={valPeso} sensor={sensorPeso} unit="" />
                    <ValueChip label="Temperatura" value={valTemp} sensor={sensorTemp} unit="°C" />
                    <ValueChip label="Umidità" value={valUmi} sensor={sensorUmi} unit="%" />
                  </div>
                </div>

                <div className="ar-titleRow" style={{ marginTop: 10 }}>
                  <h2 className="ar-h2">Grafici</h2>
                </div>

                <div className="ar-chartWrap">
                  <div style={{ fontWeight: 1000, opacity: 0.7, paddingLeft: 4 }}>Peso</div>
                  <div className="ar-chartBox">
                    <PesoAreaChart data={pesoSeries} />
                  </div>
                </div>

                <div className="ar-chartWrap" style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 1000, opacity: 0.7, paddingLeft: 4 }}>Temperatura</div>
                  <div className="ar-chartBox">
                    <TempAreaChart data={tempSeries} />
                  </div>
                </div>

                <div className="ar-chartWrap" style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 1000, opacity: 0.7, paddingLeft: 4 }}>Umidità</div>
                  <div className="ar-chartBox">
                    <UmiAreaChart data={umiSeries} />
                  </div>
                </div>
              </div>

              {/* DESTRA */}
              <div className="ar-card">
                <div className="ar-titleRow">
                  <h2 className="ar-h2">Notifiche</h2>
                </div>

                <div className="ar-notifs ar-panel">
                  <div className="ar-scroll">
                    {!notifiche.length ? (
                      <div style={{ fontWeight: 1000, opacity: 0.6, padding: 8 }}>Nessuna notifica.</div>
                    ) : (
                      notifiche.slice(0, 50).map((n) => (
                        <div
                          key={n._id}
                          className="ar-notifRow"
                          onClick={() => setOpenNotifica(n)}
                          role="button"
                          tabIndex={0}
                          title="Apri dettagli"
                        >
                          <div style={{ minWidth: 0 }}>
                            <div className="ar-notifTitle">{getNotifTitle(n)}</div>
                            <div className="ar-notifSub">{getNotifDesc(n) || "—"}</div>
                          </div>

                          {/* ✅✅✅ QUI: data/ora da RILEVAZIONI */}
                          <div className="ar-pillDate">
                            {getNotifDateFromRilevazioni(n) || getNotifDate(n) || ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="ar-titleRow" style={{ marginTop: 10 }}>
                  <h2 className="ar-h2">Soglie</h2>
                </div>

                <div className="ar-panel">
                  {sensorPeso ? (
                    renderSogliaRow("Peso", sensorPeso)
                  ) : (
                    <div className="ar-th-row">
                      <div className="ar-th-left">
                        <div className="ar-th-label">Peso</div>
                        <div className="ar-th-sub">Sensore non trovato in sensoriarnia</div>
                      </div>
                    </div>
                  )}

                  {sensorTemp ? (
                    renderSogliaRow("Temperatura", sensorTemp)
                  ) : (
                    <div className="ar-th-row">
                      <div className="ar-th-left">
                        <div className="ar-th-label">Temperatura</div>
                        <div className="ar-th-sub">Sensore non trovato in sensoriarnia</div>
                      </div>
                    </div>
                  )}

                  {sensorUmi ? (
                    renderSogliaRow("Umidità", sensorUmi)
                  ) : (
                    <div className="ar-th-row">
                      <div className="ar-th-left">
                        <div className="ar-th-label">Umidità</div>
                        <div className="ar-th-sub">Sensore non trovato in sensoriarnia</div>
                      </div>
                    </div>
                  )}

                  {sensori
                    .filter((s) => ![sensorPeso?._id, sensorTemp?._id, sensorUmi?._id].includes(s._id))
                    .slice(0, 20)
                    .map((s) =>
                      renderSogliaRow(labelForSensor(s, `Sensore ${s.sea_id ?? ""}`) || `Sensore ${s.sea_id ?? ""}`, s)
                    )}
                </div>
              </div>
            </div>

            {/* MODAL DETTAGLIO NOTIFICA */}
            {openNotifica && (
              <div className="ar-modalOverlay" onClick={() => setOpenNotifica(null)} role="presentation">
                <div className="ar-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                  <div className="ar-modalHead">
                    <div className="ar-modalTitle">{getNotifTitle(openNotifica)}</div>
                    <button className="ar-modalClose" onClick={() => setOpenNotifica(null)}>
                      Chiudi
                    </button>
                  </div>

                  <div className="ar-bullets">
                    <div className="ar-bulletRow">
                      <div className="ar-dash">—</div>
                      <div className="ar-bulletText">{getNotifTitle(openNotifica)}</div>
                    </div>

                    <div className="ar-bulletRow">
                      <div className="ar-dash">—</div>

                      {/* ✅✅✅ QUI: data/ora da RILEVAZIONI (ril_dataOra) */}
                      <div className="ar-bulletText">
                        {getNotifDateFromRilevazioni(openNotifica) || getNotifDate(openNotifica) || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="ar-modalBody">{getNotifDesc(openNotifica) || "—"}</div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
