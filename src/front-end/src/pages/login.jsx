import { useState } from "react";

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

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h1>Login</h1>
      <input 
        type="text" 
        value={apik} 
        onChange={(e) => setApik(e.target.value)} 
        placeholder="Inserisci la tua x-apikey..."
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        disabled={isLoading}
      />
      <button 
        onClick={handleLogin} 
        disabled={isLoading}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        {isLoading ? "Verifica in corso..." : "Accedi"}
      </button>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
    </div>
  );
}