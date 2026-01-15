#include <Wire.h>
#include "Adafruit_HTU21DF.h"
#include "SensorValidation.h"

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
int contatoreUmidita = 0;

// ============================================================================
// CONFIGURAZIONE VALIDAZIONE UMIDITÀ
// ============================================================================
ConfigValidazioneSensore configUmidita = {
  .rangeMin = 0.0f,
  .rangeMax = 100.0f,
  .permettiNegativi = false,
  .richiedeTimestamp = true,
  .valoreDefault = 50.0f,
  .nomeSensore = "HUM"
};

// ============================================================================
// SETUP UMIDITÀ (rinominato da setup)
// ============================================================================
void setupUmidita() {
  Serial.println("→ Inizializzazione sensore Umidità...");
  
  Wire.begin(I2C_SDA, I2C_SCL);
  
  if (!sht21.begin()) {
    Serial.println("  ❌ ERRORE: Sensore SHT21 non trovato!");
    while (1) {
      delay(1000);
    }
  }
  
  Serial.println("  ✓ Sensore SHT21 rilevato");
  
  taraSoglieUmidita();
  
  Serial.println("  ✓ Sensore Umidità pronto\n");
}

// ============================================================================
// FUNZIONI AUSILIARIE
// ============================================================================

void taraSoglieUmidita() {
  sogliaUmiditaMax = 70.0;
  sogliaUmiditaMin = 30.0;
  
  Serial.println("  --- Taratura soglie Umidità ---");
  Serial.print("    Soglia MIN: "); Serial.print(sogliaUmiditaMin); Serial.println("%");
  Serial.print("    Soglia MAX: "); Serial.print(sogliaUmiditaMax); Serial.println("%");
}

void inviaDatiUmiditaAlDatabase(float umidita, String stato, ErroreComune codiceErrore) {
  Serial.println("  → Invio Umidità al Database:");
  Serial.print("    Stato: "); Serial.println(stato);
  
  if (codiceErrore != ERR_COMMON_NONE) {
    Serial.print("    Codice Errore: "); Serial.println(codiceErrore);
  }
  
  if (umidita != -999) {
    Serial.print("    Umidità: "); Serial.print(umidita); Serial.println("%");
  }
  
  // TODO:  Implementare invio JSON reale
  Serial.println();
}

// ============================================================================
// ACQUISIZIONE E VALIDAZIONE UMIDITÀ
// ============================================================================

RisultatoValidazione acquisisciUmidita() {
  float umiditaRaw = sht21.readHumidity();
  
  bool sensoreReady = (umiditaRaw != 998);
  unsigned long timestamp = millis();
  
  RisultatoValidazione risultato = validaDatoSensore(
    umiditaRaw,
    timestamp,
    sensoreReady,
    configUmidita
  );
  
  return risultato;
}

// ============================================================================
// FUNZIONE PRINCIPALE UMIDITÀ (chiamata dal Main)
// ============================================================================

void funzioneUmidita() {
  Serial.println("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.print("    ESECUZIONE CICLO UMIDITÀ (");
  Serial.print(contatoreUmidita + 1);
  Serial.println("/5)");
  Serial.println("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // 1) ACQUISIZIONE E VALIDAZIONE
  RisultatoValidazione risultato = acquisisciUmidita();
  
  // 2) GESTIONE ERRORI COMUNI
  gestisciRisultatoValidazione(risultato);
  
  if (!risultato.valido) {
    inviaDatiUmiditaAlDatabase(-999, "ERRORE", risultato.codiceErrore);
    return;
  }
  
  // 3) DATO VALIDO: controllo soglie
  float umiditaValida = risultato.valorePulito;
  
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
  inviaDatiUmiditaAlDatabase(umiditaValida, statoFinale, alertSoglia);
  
  // 5) INCREMENTO CONTATORE
  contatoreUmidita++;
  Serial.print("  Ciclo Umidità: "); Serial.print(contatoreUmidita); Serial.println("/5\n");
  
  // 6) RESET DOPO 5 CICLI
  if (contatoreUmidita >= 5) {
    Serial.println("  ✓ Ciclo di 5 completato → Ricaricamento soglie Umidità\n");
    contatoreUmidita = 0;
    taraSoglieUmidita();
  }
}