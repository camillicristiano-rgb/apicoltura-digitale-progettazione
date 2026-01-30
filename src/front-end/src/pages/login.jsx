import { useState } from "react";
//const RESTDB_BASE = import.meta.env.VITE_RESTDB_BASE;
const RESTDB_BASE = "https://clone7-b263.restdb.io/rest";

export default function Login() {
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
      const response = await fetch(RESTDB_BASE+"/_ping", {
        method: "GET",
        headers: {
          "x-apikey": "697c5d4953d66e48e51956eb",
          "Content-Type": "application/json",
          "cache-control": "no-cache",
        },
      });

      if (response.ok) {
        localStorage.setItem("apik", apik);
        window.location.href = "/home";
      } else {
        setError("Chiave API non valida per il DB.");
      }
    } catch (err) {
      setError("Impossibile connettersi. Controlla la key o la connessione.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // SVG inline (ape + pattern esagoni) in data-uri
  const beeSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <g transform="translate(60 62)">
        <ellipse cx="0" cy="10" rx="12" ry="18" fill="#111"/>
        <rect x="-12" y="6" width="24" height="5" fill="#f3c32f"/>
        <rect x="-12" y="13" width="24" height="5" fill="#f3c32f"/>
        <circle cx="0" cy="-8" r="8" fill="#111"/>
        <path d="M-24,6 C-40,1 -40,-13 -20,-15 C-7,-16 -7,-2 -24,6" fill="#f3c32f" opacity="0.95"/>
        <path d="M24,6 C40,1 40,-13 20,-15 C7,-16 7,-2 24,6" fill="#f3c32f" opacity="0.95"/>
        <path d="M-4,-18 L-18,-34" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M4,-18 L18,-34" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    </svg>
  `);

  const honeycombSvg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="140" viewBox="0 0 160 140">
      <g fill="none" stroke="rgba(0,0,0,0.10)" stroke-width="2">
        <path d="M40 10 l20 12 v24 l-20 12 l-20-12 v-24z"/>
        <path d="M80 10 l20 12 v24 l-20 12 l-20-12 v-24z"/>
        <path d="M120 10 l20 12 v24 l-20 12 l-20-12 v-24z"/>

        <path d="M60 46 l20 12 v24 l-20 12 l-20-12 v-24z"/>
        <path d="M100 46 l20 12 v24 l-20 12 l-20-12 v-24z"/>

        <path d="M40 82 l20 12 v24 l-20 12 l-20-12 v-24z"/>
        <path d="M80 82 l20 12 v24 l-20 12 l-20-12 v-24z"/>
        <path d="M120 82 l20 12 v24 l-20 12 l-20-12 v-24z"/>
      </g>
    </svg>
  `);

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 30% 15%, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%)," +
        "radial-gradient(circle at 80% 85%, rgba(0,0,0,0.08), rgba(0,0,0,0) 55%)," +
        "#f6de93",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "110px 16px 40px",
      position: "relative",
      overflow: "hidden",
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 86,
      background: "#1f1f1f",
      boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
    },

    // honeycomb pattern leggero
    honeycomb: {
      position: "absolute",
      inset: 0,
      backgroundImage: `url("data:image/svg+xml,${honeycombSvg}")`,
      backgroundRepeat: "repeat",
      backgroundSize: "220px 190px",
      opacity: 0.35,
      filter: "blur(0.2px)",
      transform: "translateY(20px)",
      pointerEvents: "none",
    },

    // macchie “miele” decorative
    blob1: {
      position: "absolute",
      width: 520,
      height: 520,
      borderRadius: 999,
      background: "rgba(255, 187, 0, 0.18)",
      top: -180,
      left: -220,
      filter: "blur(18px)",
      pointerEvents: "none",
    },
    blob2: {
      position: "absolute",
      width: 520,
      height: 520,
      borderRadius: 999,
      background: "rgba(0, 0, 0, 0.08)",
      bottom: -220,
      right: -240,
      filter: "blur(22px)",
      pointerEvents: "none",
    },

    cardWrap: {
      position: "relative",
      zIndex: 2,
      width: "100%",
      maxWidth: 440,
    },

    card: {
      width: "100%",
      borderRadius: 18,
      padding: "28px 22px 22px",
      textAlign: "center",
      background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
      border: "1px solid rgba(0,0,0,0.10)",
      boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
    },

    avatar: {
      width: 132,
      height: 132,
      borderRadius: 999,
      margin: "0 auto 12px",
      background:
        "radial-gradient(circle at 50% 35%, rgba(255,223,128,0.98), rgba(130,120,90,0.92))",
      boxShadow: "0 16px 24px rgba(0,0,0,0.22)",
      display: "grid",
      placeItems: "center",
      position: "relative",
      overflow: "hidden",
    },
    avatarBee: {
      width: 132,
      height: 132,
      backgroundImage: `url("data:image/svg+xml,${beeSvg}")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "132px 132px",
      transform: "translateY(2px)",
    },
    avatarRing: {
      position: "absolute",
      inset: -6,
      borderRadius: 999,
      border: "2px solid rgba(255,255,255,0.35)",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
      pointerEvents: "none",
    },

    title: {
      margin: "0 0 6px 0",
      fontSize: 24,
      fontWeight: 900,
      color: "#4b442f",
      letterSpacing: 0.3,
    },
    subtitle: {
      margin: "0 0 16px 0",
      fontSize: 12.5,
      color: "rgba(0,0,0,0.55)",
    },

    input: {
      width: "88%",
      maxWidth: 340,
      padding: "14px 16px",
      margin: "10px auto 12px",
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.10)",
      outline: "none",
      background: "rgba(255,255,255,0.70)",
      boxShadow: "0 12px 22px rgba(0,0,0,0.18)",
      fontSize: 14,
    },

    button: {
      width: "88%",
      maxWidth: 340,
      padding: "12px 16px",
      borderRadius: 999,
      border: "none",
      background: "linear-gradient(180deg, #111111, #000000)",
      color: "#ffffff",
      fontWeight: 900,
      letterSpacing: 1.2,
      cursor: "pointer",
      boxShadow: "0 14px 22px rgba(0,0,0,0.22)",
      textTransform: "uppercase",
      transform: "translateY(0px)",
    },
    buttonDisabled: {
      opacity: 0.65,
      cursor: "not-allowed",
    },

    error: {
      marginTop: 12,
      color: "#b00020",
      fontWeight: 900,
      background: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(176,0,32,0.25)",
      padding: "10px 12px",
      borderRadius: 12,
    },

    footer: {
      marginTop: 16,
      fontSize: 12,
      color: "rgba(0,0,0,0.60)",
    },
    link: {
      marginTop: 10,
      fontSize: 12,
      color: "rgba(0,0,0,0.70)",
      textDecoration: "underline",
      cursor: "pointer",
      display: "inline-block",
    },

    // API sparse (decorazioni)
    beeFloat: (top, left, size, rot, opacity = 0.9) => ({
      position: "absolute",
      top,
      left,
      width: size,
      height: size,
      backgroundImage: `url("data:image/svg+xml,${beeSvg}")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "contain",
      transform: `rotate(${rot}deg)`,
      opacity,
      filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.20))",
      pointerEvents: "none",
      zIndex: 1,
    }),

    // Alveari piccoli (esagoni “pieni”)
    hive: (top, left, s, o = 0.35) => ({
      position: "absolute",
      top,
      left,
      width: s,
      height: s,
      background:
        "linear-gradient(180deg, rgba(255,200,40,0.45), rgba(255,160,0,0.18))",
      clipPath: "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)",
      boxShadow: "0 16px 26px rgba(0,0,0,0.14)",
      border: "1px solid rgba(0,0,0,0.10)",
      opacity: o,
      pointerEvents: "none",
      zIndex: 1,
    }),
  };

  return (
    <div style={styles.page}>


      {/* decorazioni sfondo */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.honeycomb} />

      {/* alveari sparsi */}
      <div style={styles.hive("140px", "8%", "92px", 0.28)} />
      <div style={styles.hive("260px", "78%", "74px", 0.22)} />
      <div style={styles.hive("70%", "14%", "110px", 0.18)} />
      <div style={styles.hive("78%", "82%", "86px", 0.16)} />

      {/* api sparse */}
      <div style={styles.beeFloat("110px", "70%", "74px", -18, 0.85)} />
      <div style={styles.beeFloat("220px", "12%", "64px", 12, 0.75)} />
      <div style={styles.beeFloat("62%", "74%", "82px", 8, 0.75)} />
      <div style={styles.beeFloat("82%", "42%", "56px", -10, 0.65)} />

      <div style={styles.cardWrap}>
        <div style={styles.card}>
          <div style={styles.avatar} aria-hidden>
            <div style={styles.avatarBee} />
            <div style={styles.avatarRing} />
          </div>

          <h1 style={styles.title}>Apicoltore</h1>
          <p style={styles.subtitle}>Inserisci la tua chiave per accedere al gestionale</p>

          <input
            type="text"
            value={apik}
            onChange={(e) => setApik(e.target.value)}
            placeholder="Inserisci la tua x-apikey..."
            style={styles.input}
            disabled={isLoading}
          />

          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : null),
            }}
          >
            {isLoading ? "Verifica in corso..." : "Login"}
          </button>

          {error && <p style={styles.error}>{error}</p>}

        </div>
      </div>
    </div>
  );
}
