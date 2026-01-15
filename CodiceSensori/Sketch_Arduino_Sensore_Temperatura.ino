#include <OneWire.h>
#include <DallasTemperature.h>
#include "SensorValidation.h"

// --- Configurazione Pin e Tempi ---
#define ONE_WIRE_BUS 2
const unsigned long ATTESA_6_MINUTI = 360000; 

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
DeviceAddress insideThermometer;

// Variabili globali
float sogliaMaxTemp; 
float sogliaMinTemp;
int contTemp = 0;

// ============================================================================
// CONFIGURAZIONE VALIDAZIONE TEMPERATURA
// ============================================================================
ConfigValidazioneSensore configTemp = {
  .rangeMin = -40. 0f,
  .rangeMax = 85.0f,
  .permettiNegativi = true,
  .richiedeTimestamp = true,
  .valoreDefault = 25.0f,
  .nomeSensore = "TEMP"
};

// ============================================================================
// SETUP TEMPERATURA (rinominato da setup)
// ============================================================================
void setupTemperatura() {
  Serial.println("→ Inizializzazione sensore Temperatura...");
  
  sensors.begin();
  sensors.setResolution(insideThermometer, 9);
  
  inizializzaCicloTemp();
  
  Serial.println("  ✓ Sensore Temperatura pronto\n");
}

// ============================================================================
// FUNZIONI AUSILIARIE
// ============================================================================

void inizializzaCicloTemp() {
  contTemp = 0;
  sogliaMinTemp = leggiSogliaMinTempDBSimulato();
  sogliaMaxTemp = leggiSogliaMaxTempDBSimulato();
  
  Serial.println("  --- Soglie Temperatura caricate ---");
  Serial.print("    Soglia MIN: "); Serial.print(sogliaMinTemp); Serial.println("°C");
  Serial.print("    Soglia MAX: "); Serial.print(sogliaMaxTemp); Serial.println("°C");
  Serial.print("    Contatore resettato: "); Serial.println(contTemp);
}

float leggiSogliaMinTempDBSimulato() { 
  return 18.0;
}

float leggiSogliaMaxTempDBSimulato() { 
  return 36.0;
}

void inviaDatiTemperaturaAlDatabase(float temp, String stato, ErroreComune codiceErrore) {
  Serial.println("  → Invio Temperatura al Database:");
  Serial.print("    Stato: "); Serial.println(stato);
  
  if (codiceErrore != ERR_COMMON_NONE) {
    Serial.print("    Codice Errore: "); Serial.println(codiceErrore);
  }
  
  if (temp != -999) {
    Serial.print("    Temperatura: "); Serial.print(temp); Serial.println("°C");
  }
  
  // TODO: Implementare invio JSON reale
  Serial.println();
}

// ============================================================================
// ACQUISIZIONE E VALIDAZIONE TEMPERATURA
// ============================================================================

RisultatoValidazione acquisisciTemperatura() {
  sensors.requestTemperatures();
  float tempC = sensors.getTempC(insideThermometer);
  
  bool sensoreReady = (tempC != DEVICE_DISCONNECTED_C);
  unsigned long timestamp = millis();
  
  RisultatoValidazione risultato = validaDatoSensore(
    tempC,
    timestamp,
    sensoreReady,
    configTemp
  );
  
  return risultato;
}

// ============================================================================
// FUNZIONE PRINCIPALE TEMPERATURA (chiamata dal Main)
// ============================================================================

void funzioneTemperatura() {
  Serial.println("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("    ESECUZIONE CICLO TEMPERATURA");
  Serial.println("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // 1) ACQUISIZIONE E VALIDAZIONE
  RisultatoValidazione risultato = acquisisciTemperatura();
  
  // 2) GESTIONE ERRORI COMUNI
  gestisciRisultatoValidazione(risultato);
  
  if (! risultato.valido) {
    inviaDatiTemperaturaAlDatabase(-999, "ERRORE", risultato.codiceErrore);
    return;
  }
  
  // 3) DATO VALIDO:  controllo soglie
  float tempValida = risultato.valorePulito;
  
  ErroreComune alertSoglia = verificaSoglie(tempValida, sogliaMinTemp, sogliaMaxTemp, "TEMP");
  
  String statoFinale;
  if (alertSoglia == ALERT_THRESHOLD_HIGH) {
    statoFinale = "ALERT_SOGLIA_ALTA";
  } else if (alertSoglia == ALERT_THRESHOLD_LOW) {
    statoFinale = "ALERT_SOGLIA_BASSA";
  } else {
    statoFinale = "OK";
  }
  
  // 4) INVIO DATI
  inviaDatiTemperaturaAlDatabase(tempValida, statoFinale, alertSoglia);
  
  // 5) GESTIONE CONTATORE
  contTemp++;
  Serial.print("  Ciclo Temperatura: "); Serial.print(contTemp); Serial.println("/5\n");
  
  if (contTemp >= 5) {
    Serial.println("  ✓ Ciclo di 5 completato → Ricaricamento soglie Temperatura\n");
    inizializzaCicloTemp();
  }
}