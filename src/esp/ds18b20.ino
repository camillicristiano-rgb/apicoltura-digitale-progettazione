// ============================================================================
// DS18B20 - Sensore Temperatura Interna Arnia
// ============================================================================

#include <OneWire.h>
#include <DallasTemperature.h>
#include "SensorValidation.h"

// ============================================================================
// CONFIGURAZIONE HARDWARE
// ============================================================================
#define ONE_WIRE_BUS 2

static OneWire oneWire(ONE_WIRE_BUS);
static DallasTemperature sensors(&oneWire);
static DeviceAddress insideThermometer;

// ============================================================================
// VARIABILI INTERNE
// ============================================================================
static float _ds18b20_sogliaMin = 30.0f;
static float _ds18b20_sogliaMax = 37.0f;
static unsigned long _ds18b20_intervallo = 360000;  // 6 minuti default
static bool _ds18b20_abilitato = true;
static bool _ds18b20_inizializzato = false;
static int _ds18b20_contatore = 0;

// Configurazione validazione
static ConfigValidazioneSensore _configValidazioneTemp = {
  .rangeMin = -40.0f,
  .rangeMax = 85.0f,
  .permettiNegativi = true,
  .richiedeTimestamp = true,
  .valoreDefault = 25.0f,
  .nomeSensore = "DS18B20"
};

// ============================================================================
// SETUP - Inizializzazione hardware
// ============================================================================
void setup_ds18b20() {
  Serial.println("-> Inizializzazione sensore DS18B20...");

  sensors.begin();

  // Cerca dispositivi sul bus OneWire
  if (sensors.getDeviceCount() == 0) {
    Serial.println("  ! ATTENZIONE: Nessun sensore DS18B20 trovato");
    _ds18b20_inizializzato = false;
  } else {
    sensors.getAddress(insideThermometer, 0);
    sensors.setResolution(insideThermometer, 12);  // 12 bit = 0.0625C
    _ds18b20_inizializzato = true;
    Serial.println("  + Sensore DS18B20 rilevato e configurato");
  }

  Serial.println("  + Setup DS18B20 completato\n");
}

// ============================================================================
// INIT - Configurazione da Database
// ============================================================================
void init_ds18b20(SensorConfig* config) {
  if (config == NULL) {
    Serial.println("  ! DS18B20: config NULL, uso valori default");
    return;
  }

  _ds18b20_sogliaMin = config->sogliaMin;
  _ds18b20_sogliaMax = config->sogliaMax;
  _ds18b20_intervallo = config->intervallo;
  _ds18b20_abilitato = config->abilitato;
  _ds18b20_contatore = 0;

  Serial.println("  --- Config DS18B20 caricata dal DB ---");
  Serial.print("    Soglia MIN: "); Serial.print(_ds18b20_sogliaMin); Serial.println(" C");
  Serial.print("    Soglia MAX: "); Serial.print(_ds18b20_sogliaMax); Serial.println(" C");
  Serial.print("    Intervallo: "); Serial.print(_ds18b20_intervallo / 1000); Serial.println(" sec");
  Serial.print("    Abilitato: "); Serial.println(_ds18b20_abilitato ? "SI" : "NO");
}

// ============================================================================
// READ - Lettura temperatura
// ============================================================================
RisultatoValidazione read_temperature_ds18b20() {
  // Verifica se sensore abilitato
  if (!_ds18b20_abilitato) {
    RisultatoValidazione risultato;
    risultato.valido = false;
    risultato.codiceErrore = ERR_SENSOR_OFFLINE;
    risultato.valorePulito = _configValidazioneTemp.valoreDefault;
    strcpy(risultato.messaggioErrore, "[DS18B20] Sensore disabilitato");
    return risultato;
  }

  // Verifica se sensore inizializzato
  if (!_ds18b20_inizializzato) {
    RisultatoValidazione risultato;
    risultato.valido = false;
    risultato.codiceErrore = ERR_SENSOR_NOT_READY;
    risultato.valorePulito = _configValidazioneTemp.valoreDefault;
    strcpy(risultato.messaggioErrore, "[DS18B20] Sensore non inizializzato");
    return risultato;
  }

  // Richiedi conversione temperatura
  sensors.requestTemperatures();
  float tempC = sensors.getTempC(insideThermometer);

  // Verifica lettura valida
  bool sensoreReady = (tempC != DEVICE_DISCONNECTED_C);
  unsigned long timestamp = millis();

  // Validazione dato
  RisultatoValidazione risultato = validaDatoSensore(
    tempC,
    timestamp,
    sensoreReady,
    _configValidazioneTemp
  );

  // Se valido, verifica soglie
  if (risultato.valido) {
    verificaSoglie(risultato.valorePulito, _ds18b20_sogliaMin, _ds18b20_sogliaMax, "DS18B20");
    _ds18b20_contatore++;
  }

  return risultato;
}

// ============================================================================
// GETTERS - Accesso ai parametri di configurazione
// ============================================================================
unsigned long get_intervallo_ds18b20() {
  return _ds18b20_intervallo;
}

bool is_abilitato_ds18b20() {
  return _ds18b20_abilitato;
}

int get_contatore_ds18b20() {
  return _ds18b20_contatore;
}

void reset_contatore_ds18b20() {
  _ds18b20_contatore = 0;
}
