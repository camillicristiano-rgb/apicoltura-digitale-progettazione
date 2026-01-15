#include <Arduino.h>
#include <cmath>
#include <string>

// ==================== CONFIGURAZIONI ====================
static const float TEST_peso_min_kg = 0.0f;
static const float TEST_peso_max_kg = 40.0f;
static const uint64_t TEST_sleep_us = 20ULL * 1000000ULL;

// Configurazioni ADC e acquisizione
static const uint16_t STABILITA_SOGLIA = 50;           // soglia di oscillazione ADC
static const uint16_t NUM_CAMPIONI_STABILITA = 10;     // campioni per verificare stabilità
static const uint32_t TIMEOUT_ACQUISIZIONE_MS = 5000;  // timeout ADC in ms
static const uint16_t NUM_CAMPIONI_MEDIA = 5;          // campioni per media mobile

// Configurazioni taratura
static const float TARATURA_OFFSET_MIN = -100.0f;
static const float TARATURA_OFFSET_MAX = 100.0f;
static const float TARATURA_COEFF_MIN = 0.001f;
static const float TARATURA_COEFF_MAX = 100.0f;

// Configurazioni soglie
static const float TOLLERANZA_PESO_NEGATIVO = 0.5f;    // kg, tolleranza per peso negativo
static const uint32_t STABILITA_AFTER_WAKEUP_MS = 2000; // ms di attesa dopo wake-up

// ==================== ENUM ERRORI ====================
enum class ErrorCode {
  ERR_PS_2_01,  // Lettura ADC non pronta
  ERR_PS_2_02,  // Timeout acquisizione
  ERR_PS_2_03,  // Saturazione ADC
  ERR_PS_2_04,  // Valore instabile
  ERR_PS_2_05,  // Outlier improvviso
  ERR_PS_2_06,  // Taratura non presente
  ERR_PS_2_07,  // Taratura non valida
  ERR_PS_2_08,  // Errore conversione in kg
  ERR_PS_2_09,  // Peso fuori range
  ERR_PS_2_10,  // Peso negativo
  ERR_PS_2_11,  // Prima misura instabile dopo wake-up
  ERR_PS_2_12,  // Timestamp mancante
  ERR_PS_2_13,  // Timestamp non valido
  ERR_PS_2_14,  // Invio fallito
  ERR_PS_2_15,  // Duplicazione misura
  ERR_OK        // Nessun errore
};

// ==================== STRUTTURE DATI ====================
struct TaraturaData {
  float offset;
  float coefficiente;
  bool valida;
  uint32_t timestamp_taratura;
};

struct MisuraWeight {
  float valore_kg;
  uint64_t timestamp_ms;
  uint32_t timestamp_unix;
  bool valida;
  ErrorCode ultimo_errore;
  uint16_t tentativo_invio;
  uint32_t hash_misura; // per rilevare duplicazioni
};

struct StatusSensore {
  bool adc_online;
  bool sensore_online;
  uint32_t ultimo_wake_up_ms;
  bool prima_lettura_dopo_wakeup;
  TaraturaData taratura;
  MisuraWeight ultima_misura;
};

// ==================== VARIABILI GLOBALI ====================
static StatusSensore g_status = {
  . adc_online = false,
  .sensore_online = false,
  .ultimo_wake_up_ms = 0,
  .prima_lettura_dopo_wakeup = true,
  .taratura = {. offset = 0.0f, .coefficiente = 1.0f, .valida = false, .timestamp_taratura = 0},
  .ultima_misura = {.valore_kg = 0.0f, . timestamp_ms = 0, . timestamp_unix = 0, . valida = false,
                    .ultimo_errore = ErrorCode::ERR_OK, .tentativo_invio = 0, .hash_misura = 0}
};

// Buffer per dati accumulati offline
static const uint8_t MAX_DATI_LOCALI = 10;
static MisuraWeight buffer_dati_locali[MAX_DATI_LOCALI];
static uint8_t count_dati_locali = 0;

