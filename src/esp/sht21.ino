// ============================================================================
// SHT21 (HTU21D) - Sensore Temperatura e Umidita Ambientale
// ============================================================================

#include <Wire.h>
#include "Adafruit_HTU21DF.h"
#include "SensorValidation.h"

// ============================================================================
// CONFIGURAZIONE HARDWARE
// ============================================================================
#define I2C_SDA 15
#define I2C_SCL 14

static Adafruit_HTU21DF sht21 = Adafruit_HTU21DF();

// ============================================================================
// VARIABILI INTERNE - UMIDITA
// ============================================================================
static float _sht21_umidita_sogliaMin = 40.0f;
static float _sht21_umidita_sogliaMax = 70.0f;
static unsigned long _sht21_umidita_intervallo = 360000;  // 6 minuti default
static bool _sht21_umidita_abilitato = true;
static int _sht21_umidita_contatore = 0;

// ============================================================================
// VARIABILI INTERNE - TEMPERATURA
// ============================================================================
static float _sht21_temp_sogliaMin = 20.0f;
static float _sht21_temp_sogliaMax = 40.0f;
static unsigned long _sht21_temp_intervallo = 360000;  // 6 minuti default
static bool _sht21_temp_abilitato = true;
static int _sht21_temp_contatore = 0;

// ============================================================================
// STATO SENSORE
// ============================================================================
static bool _sht21_inizializzato = false;

// Configurazione validazione umidita
static ConfigValidazioneSensore _configValidazioneUmidita = {
  .rangeMin = 0.0f,
  .rangeMax = 100.0f,
  .permettiNegativi = false,
  .richiedeTimestamp = true,
  .valoreDefault = 50.0f,
  .nomeSensore = "SHT21_HUM"
};

// Configurazione validazione temperatura
static ConfigValidazioneSensore _configValidazioneTemp = {
  .rangeMin = -40.0f,
  .rangeMax = 125.0f,
  .permettiNegativi = true,
  .richiedeTimestamp = true,
  .valoreDefault = 25.0f,
  .nomeSensore = "SHT21_TEMP"
};

// ============================================================================
// SETUP - Inizializzazione hardware I2C
// ============================================================================
void setup_sht21() {
  Serial.println("-> Inizializzazione sensore SHT21...");

  Wire.begin(I2C_SDA, I2C_SCL);

  if (!sht21.begin()) {
    Serial.println("  ! ERRORE: Sensore SHT21 non trovato!");
    _sht21_inizializzato = false;
  } else {
    _sht21_inizializzato = true;
    Serial.println("  + Sensore SHT21 rilevato su I2C");
  }

  Serial.println("  + Setup SHT21 completato\n");
}

// ============================================================================
// INIT UMIDITA - Configurazione da Database
// ============================================================================
void init_humidity_sht21(SensorConfig* config) {
  if (config == NULL) {
    Serial.println("  ! SHT21 Umidita: config NULL, uso valori default");
    return;
  }

  _sht21_umidita_sogliaMin = config->sogliaMin;
  _sht21_umidita_sogliaMax = config->sogliaMax;
  _sht21_umidita_intervallo = config->intervallo;
  _sht21_umidita_abilitato = config->abilitato;
  _sht21_umidita_contatore = 0;

  Serial.println("  --- Config SHT21 Umidita caricata dal DB ---");
  Serial.print("    Soglia MIN: "); Serial.print(_sht21_umidita_sogliaMin); Serial.println(" %");
  Serial.print("    Soglia MAX: "); Serial.print(_sht21_umidita_sogliaMax); Serial.println(" %");
  Serial.print("    Intervallo: "); Serial.print(_sht21_umidita_intervallo / 1000); Serial.println(" sec");
  Serial.print("    Abilitato: "); Serial.println(_sht21_umidita_abilitato ? "SI" : "NO");
}

// ============================================================================
// INIT TEMPERATURA - Configurazione da Database
// ============================================================================
void init_temperature_sht21(SensorConfig* config) {
  if (config == NULL) {
    Serial.println("  ! SHT21 Temperatura: config NULL, uso valori default");
    return;
  }

  _sht21_temp_sogliaMin = config->sogliaMin;
  _sht21_temp_sogliaMax = config->sogliaMax;
  _sht21_temp_intervallo = config->intervallo;
  _sht21_temp_abilitato = config->abilitato;
  _sht21_temp_contatore = 0;

  Serial.println("  --- Config SHT21 Temperatura caricata dal DB ---");
  Serial.print("    Soglia MIN: "); Serial.print(_sht21_temp_sogliaMin); Serial.println(" C");
  Serial.print("    Soglia MAX: "); Serial.print(_sht21_temp_sogliaMax); Serial.println(" C");
  Serial.print("    Intervallo: "); Serial.print(_sht21_temp_intervallo / 1000); Serial.println(" sec");
  Serial.print("    Abilitato: "); Serial.println(_sht21_temp_abilitato ? "SI" : "NO");
}

