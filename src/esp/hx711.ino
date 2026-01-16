// ============================================================================
// HX711 - Sensore Peso Arnia (Cella di Carico)
// ============================================================================

#include <Arduino.h>
#include "SensorValidation.h"

// ============================================================================
// CONFIGURAZIONE HARDWARE
// ============================================================================
#define HX711_DOUT_PIN 13
#define HX711_SCK_PIN 12

// ============================================================================
// VARIABILI INTERNE
// ============================================================================
static float _hx711_sogliaMin = 5.0f;      // Peso minimo anomalo (kg)
static float _hx711_sogliaMax = 80.0f;     // Peso massimo anomalo (kg)
static unsigned long _hx711_intervallo = 10800000;  // 3 ore default
static bool _hx711_abilitato = true;
static bool _hx711_inizializzato = false;
static bool _hx711_tarato = false;

// Parametri calibrazione
static float _hx711_calibration_factor = 1.0f;
static long _hx711_offset = 0;

// Configurazione validazione peso
static ConfigValidazioneSensore _configValidazionePeso = {
  .rangeMin = 0.0f,
  .rangeMax = 100.0f,
  .permettiNegativi = false,
  .richiedeTimestamp = true,
  .valoreDefault = 0.0f,
  .nomeSensore = "HX711"
};

// ============================================================================
// STRUTTURA RISULTATO ESTESO (errori specifici peso)
// ============================================================================
struct RisultatoPeso {
  RisultatoValidazione validazione;
  int erroreSpecifico;  // Codici 3xxx
};

// ============================================================================
// DB READ / WRITE (STUB) - RISERVATO AL GRUPPO DATABASE
// ============================================================================

// Lettura configurazione dal DB (stub)
static void letturaConfigDalDB_hx711() {
  // STUB: lettura configurazione HX711 dal DB (soglie, intervalli, abilitazione, ecc.)
}

// Scrittura dato nel DB (stub)
static void scritturaDatoNelDB_hx711(const RisultatoValidazione* risultato) {
  // STUB: implementazione riservata al gruppo Database
  (void)risultato; // evita warning
}

// ============================================================================
// SETUP - Inizializzazione hardware
// ============================================================================
void setup_hx711() {
  Serial.println("-> Inizializzazione sensore HX711...");

  // Configurazione pin
  pinMode(HX711_DOUT_PIN, INPUT);
  pinMode(HX711_SCK_PIN, OUTPUT);
  digitalWrite(HX711_SCK_PIN, LOW);

  // TODO: Inizializzazione libreria HX711
  // scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);

  _hx711_inizializzato = true;
  Serial.println("  + Pin HX711 configurati (DOUT=13, SCK=12)");
  Serial.println("  + Setup HX711 completato\n");
}

// ============================================================================
// INIT - Configurazione da Database
// ============================================================================
void init_hx711(SensorConfig* config) {
  if (config == NULL) {
    Serial.println("  ! HX711: config NULL, uso valori default");
    return;
  }

  _hx711_sogliaMin = config->sogliaMin;
  _hx711_sogliaMax = config->sogliaMax;
  _hx711_intervallo = config->intervallo;
  _hx711_abilitato = config->abilitato;

  Serial.println("  --- Config HX711 caricata dal DB ---");
  Serial.print("    Soglia MIN: "); Serial.print(_hx711_sogliaMin); Serial.println(" kg");
  Serial.print("    Soglia MAX: "); Serial.print(_hx711_sogliaMax); Serial.println(" kg");
  Serial.print("    Intervallo: "); Serial.print(_hx711_intervallo / 1000); Serial.println(" sec");
  Serial.print("    Abilitato: "); Serial.println(_hx711_abilitato ? "SI" : "NO");
}

// ============================================================================
// CALIBRAZIONE - Imposta parametri taratura
// ============================================================================
void calibrate_hx711(float calibration_factor, long offset) {
  _hx711_calibration_factor = calibration_factor;
  _hx711_offset = offset;
  _hx711_tarato = true;

  Serial.println("  --- Calibrazione HX711 ---");
  Serial.print("    Factor: "); Serial.println(_hx711_calibration_factor);
  Serial.print("    Offset: "); Serial.println(_hx711_offset);
}