// ==================== FUNZIONI DI LOG E DEBUG ====================
static void logErrore(ErrorCode errore, const char* descrizione = nullptr) {
  Serial.print("ERROR:  ERR-PS-2.");
  switch (errore) {
    case ErrorCode::ERR_PS_2_01: Serial.print("01"); break;
    case ErrorCode::ERR_PS_2_02: Serial.print("02"); break;
    case ErrorCode::ERR_PS_2_03: Serial. print("03"); break;
    case ErrorCode::ERR_PS_2_04: Serial.print("04"); break;
    case ErrorCode::ERR_PS_2_05: Serial.print("05"); break;
    case ErrorCode::ERR_PS_2_06: Serial.print("06"); break;
    case ErrorCode::ERR_PS_2_07: Serial.print("07"); break;
    case ErrorCode:: ERR_PS_2_08: Serial.print("08"); break;
    case ErrorCode::ERR_PS_2_09: Serial.print("09"); break;
    case ErrorCode::ERR_PS_2_10: Serial.print("10"); break;
    case ErrorCode::ERR_PS_2_11: Serial. print("11"); break;
    case ErrorCode::ERR_PS_2_12: Serial.print("12"); break;
    case ErrorCode::ERR_PS_2_13: Serial.print("13"); break;
    case ErrorCode::ERR_PS_2_14: Serial.print("14"); break;
    case ErrorCode::ERR_PS_2_15: Serial.print("15"); break;
    case ErrorCode::ERR_OK:       Serial.print("OK");  return;
  }
  Serial. print(" - ");
  if (descrizione) {
    Serial.println(descrizione);
  } else {
    Serial.println("Descrizione non disponibile");
  }
}

static void logAlert(const char* tipo, float valore_kg) {
  Serial.print("ALERT [");
  Serial.print(tipo);
  Serial.print("]: ");
  Serial.print(valore_kg, 3);
  Serial.println(" kg");
}

// ==================== FUNZIONI DI SENSORE ====================

// ERR-PS-2.01, ERR-PS-2.02:  Controllo readiness e timeout ADC
static ErrorCode verificaReadinessADC(uint32_t timeout_ms = TIMEOUT_ACQUISIZIONE_MS) {
  uint32_t start_ms = millis();
 
  // SIMULAZIONE:  In produzione, leggere il pin di ready dell'ADC
  // while (! digitalRead(ADC_READY_PIN)) {
  while ((millis() - start_ms) < timeout_ms) {
    // Simuliamo che ADC sia pronto dopo 100ms
    if ((millis() - start_ms) > 100) {
      g_status.adc_online = true;
      return ErrorCode::ERR_OK;
    }
    delay(10);
  }
 
  g_status.adc_online = false;
  logErrore(ErrorCode::ERR_PS_2_01, "ADC non pronto entro timeout");
  return ErrorCode::ERR_PS_2_01;
}

// ERR-PS-2.02: Timeout acquisizione
static ErrorCode verificaTimeoutAcquisizione() {
  uint32_t timeout_ms = 5000;
  uint32_t start_ms = millis();
 
  // Simulazione lettura:  in produzione, leggere SPI/I2C dall'ADC
  while ((millis() - start_ms) < timeout_ms) {
    // Se riusciamo a leggere, OK
    delay(50);
    if ((millis() - start_ms) > 200) {
      return ErrorCode::ERR_OK;
    }
  }
 
  logErrore(ErrorCode::ERR_PS_2_02, "Timeout:  ADC non risponde");
  return ErrorCode::ERR_PS_2_02;
}

// ERR-PS-2.03: Rilevamento saturazione ADC
static ErrorCode verificaSaturazioneADC(uint32_t adc_raw) {
  // Assumiamo ADC a 24bit:  0 a 16777215
  static const uint32_t ADC_MIN_SATURATION = 0;
  static const uint32_t ADC_MAX_SATURATION = 16777215;
  static const uint16_t TOLERANCE = 100;
 
  // Se rimane fisso ai limiti per più letture, è saturato
  if ((adc_raw < ADC_MIN_SATURATION + TOLERANCE) ||
      (adc_raw > ADC_MAX_SATURATION - TOLERANCE)) {
    logErrore(ErrorCode::ERR_PS_2_03, "Saturazione ADC rilevata");
    return ErrorCode::ERR_PS_2_03;
  }
 
  return ErrorCode::ERR_OK;
}

