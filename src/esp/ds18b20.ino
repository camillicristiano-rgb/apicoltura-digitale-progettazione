// ============================================================================
// DS18B20 - MODULO INTEGRATO (LETTURA + VALIDAZIONE + SOGLIE)
// ============================================================================

#include <OneWire.h>
#include <DallasTemperature.h>
#include "SensorValidation.h" // Assicurati che questo file esista

// --- CONFIGURAZIONE HARDWARE ---
#define ONE_WIRE_BUS 2

static OneWire oneWire(ONE_WIRE_BUS);
static DallasTemperature sensors(&oneWire);
static DeviceAddress insideThermometer; // Memorizza l'indirizzo del sensore

// --- STATO E PARAMETRI (CONFIGURABILI) ---
static float _ds18b20_sogliaMin = 30.0f;
static float _ds18b20_sogliaMax = 37.0f;
static unsigned long _ds18b20_intervallo = 360000;
static bool _ds18b20_abilitato = true;
static bool _ds18b20_inizializzato = false;
static int _ds18b20_contatore = 0;

// Configurazione per SensorValidation.h
static ConfigValidazioneSensore _configValidazioneTemp = {
  .rangeMin = -40.0f,
  .rangeMax = 85.0f,
  .permettiNegativi = true,
  .richiedeTimestamp = true,
  .valoreDefault = 25.0f,
  .nomeSensore = "DS18B20"
};

// --- UTILITY: STAMPA INDIRIZZO (Dal Codice 2) ---
void printAddress(DeviceAddress deviceAddress) {
  for (uint8_t i = 0; i < 8; i++) {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
  }
}

// ============================================================================
// SETUP - Inizializzazione Fisica
// ============================================================================
void setup_ds18b20() {
  Serial.println(F("-> Avvio scansione bus OneWire..."));
  
  sensors.begin();
  int deviceCount = sensors.getDeviceCount();

  if (deviceCount == 0) {
    Serial.println(F("  ! ERRORE: Nessun sensore DS18B20 trovato sul pin 2"));
    _ds18b20_inizializzato = false;
    return;
  }

  Serial.print(F("  + Sensori trovati: "));
  Serial.println(deviceCount);

  // Cerca l'indirizzo del primo sensore
  if (!sensors.getAddress(insideThermometer, 0)) {
    Serial.println(F("  ! ERRORE: Impossibile recuperare indirizzo fisico"));
    _ds18b20_inizializzato = false;
  } else {
    Serial.print(F("  + Indirizzo Sensore: "));
    printAddress(insideThermometer);
    Serial.println();

    // Configurazione risoluzione (12 bit = max precisione)
    sensors.setResolution(insideThermometer, 12);
    sensors.setWaitForConversion(true); 
    
    // Verifica se in Parasite Power (Dal Codice 2)
    Serial.print(F("  + Modalità alimentazione: "));
    Serial.println(sensors.isParasitePowerMode() ? F("PARASITE") : F("ESTERNA"));

    _ds18b20_inizializzato = true;
    Serial.println(F("  + DS18B20 pronto."));
  }
}

// ============================================================================
// INIT - Configurazione Parametri (Dal Server/DB)
// ============================================================================
void init_ds18b20(SensorConfig* config) {
  if (config == NULL) return;

  _ds18b20_sogliaMin = config->sogliaMin;
  _ds18b20_sogliaMax = config->sogliaMax;
  _ds18b20_intervallo = config->intervallo;
  _ds18b20_abilitato = config->abilitato;
  _ds18b20_contatore = 0;

  Serial.println(F("  --- Configurazione Software Aggiornata ---"));
}

// ============================================================================
// READ - Lettura, Validazione e Controllo Soglie
// ============================================================================
RisultatoValidazione read_temperature_ds18b20() {
  RisultatoValidazione risultato;
  risultato.valido = false;
  risultato.valorePulito = _configValidazioneTemp.valoreDefault;
  risultato.timestamp = millis();

  // 1. Controllo se il sensore è disabilitato
  if (!_ds18b20_abilitato) {
    risultato.codiceErrore = ERR_SENSOR_OFFLINE;
    strncpy(risultato.messaggioErrore, "Sensore disabilitato", sizeof(risultato.messaggioErrore));
    return risultato;
  }

  // 2. Controllo se inizializzato correttamente
  if (!_ds18b20_inizializzato) {
    risultato.codiceErrore = ERR_SENSOR_NOT_READY;
    strncpy(risultato.messaggioErrore, "HW non inizializzato", sizeof(risultato.messaggioErrore));
    return risultato;
  }

  // 3. Lettura Fisica (Logica Codice 2)
  sensors.requestTemperatures(); 
  float tempC = sensors.getTempC(insideThermometer);

  // 4. Controllo connessione fisica (DEVICE_DISCONNECTED_C = -127)
  bool isConnected = (tempC != DEVICE_DISCONNECTED_C);

  // 5. Validazione Logica (Range, NaN, ecc. tramite SensorValidation.h)
  risultato = validaDatoSensore(
    tempC, 
    risultato.timestamp, 
    isConnected, 
    _configValidazioneTemp
  );

  // 6. Controllo Soglie e Alert
  if (risultato.valido) {
    // Questa funzione verifica se il dato è fuori dai limiti min/max
    // e internamente può gestire l'invio di notifiche
    verificaSoglie(risultato.valorePulito, _ds18b20_sogliaMin, _ds18b20_sogliaMax, "DS18B20");
    _ds18b20_contatore++;
    
    // Debug opzionale
    Serial.print(F("[DS18B20] Temperatura: "));
    Serial.print(risultato.valorePulito);
    Serial.println(F(" °C"));
  } else {
    Serial.print(F("! Errore Lettura: "));
    Serial.println(risultato.messaggioErrore);
  }

  return risultato;
}

// Getters per il loop principale
unsigned long get_intervallo_ds18b20() { return _ds18b20_intervallo; }
bool is_abilitato_ds18b20() { return _ds18b20_abilitato; }