// ============================================================================
// TARA - Azzera il peso corrente
// ============================================================================
bool tare_hx711() {
  if (!_hx711_inizializzato) {
    Serial.println("  ! HX711: impossibile tarare, sensore non inizializzato");
    return false;
  }

  // TODO: Implementare tara reale
  // _hx711_offset = scale.read_average(10);

  Serial.println("  + HX711: tara eseguita");
  return true;
}

// ============================================================================
// VERIFICA TARATURA
// ============================================================================
static bool verificaTaratura(int* erroreSpecifico) {
  if (!_hx711_tarato) {
    *erroreSpecifico = ERR_PS_CALIBRATION_MISSING;
    Serial.println("  ! HX711: calibrazione mancante");
    return false;
  }

  if (_hx711_calibration_factor == 0) {
    *erroreSpecifico = ERR_PS_CALIBRATION_INVALID;
    Serial.println("  ! HX711: calibrazione non valida (factor=0)");
    return false;
  }

  return true;
}

// ============================================================================
// READ WEIGHT - Lettura peso
// ============================================================================
RisultatoValidazione read_weight_hx711() {
  RisultatoValidazione risultato;

  // Verifica se sensore abilitato
  if (!_hx711_abilitato) {
    risultato.valido = false;
    risultato.codiceErrore = ERR_SENSOR_OFFLINE;
    risultato.valorePulito = _configValidazionePeso.valoreDefault;
    strcpy(risultato.messaggioErrore, "[HX711] Sensore disabilitato");
    return risultato;
  }

  // Verifica se sensore inizializzato
  if (!_hx711_inizializzato) {
    risultato.valido = false;
    risultato.codiceErrore = ERR_SENSOR_NOT_READY;
    risultato.valorePulito = _configValidazionePeso.valoreDefault;
    strcpy(risultato.messaggioErrore, "[HX711] Sensore non inizializzato");
    return risultato;
  }

  // Verifica taratura
  int erroreSpecifico = 0;
  if (!verificaTaratura(&erroreSpecifico)) {
    risultato.valido = false;
    risultato.codiceErrore = erroreSpecifico;
    risultato.valorePulito = _configValidazionePeso.valoreDefault;
    snprintf(risultato.messaggioErrore, 80, "[HX711] Errore taratura: %d", erroreSpecifico);
    return risultato;
  }

  // TODO: Lettura reale dal sensore
  // long raw = scale.read_average(5);
  // float peso_kg = (raw - _hx711_offset) / _hx711_calibration_factor;

  // Valore simulato per test
  float peso_kg = 25.5f;

  // Verifica conversione valida
  if (isnan(peso_kg) || isinf(peso_kg)) {
    risultato.valido = false;
    risultato.codiceErrore = ERR_PS_CONVERSION_FAILED;
    risultato.valorePulito = _configValidazionePeso.valoreDefault;
    strcpy(risultato.messaggioErrore, "[HX711] Conversione kg fallita");
    return risultato;
  }

  // Validazione dato
  bool sensoreReady = true;
  unsigned long timestamp = millis();

  risultato = validaDatoSensore(
    peso_kg,
    timestamp,
    sensoreReady,
    _configValidazionePeso
  );

  // Se valido, verifica soglie + (solo allora) chiamata DB write stub
  if (risultato.valido) {
    verificaSoglie(risultato.valorePulito, _hx711_sogliaMin, _hx711_sogliaMax, "HX711");

    // >>> CHIAMATA AL METODO DB (STUB)
    scritturaDatoNelDB_hx711(&risultato);
  }

  return risultato;
}

// ============================================================================
// GETTERS - Accesso ai parametri di configurazione
// ============================================================================
unsigned long get_intervallo_hx711() {
  return _hx711_intervallo;
}

bool is_abilitato_hx711() {
  return _hx711_abilitato;
}

bool is_tarato_hx711() {
  return _hx711_tarato;
}

float get_calibration_factor_hx711() {
  return _hx711_calibration_factor;
}