// ERR-PS-2.04: Verifica stabilità del valore
static ErrorCode verificaStabilita(uint32_t campioni[NUM_CAMPIONI_STABILITA]) {
  if (! campioni) {
    return ErrorCode::ERR_PS_2_04;
  }
 
  uint32_t min_val = campioni[0];
  uint32_t max_val = campioni[0];
 
  for (uint8_t i = 1; i < NUM_CAMPIONI_STABILITA; i++) {
    if (campioni[i] < min_val) min_val = campioni[i];
    if (campioni[i] > max_val) max_val = campioni[i];
  }
 
  uint32_t oscillazione = max_val - min_val;
 
  if (oscillazione > STABILITA_SOGLIA) {
    logErrore(ErrorCode:: ERR_PS_2_04, "Valore instabile: oscillazione troppo alta");
    return ErrorCode::ERR_PS_2_04;
  }
 
  return ErrorCode::ERR_OK;
}

// ERR-PS-2.05: Rilevamento outlier
static ErrorCode rileva_outlier(uint32_t campioni[NUM_CAMPIONI_MEDIA]) {
  // Calcola media
  uint64_t somma = 0;
  for (uint8_t i = 0; i < NUM_CAMPIONI_MEDIA; i++) {
    somma += campioni[i];
  }
  float media = (float)somma / NUM_CAMPIONI_MEDIA;
 
  // Calcola deviazione standard
  float varianza = 0;
  for (uint8_t i = 0; i < NUM_CAMPIONI_MEDIA; i++) {
    float delta = (float)campioni[i] - media;
    varianza += delta * delta;
  }
  varianza /= NUM_CAMPIONI_MEDIA;
  float dev_std = sqrt(varianza);
 
  // Rileva outlier (> 3 sigma)
  float soglia_outlier = 3.0f * dev_std;
  for (uint8_t i = 0; i < NUM_CAMPIONI_MEDIA; i++) {
    if (abs((float)campioni[i] - media) > soglia_outlier) {
      logErrore(ErrorCode::ERR_PS_2_05, "Outlier rilevato nei campioni");
      return ErrorCode::ERR_PS_2_05;
    }
  }
 
  return ErrorCode:: ERR_OK;
}

// ERR-PS-2.06, ERR-PS-2.07: Validazione taratura
static ErrorCode verificaTaratura() {
  // ERR-PS-2.06: Taratura non presente
  if (!g_status. taratura.valida) {
    logErrore(ErrorCode::ERR_PS_2_06, "Taratura non presente");
    return ErrorCode::ERR_PS_2_06;
  }
 
  // ERR-PS-2.07: Taratura non valida
  if ((g_status.taratura.offset < TARATURA_OFFSET_MIN || g_status.taratura.offset > TARATURA_OFFSET_MAX) ||
      (g_status.taratura.coefficiente < TARATURA_COEFF_MIN || g_status.taratura.coefficiente > TARATURA_COEFF_MAX)) {
    logErrore(ErrorCode::ERR_PS_2_07, "Taratura non valida (out of range)");
    return ErrorCode::ERR_PS_2_07;
  }
 
  return ErrorCode::ERR_OK;
}

// Funzione per impostare taratura (da chiamare durante procedura di calibrazione)
static void impostaTaratura(float offset, float coefficiente) {
  if ((offset >= TARATURA_OFFSET_MIN && offset <= TARATURA_OFFSET_MAX) &&
      (coefficiente >= TARATURA_COEFF_MIN && coefficiente <= TARATURA_COEFF_MAX)) {
    g_status.taratura.offset = offset;
    g_status. taratura.coefficiente = coefficiente;
    g_status.taratura.valida = true;
    g_status.taratura.timestamp_taratura = millis();
    Serial.println("Taratura impostata con successo");
  } else {
    logErrore(ErrorCode::ERR_PS_2_07, "Parametri taratura non validi");
  }
}

// ERR-PS-2.11: Verifica stabilità dopo wake-up
static ErrorCode verificaStabilitaPostWakeup() {
  if (!g_status.prima_lettura_dopo_wakeup) {
    return ErrorCode::ERR_OK;
  }
 
  uint32_t tempo_da_wakeup = millis() - g_status.ultimo_wake_up_ms;
  if (tempo_da_wakeup < STABILITA_AFTER_WAKEUP_MS) {
    logErrore(ErrorCode::ERR_PS_2_11, "Prima misura instabile dopo wake-up");
    return ErrorCode::ERR_PS_2_11;
  }
 
  g_status.prima_lettura_dopo_wakeup = false;
  return ErrorCode::ERR_OK;
}

// ==================== FUNZIONI DI CONVERSIONE ====================