// ============================================================================
// READ HUMIDITY - Lettura umidita
// ============================================================================
RisultatoValidazione read_humidity_sht21() {
  // Verifica se sensore abilitato
  if (!_sht21_umidita_abilitato) {
    RisultatoValidazione risultato;
    risultato.valido = false;
    risultato.codiceErrore = ERR_SENSOR_OFFLINE;
    risultato.valorePulito = _configValidazioneUmidita.valoreDefault;
    strcpy(risultato.messaggioErrore, "[SHT21_HUM] Sensore disabilitato");
    return risultato;
  }

  // Verifica se sensore inizializzato
  if (!_sht21_inizializzato) {
    RisultatoValidazione risultato;
    risultato.valido = false;
    risultato.codiceErrore = ERR_SENSOR_NOT_READY;
    risultato.valorePulito = _configValidazioneUmidita.valoreDefault;
    strcpy(risultato.messaggioErrore, "[SHT21_HUM] Sensore non inizializzato");
    return risultato;
  }

  // Lettura umidita
  float umidita = sht21.readHumidity();

  // Verifica lettura valida (998 = errore sensore)
  bool sensoreReady = !isnan(umidita) && (umidita != 998);
  unsigned long timestamp = millis();

  // Validazione dato
  RisultatoValidazione risultato = validaDatoSensore(
    umidita,
    timestamp,
    sensoreReady,
    _configValidazioneUmidita
  );

  // Se valido, verifica soglie
  if (risultato.valido) {
    verificaSoglie(risultato.valorePulito, _sht21_umidita_sogliaMin, _sht21_umidita_sogliaMax, "SHT21_HUM");
    _sht21_umidita_contatore++;
  }

  return risultato;
}

// ============================================================================
// READ TEMPERATURE - Lettura temperatura
// ============================================================================
RisultatoValidazione read_temperature_sht21() {
  // Verifica se sensore abilitato
  if (!_sht21_temp_abilitato) {
    RisultatoValidazione risultato;
    risultato.valido = false;
    risultato.codiceErrore = ERR_SENSOR_OFFLINE;
    risultato.valorePulito = _configValidazioneTemp.valoreDefault;
    strcpy(risultato.messaggioErrore, "[SHT21_TEMP] Sensore disabilitato");
    return risultato;
  }

  // Verifica se sensore inizializzato
  if (!_sht21_inizializzato) {
    RisultatoValidazione risultato;
    risultato.valido = false;
    risultato.codiceErrore = ERR_SENSOR_NOT_READY;
    risultato.valorePulito = _configValidazioneTemp.valoreDefault;
    strcpy(risultato.messaggioErrore, "[SHT21_TEMP] Sensore non inizializzato");
    return risultato;
  }

  // Lettura temperatura
  float temperatura = sht21.readTemperature();

  // Verifica lettura valida
  bool sensoreReady = !isnan(temperatura);
  unsigned long timestamp = millis();

  // Validazione dato
  RisultatoValidazione risultato = validaDatoSensore(
    temperatura,
    timestamp,
    sensoreReady,
    _configValidazioneTemp
  );

  // Se valido, verifica soglie
  if (risultato.valido) {
    verificaSoglie(risultato.valorePulito, _sht21_temp_sogliaMin, _sht21_temp_sogliaMax, "SHT21_TEMP");
    _sht21_temp_contatore++;
  }

  return risultato;
}

// ============================================================================
// GETTERS - Accesso ai parametri di configurazione
// ============================================================================
unsigned long get_intervallo_humidity_sht21() {
  return _sht21_umidita_intervallo;
}

unsigned long get_intervallo_temperature_sht21() {
  return _sht21_temp_intervallo;
}

bool is_abilitato_humidity_sht21() {
  return _sht21_umidita_abilitato;
}

bool is_abilitato_temperature_sht21() {
  return _sht21_temp_abilitato;
}

bool is_inizializzato_sht21() {
  return _sht21_inizializzato;
}
