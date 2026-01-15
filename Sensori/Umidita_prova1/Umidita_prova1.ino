#include <Wire.h>
#include "Adafruit_HTU21DF.h"
#include "SensorValidation.h"  // ← IMPORTIAMO LA LIBRERIA COMUNE

// ============================================================================
// CONFIGURAZIONE HARDWARE
// ============================================================================
Adafruit_HTU21DF sht21 = Adafruit_HTU21DF();

#define I2C_SDA 15
#define I2C_SCL 14

// ============================================================================
// VARIABILI GLOBALI
// ============================================================================
float sogliaUmiditaMax;
float sogliaUmiditaMin;
int contatore = 0;

unsigned long tempoPrecedente = 0;
const long intervallo = 2000; // 2 secondi (per TEST, in produzione usare 6 minuti)

// ============================================================================
// CONFIGURAZIONE VALIDAZIONE UMIDITÀ
// ============================================================================
ConfigValidazioneSensore configUmidita = {
  .rangeMin = 0. 0f,            // Umidità relativa min 0%
  .rangeMax = 100.0f,          // Umidità relativa max 100%
  .permettiNegativi = false,   // Umidità non può essere negativa
  .richiedeTimestamp = true,   // Timestamp obbligatorio
  .valoreDefault = 50.0f,      // Valore di fallback (umidità media)
  .nomeSensore = "HUM"
};

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n╔═══════════════════════════════════════╗");
  Serial.println("║   SENSORE UMIDITÀ - Avvio            ║");
  Serial.println("╚═══════════════════════════════════════╝\n");
  
  Wire.begin(I2C_SDA, I2C_SCL);
  
  // Verifica presenza sensore
  if (!sht21.begin()) {
    Serial.println("❌ ERRORE CRITICO: Sensore SHT21 non trovato!");
    Serial.println("   Impossibile procedere.  Verificare connessioni I2C.");
    while (1) {
      delay(1000); // Blocco permanente
    }
  }
  
  Serial.println("✓ Sensore SHT21 rilevato");
  
  taraSoglie(); 
  Serial.println("--- Sistema Avviato ---\n");
}

// ============================================================================
// FUNZIONI AUSILIARIE
// ============================================================================

void taraSoglie() {
  sogliaUmiditaMax = 70.0;
  sogliaUmiditaMin = 30.0;
  
  Serial.println("--- Taratura soglie ---");
  Serial.print("  Soglia MIN: "); Serial.print(sogliaUmiditaMin); Serial.println("%");
  Serial.print("  Soglia MAX: "); Serial.print(sogliaUmiditaMax); Serial.println("%");
  Serial.println();
  
  // TODO: In produzione, leggere da database/EEPROM
}

void inviaDatiAlDatabase(float umidita, String stato, ErroreComune codiceErrore) {
  Serial.println("\n→ Invio al Database:");
  Serial.print("  Stato: "); Serial.println(stato);
  
  if (codiceErrore != ERR_COMMON_NONE) {
    Serial.print("  Codice Errore: "); Serial.println(codiceErrore);
  }
  
  if (umidita != -999) {
    Serial.print("  Umidità: "); Serial.print(umidita); Serial.println("%");
  }
  
  // TODO:  Implementare invio JSON reale
  // Esempio payload:  {"sensor":  "HUM", "value": 65. 5, "status": "OK", "error_code": 0, "timestamp": 1234567890}
  
  Serial.println();
}

// ============================================================================
// ACQUISIZIONE E VALIDAZIONE UMIDITÀ
// ============================================================================

RisultatoValidazione acquisisciUmidita() {
  // Lettura dal sensore
  float umiditaRaw = sht21.readHumidity();
  
  // Verifica disponibilità sensore
  // Il sensore SHT21 ritorna 998 in caso di errore hardware (secondo tuo codice)
  bool sensoreReady = (umiditaRaw != 998);
  
  // Timestamp attuale
  unsigned long timestamp = millis();
  
  // ✅ VALIDAZIONE COMUNE
  RisultatoValidazione risultato = validaDatoSensore(
    umiditaRaw,
    timestamp,
    sensoreReady,
    configUmidita
  );
  
  return risultato;
}

// ============================================================================
// FUNZIONE PRINCIPALE UMIDITÀ (da chiamare nel Main)
// ============================================================================

void funzioneUmidita() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.print("  CICLO UMIDITÀ (");
  Serial.print(contatore + 1);
  Serial.println("/5)");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // 1) ACQUISIZIONE E VALIDAZIONE
  RisultatoValidazione risultato = acquisisciUmidita();
  
  // 2) GESTIONE ERRORI COMUNI
  gestisciRisultatoValidazione(risultato);
  
  if (! risultato.valido) {
    // ❌ DATO NON VALIDO: invia errore e termina ciclo
    inviaDatiAlDatabase(-999, "ERRORE", risultato.codiceErrore);
    
    // Nota: non incrementiamo il contatore in caso di errore
    // In alternativa, potresti decidere di incrementarlo comunque
    return;
  }
  
  // ✅ DATO VALIDO: procedi con controllo soglie
  float umiditaValida = risultato.valorePulito;
  
  // 3) VERIFICA SOGLIE (genera alert ma non invalida il dato)
  ErroreComune alertSoglia = verificaSoglie(
    umiditaValida, 
    sogliaUmiditaMin, 
    sogliaUmiditaMax, 
    "HUM"
  );
  
  String statoFinale;
  if (alertSoglia == ALERT_THRESHOLD_HIGH) {
    statoFinale = "ALERT_UMIDITA_ALTA";
  } else if (alertSoglia == ALERT_THRESHOLD_LOW) {
    statoFinale = "ALERT_UMIDITA_BASSA";
  } else {
    statoFinale = "OK";
  }
  
  // 4) INVIO DATI
  inviaDatiAlDatabase(umiditaValida, statoFinale, alertSoglia);
  
  // 5) INCREMENTO CONTATORE
  contatore++;
  Serial.print("Ciclo: "); Serial.print(contatore); Serial.println("/5\n");
  
  // 6) RESET DOPO 5 CICLI
  if (contatore >= 5) {
    Serial.println("✓ Ciclo di 5 completato → Ricaricamento soglie\n");
    contatore = 0;
    taraSoglie();
  }
}

// ============================================================================
// LOOP
// ============================================================================

void loop() {
  unsigned long tempoAttuale = millis();
  
  // Timer per campionamento periodico
  if (tempoAttuale - tempoPrecedente >= intervallo) {
    tempoPrecedente = tempoAttuale;
    
    funzioneUmidita();
    
    Serial.println("⏳ Attesa per il prossimo campione...");
    Serial.println("───────────────────────────────────\n");
  }
}