// ERR-PS-2.08: Conversione in kg con validazione
static ErrorCode conversioneInKg(uint32_t adc_raw, float* risultato_kg) {
  if (! risultato_kg) {
    logErrore(ErrorCode::ERR_PS_2_08, "Puntatore risultato nullo");
    return ErrorCode:: ERR_PS_2_08;
  }
 
  // Verifica che taratura sia valida
  ErrorCode err_taratura = verificaTaratura();
  if (err_taratura != ErrorCode::ERR_OK) {
    return err_taratura;
  }
 
  // Conversione:  kg = (adc_raw - offset) * coefficiente
  float valore_kg = ((float)adc_raw - g_status.taratura.offset) * g_status.taratura.coefficiente;
 
  // Verifica NaN o infinito
  if (isnan(valore_kg) || isinf(valore_kg)) {
    logErrore(ErrorCode::ERR_PS_2_08, "Conversione produce NaN o infinito");
    return ErrorCode::ERR_PS_2_08;
  }
 
  *risultato_kg = valore_kg;
  return ErrorCode::ERR_OK;
}

// ==================== FUNZIONI DI VALIDAZIONE ====================

// ERR-PS-2.09: Verifica range min/max
static ErrorCode verificaRangePeso(float valore_peso_kg) {
  if (valore_peso_kg < TEST_peso_min_kg || valore_peso_kg > TEST_peso_max_kg) {
    logErrore(ErrorCode:: ERR_PS_2_09, "Peso fuori range min/max");
    logAlert("PESO FUORI RANGE", valore_peso_kg);
    return ErrorCode::ERR_PS_2_09;
  }
  return ErrorCode:: ERR_OK;
}

// ERR-PS-2.10: Verifica peso negativo
static ErrorCode verificaPesoNegativo(float valore_peso_kg) {
  if (valore_peso_kg < -TOLLERANZA_PESO_NEGATIVO) {
    logErrore(ErrorCode::ERR_PS_2_10, "Peso negativo oltre tolleranza");
    return ErrorCode::ERR_PS_2_10;
  }
  return ErrorCode::ERR_OK;
}

// ==================== FUNZIONI TIMESTAMP ====================

// ERR-PS-2.12, ERR-PS-2.13:  Validazione timestamp
static ErrorCode generaTimestamp(uint64_t* timestamp_ms_out, uint32_t* timestamp_unix_out) {
  if (!timestamp_ms_out || !timestamp_unix_out) {
    logErrore(ErrorCode::ERR_PS_2_12, "Puntatori timestamp nulli");
    return ErrorCode:: ERR_PS_2_12;
  }
 
  uint64_t timestamp_ms = millis();
 
  // In una implementazione reale, ottenere timestamp UNIX da RTC o NTP
  // Per ora, simuliamo:  1705324800 = 2024-01-15 00:00:00 UTC
  uint32_t timestamp_unix = 1705324800 + (timestamp_ms / 1000);
 
  // Validazione timestamp (anno tra 2024-2050)
  // UNIX timestamp 1704067200 = 2024-01-01
  // UNIX timestamp 2524608000 = 2050-01-01
  if (timestamp_unix < 1704067200 || timestamp_unix > 2524608000) {
    logErrore(ErrorCode::ERR_PS_2_13, "Timestamp non valido (anno non plausibile)");
    return ErrorCode::ERR_PS_2_13;
  }
 
  *timestamp_ms_out = timestamp_ms;
  *timestamp_unix_out = timestamp_unix;
  return ErrorCode::ERR_OK;
}

// ==================== FUNZIONI HASH E DUPLICAZIONE ====================

// ERR-PS-2.15: Calcola hash per rilevare duplicazioni
static uint32_t calcolaHashMisura(float valore_kg, uint32_t timestamp_unix) {
  // Hash semplice: combina valore e timestamp
  uint32_t hash = 0;
 
  // Hash del valore (come se fosse un float a 32bit)
  uint32_t float_bits = *(uint32_t*)&valore_kg;
  hash ^= float_bits;
 
  // Hash del timestamp
  hash ^= timestamp_unix;
  hash ^= (timestamp_unix >> 16);
 
  return hash;
}

static ErrorCode verificaDuplicazione(const MisuraWeight& misura) {
  // Se è la prima misura, non può essere duplicata
  if (g_status.ultima_misura. hash_misura == 0) {
    return ErrorCode::ERR_OK;
  }
 
  // Confronta hash e timestamp
  if (misura.hash_misura == g_status.ultima_misura. hash_misura &&
      misura.timestamp_unix == g_status.ultima_misura.timestamp_unix) {
    logErrore(ErrorCode::ERR_PS_2_15, "Duplicazione misura rilevata");
    return ErrorCode::ERR_PS_2_15;
  }
 
  return ErrorCode::ERR_OK;
}

// ==================== FUNZIONI TARATURA ====================

static void taraturaDifferenzaPeso() {
  Serial.println("\n=== PROCEDURA DI TARATURA ===");
  Serial.println("1. Posizionare il sensore a zero (senza peso)");
  Serial.println("2. Inviare comando di azzeramento via seriale");
  Serial.println("3. Posizionare peso noto e inviare valore di calibrazione");
 
  // TEST:  Per ora, impostare taratura di default
  impostaTaratura(0.0f, 0.001f); // offset=0, coeff=0.001
}

// ==================== FUNZIONI DI ACQUISIZIONE ====================

static ErrorCode acquisisciMisura(MisuraWeight* misura_out) {
  if (!misura_out) {
    return ErrorCode::ERR_PS_2_12;
  }
 
  // 1. Verifica stabilità post wake-up
  ErrorCode err = verificaStabilitaPostWakeup();
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 2. Verifica readiness ADC
  err = verificaReadinessADC();
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 3. Verifica timeout
  err = verificaTimeoutAcquisizione();
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 4. Leggi campioni ADC (simulazione)
  uint32_t adc_raw = 8388608; // valore di test (metà scala 24bit)
 
  // 5. Verifica saturazione
  err = verificaSaturazioneADC(adc_raw);
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 6. Verifica stabilità (simulazione con array di campioni)
  uint32_t campioni_test[NUM_CAMPIONI_STABILITA];
  for (uint8_t i = 0; i < NUM_CAMPIONI_STABILITA; i++) {
    campioni_test[i] = adc_raw + (i % 5); // oscillazione minima per test
  }
  err = verificaStabilita(campioni_test);
  if (err != ErrorCode:: ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 7. Verifica outlier (simulazione)
  uint32_t campioni_media[NUM_CAMPIONI_MEDIA];
  for (uint8_t i = 0; i < NUM_CAMPIONI_MEDIA; i++) {
    campioni_media[i] = adc_raw;
  }
  err = rileva_outlier(campioni_media);
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 8. Conversione in kg
  float valore_kg;
  err = conversioneInKg(adc_raw, &valore_kg);
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 9. Verifica peso negativo
  err = verificaPesoNegativo(valore_kg);
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 10. Verifica range
  err = verificaRangePeso(valore_kg);
  if (err != ErrorCode:: ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 11. Genera timestamp
  uint64_t timestamp_ms;
  uint32_t timestamp_unix;
  err = generaTimestamp(&timestamp_ms, &timestamp_unix);
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 12. Calcola hash e verifica duplicazione
  uint32_t hash_misura = calcolaHashMisura(valore_kg, timestamp_unix);
  MisuraWeight misura_temp = {
    .valore_kg = valore_kg,
    .timestamp_ms = timestamp_ms,
    .timestamp_unix = timestamp_unix,
    .valida = true,
    .ultimo_errore = ErrorCode::ERR_OK,
    .tentativo_invio = 0,
    .hash_misura = hash_misura
  };
 
  err = verificaDuplicazione(misura_temp);
  if (err != ErrorCode::ERR_OK) {
    misura_out->ultimo_errore = err;
    return err;
  }
 
  // 13. Misura acquisita con successo
  *misura_out = misura_temp;
  misura_out->ultimo_errore = ErrorCode::ERR_OK;
 
  Serial.print("Peso OK: ");
  Serial.print(valore_kg, 3);
  Serial.println(" kg");
 
  return ErrorCode::ERR_OK;
}

// ==================== FUNZIONI DI SALVATAGGIO ====================

// Salva misura su memoria locale (RNF-SW-01)
static void salvaMemoriaLocale(const MisuraWeight& misura) {
  if (! misura.valida) {
    return;
  }
 
  if (count_dati_locali < MAX_DATI_LOCALI) {
    buffer_dati_locali[count_dati_locali] = misura;
    count_dati_locali++;
    Serial.println("Misura salvata su memoria locale");
  } else {
    Serial.println("WARNING: Buffer memoria locale pieno!");
  }
}

// ==================== FUNZIONI DI COMUNICAZIONE ====================

// ERR-PS-2.14: Invio con gestione retry
static ErrorCode invioAlertPesoFuoriRange(float valore_peso_kg) {
  Serial.print("ALERT:  Invio notifica peso fuori range = ");
  Serial.print(valore_peso_kg, 3);
  Serial.println(" kg");
 
  // Simulazione invio
  bool invio_riuscito = true; // In produzione, vero invio a server/DB
 
  if (! invio_riuscito) {
    logErrore(ErrorCode::ERR_PS_2_14, "Falha nell'invio dell'alert");
    return ErrorCode::ERR_PS_2_14;
  }
 
  return ErrorCode::ERR_OK;
}

// Tenta sincronizzazione dati locali con cloud
static void sincronizzaCloudDb(bool connesso = true) {
  if (!connesso) {
    Serial.println("INFO: Connettività non disponibile, dati salvati localmente");
    return;
  }
 
  if (count_dati_locali == 0) {
    return;
  }
 
  Serial.println("INFO: Tentativo sincronizzazione dati locali con Cloud/DB.. .");
  for (uint8_t i = 0; i < count_dati_locali; i++) {
    // Simulazione invio
    Serial.print("  - Invio misura ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.print(buffer_dati_locali[i].valore_kg, 3);
    Serial.println(" kg");
  }
 
  // Se invio riuscito, pulisci buffer
  count_dati_locali = 0;
  Serial.println("INFO: Sincronizzazione completata");
}

// ==================== CICLO PRINCIPALE ====================

static void cicloSensorePeso() {
  Serial.println("\n========== CICLO SENSORE DI PESO ==========");
 
  // 1. Taratura
  Serial.println("1. Taratura del sensore...");
  taraturaDifferenzaPeso();
 
  // 2. Acquisizione con validazione completa
  Serial.println("2. Acquisizione misura.. .");
  MisuraWeight misura;
  ErrorCode acquisizione_result = acquisisciMisura(&misura);
 
  if (acquisizione_result != ErrorCode::ERR_OK) {
    Serial.print("Acquisizione fallita con errore: ");
    logErrore(acquisizione_result);
   
    // Anche con errore, aggiungiamo info di debug
    Serial.print("  Codice errore: ");
    Serial.println((int)acquisizione_result);
   
    // Ritorno in deep sleep anche in caso di errore
    ritornoInDeepSleep();
    return;
  }
 
  // 3. Aggiorna ultima misura conosciuta
  g_status.ultima_misura = misura;
 
  // 4. Verifica soglie
  Serial.println("3. Verifica soglie (min/max)...");
  if (misura.valore_kg < TEST_peso_min_kg) {
    invioAlertPesoFuoriRange(misura.valore_kg);
  } else if (misura. valore_kg > TEST_peso_max_kg) {
    invioAlertPesoFuoriRange(misura.valore_kg);
  }
 
  // 5. Salvataggio memoria locale
  Serial.println("4. Salvataggio memoria locale.. .");
  salvaMemoriaLocale(misura);
 
  // 6. Sincronizzazione cloud (simulazione:  connessione disponibile)
  Serial.println("5. Tentativo sincronizzazione cloud...");
  sincronizzaCloudDb(true);
 
  // 7. Deep sleep
  ritornoInDeepSleep();
}

// ==================== FUNZIONE DEEP SLEEP ====================

static void ritornoInDeepSleep() {
  Serial.println("\n6.  Configurazione Deep Sleep...");
  Serial.print("Deep Sleep ");
  Serial.print(TEST_sleep_us / 1000000);
  Serial.println(" secondi.. .\n");
 
  g_status.ultimo_wake_up_ms = millis();
  g_status.prima_lettura_dopo_wakeup = true;
 
  esp_sleep_enable_timer_wakeup(TEST_sleep_us);
  esp_deep_sleep_start();
}

// ==================== SETUP E LOOP ====================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== SISTEMA SENSORE DI PESO - AVVIO ===");
 
  g_status.ultimo_wake_up_ms = millis();
 
  cicloSensorePeso();
}

void loop() {
  // Non utilizzato - tutto gestito da deep sleep
}
