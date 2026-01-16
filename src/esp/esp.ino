// ============================================================================
// ESP32-CAM - Main Controller Sistema Monitoraggio Arnia
// ============================================================================

#include <WiFi.h>
#include "SensorValidation.h"

// ============================================================================
// CONFIGURAZIONE DEVICE (da personalizzare per ogni arnia)
// ============================================================================
const char* WIFI_SSID = "ARNIA_WIFI";
const char* WIFI_PASSWORD = "password123";

// Configurazione server REST
const char* REST_URL = "https://apicoltura-xxxx.restdb.io/rest";
const char* REST_KEY = "your-api-key-here";
const int REST_TIMEOUT = 10000;

// ============================================================================
// VARIABILI DEVICE
// ============================================================================
char deviceMacAddress[18] = "";

// ============================================================================
// DICHIARAZIONE FUNZIONI DATA MANAGER (connection_manager.ino)
// ============================================================================
extern void init_data_manager(ServerConfig* config);
extern bool is_data_manager_ready();
extern ConfigData fetch_sensor_config(const char* macAddress);
extern bool save_sensor_data(SensorData* data);
extern bool save_value(const char* macAddress, const char* tipoSensore,
                       const char* idSensore, float valore, const char* unita,
                       unsigned long timestamp, int codiceStato,
                       bool alert, const char* alertTipo);
extern bool send_notification(NotificationData* notification);
extern bool notify(const char* macAddress, const char* tipoSensore,
                   float valoreRiferimento, unsigned long timestamp,
                   const char* messaggio, int livello);

// ============================================================================
// DICHIARAZIONE FUNZIONI DEI SENSORI
// ============================================================================

// DS18B20 - Temperatura interna
extern void setup_ds18b20();
extern void init_ds18b20(SensorConfig* config);
extern RisultatoValidazione read_temperature_ds18b20();
extern unsigned long get_intervallo_ds18b20();
extern bool is_abilitato_ds18b20();

// SHT21 - Temperatura e Umidita ambientale
extern void setup_sht21();
extern void init_humidity_sht21(SensorConfig* config);
extern void init_temperature_sht21(SensorConfig* config);
extern RisultatoValidazione read_humidity_sht21();
extern RisultatoValidazione read_temperature_sht21();
extern unsigned long get_intervallo_humidity_sht21();
extern unsigned long get_intervallo_temperature_sht21();
extern bool is_abilitato_humidity_sht21();
extern bool is_abilitato_temperature_sht21();

// HX711 - Peso
extern void setup_hx711();
extern void init_hx711(SensorConfig* config);
extern void calibrate_hx711(float calibration_factor, long offset);
extern RisultatoValidazione read_weight_hx711();
extern unsigned long get_intervallo_hx711();
extern bool is_abilitato_hx711();

// ============================================================================
// TIMING
// ============================================================================
unsigned long ultimoCheck_ds18b20 = 0;
unsigned long ultimoCheck_sht21_humidity = 0;
unsigned long ultimoCheck_sht21_temperature = 0;
unsigned long ultimoCheck_hx711 = 0;

// ============================================================================
// STATO SISTEMA
// ============================================================================
bool wifiConnesso = false;
bool configCaricata = false;

// ============================================================================
// GESTIONE WI-FI (specifica del device)
// ============================================================================
void initWiFi() {
  // Ottieni MAC address
  uint8_t mac[6];
  WiFi.macAddress(mac);
  snprintf(deviceMacAddress, sizeof(deviceMacAddress), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  Serial.print("  MAC Address: ");
  Serial.println(deviceMacAddress);

  WiFi.mode(WIFI_STA);
}

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnesso = true;
    return true;
  }

  Serial.print("  Connessione a ");
  Serial.print(WIFI_SSID);
  Serial.print("...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tentativi = 0;
  while (WiFi.status() != WL_CONNECTED && tentativi < 20) {
    delay(500);
    Serial.print(".");
    tentativi++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnesso = true;
    Serial.println(" OK");
    Serial.print("    IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("    RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    return true;
  } else {
    wifiConnesso = false;
    Serial.println(" FALLITO");
    return false;
  }
}

bool isWiFiConnected() {
  wifiConnesso = (WiFi.status() == WL_CONNECTED);
  return wifiConnesso;
}

// ============================================================================
// CARICAMENTO CONFIG DA SERVER
// ============================================================================
void caricaConfigDaServer() {
  Serial.println("\n--- CARICAMENTO CONFIGURAZIONE ---\n");

  if (!isWiFiConnected()) {
    Serial.println("  ! Wi-Fi non connesso, uso config default");
  }

  // Fetch config dal server
  ConfigData config = fetch_sensor_config(deviceMacAddress);

  if (config.success) {
    Serial.println("  + Config ricevuta dal server");
  } else {
    Serial.println("  ! Config non disponibile, uso valori default");
  }

  // Applica configurazioni ai sensori
  init_ds18b20(&config.ds18b20);
  init_humidity_sht21(&config.sht21_humidity);
  init_temperature_sht21(&config.sht21_temperature);
  init_hx711(&config.hx711);

  // Calibrazione peso
  calibrate_hx711(config.calibrationFactor, config.calibrationOffset);

  configCaricata = true;
  Serial.println("\n--- CONFIGURAZIONE APPLICATA ---\n");
}

// ============================================================================
// INVIO DATO SENSORE
// ============================================================================
void inviaDatoSensore(const char* tipoSensore, const char* idSensore,
                      RisultatoValidazione* risultato, const char* unita) {

  if (!isWiFiConnected()) {
    Serial.println("  ! Wi-Fi non connesso, dato non inviato");
    // TODO: Salvare in buffer locale
    return;
  }

  // Determina alert
  bool alert = false;
  const char* alertTipo = "";

  if (risultato->codiceErrore == ALERT_THRESHOLD_HIGH) {
    alert = true;
    alertTipo = "HIGH";
  } else if (risultato->codiceErrore == ALERT_THRESHOLD_LOW) {
    alert = true;
    alertTipo = "LOW";
  }

  // Salva sul server
  bool salvato = save_value(
    deviceMacAddress,
    tipoSensore,
    idSensore,
    risultato->valorePulito,
    unita,
    millis(),
    risultato->codiceErrore,
    alert,
    alertTipo
  );

  if (!salvato) {
    Serial.println("  ! Errore salvataggio dato");
    // TODO: Salvare in buffer locale
  }
}

// ============================================================================
// SETUP PRINCIPALE
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n");
  Serial.println("========================================");
  Serial.println("  SISTEMA MONITORAGGIO ARNIA - PCTO");
  Serial.println("  Main Controller v2.2");
  Serial.println("========================================");
  Serial.println();

  // FASE 1: Inizializzazione Wi-Fi (gestione locale)
  Serial.println("FASE 1: INIZIALIZZAZIONE WI-FI\n");
  initWiFi();

  if (connectWiFi()) {
    Serial.println("  + Wi-Fi connesso\n");
  } else {
    Serial.println("  ! Wi-Fi non disponibile, modalita' offline\n");
  }

  // FASE 2: Inizializzazione Data Manager (server REST)
  Serial.println("FASE 2: INIZIALIZZAZIONE DATA MANAGER\n");
  ServerConfig serverConfig;
  strncpy(serverConfig.baseUrl, REST_URL, sizeof(serverConfig.baseUrl) - 1);
  strncpy(serverConfig.apiKey, REST_KEY, sizeof(serverConfig.apiKey) - 1);
  serverConfig.timeout = REST_TIMEOUT;
  init_data_manager(&serverConfig);

  // FASE 3: Inizializzazione hardware sensori
  Serial.println("\nFASE 3: INIZIALIZZAZIONE HARDWARE\n");
  setup_ds18b20();
  setup_sht21();
  setup_hx711();
  Serial.println("+ Tutti i sensori inizializzati\n");

  // FASE 4: Caricamento configurazione dal server
  Serial.println("FASE 4: CARICAMENTO CONFIGURAZIONE");
  caricaConfigDaServer();

  // Stampa intervalli
  Serial.println("Intervalli di campionamento:");
  Serial.print("  - DS18B20:     "); Serial.print(get_intervallo_ds18b20() / 1000); Serial.println(" sec");
  Serial.print("  - SHT21 Hum:   "); Serial.print(get_intervallo_humidity_sht21() / 1000); Serial.println(" sec");
  Serial.print("  - SHT21 Temp:  "); Serial.print(get_intervallo_temperature_sht21() / 1000); Serial.println(" sec");
  Serial.print("  - HX711:       "); Serial.print(get_intervallo_hx711() / 1000); Serial.println(" sec");
  Serial.println();

  Serial.println("========================================");
  Serial.println("  -> AVVIO MONITORAGGIO...");
  Serial.println("========================================\n");
}

// ============================================================================
// LOOP PRINCIPALE
// ============================================================================
void loop() {
  unsigned long tempoAttuale = millis();

  // ──────────────────────────────────────
  // DS18B20 - TEMPERATURA INTERNA
  // ──────────────────────────────────────
  if (is_abilitato_ds18b20() &&
      (tempoAttuale - ultimoCheck_ds18b20 >= get_intervallo_ds18b20())) {
    ultimoCheck_ds18b20 = tempoAttuale;

    Serial.println("\n[DS18B20] LETTURA TEMPERATURA INTERNA");
    RisultatoValidazione risultato = read_temperature_ds18b20();
    gestisciRisultatoValidazione(risultato);

    if (risultato.valido) {
      Serial.print("  -> Valore: "); Serial.print(risultato.valorePulito); Serial.println(" C");
      inviaDatoSensore("temperatura_interna", "DS18B20_001", &risultato, "C");
    }
    Serial.println("---\n");
  }

  // ──────────────────────────────────────
  // SHT21 - UMIDITA
  // ──────────────────────────────────────
  if (is_abilitato_humidity_sht21() &&
      (tempoAttuale - ultimoCheck_sht21_humidity >= get_intervallo_humidity_sht21())) {
    ultimoCheck_sht21_humidity = tempoAttuale;

    Serial.println("\n[SHT21] LETTURA UMIDITA");
    RisultatoValidazione risultato = read_humidity_sht21();
    gestisciRisultatoValidazione(risultato);

    if (risultato.valido) {
      Serial.print("  -> Valore: "); Serial.print(risultato.valorePulito); Serial.println(" %");
      inviaDatoSensore("umidita", "SHT21_HUM_001", &risultato, "%");
    }
    Serial.println("---\n");
  }

  // ──────────────────────────────────────
  // SHT21 - TEMPERATURA AMBIENTE
  // ──────────────────────────────────────
  if (is_abilitato_temperature_sht21() &&
      (tempoAttuale - ultimoCheck_sht21_temperature >= get_intervallo_temperature_sht21())) {
    ultimoCheck_sht21_temperature = tempoAttuale;

    Serial.println("\n[SHT21] LETTURA TEMPERATURA AMBIENTE");
    RisultatoValidazione risultato = read_temperature_sht21();
    gestisciRisultatoValidazione(risultato);

    if (risultato.valido) {
      Serial.print("  -> Valore: "); Serial.print(risultato.valorePulito); Serial.println(" C");
      inviaDatoSensore("temperatura_ambiente", "SHT21_TEMP_001", &risultato, "C");
    }
    Serial.println("---\n");
  }

  // ──────────────────────────────────────
  // HX711 - PESO
  // ──────────────────────────────────────
  if (is_abilitato_hx711() &&
      (tempoAttuale - ultimoCheck_hx711 >= get_intervallo_hx711())) {
    ultimoCheck_hx711 = tempoAttuale;

    Serial.println("\n[HX711] LETTURA PESO");
    RisultatoValidazione risultato = read_weight_hx711();
    gestisciRisultatoValidazione(risultato);

    if (risultato.valido) {
      Serial.print("  -> Valore: "); Serial.print(risultato.valorePulito); Serial.println(" kg");
      inviaDatoSensore("peso", "HX711_001", &risultato, "kg");
    }
    Serial.println("---\n");
  }

  delay(100);
}

// ============================================================================
// UTILITY
// ============================================================================
void stampaStatistiche() {
  Serial.println("\n--- STATISTICHE ---");
  Serial.print("MAC: "); Serial.println(deviceMacAddress);
  Serial.print("Uptime: "); Serial.print(millis() / 1000); Serial.println(" sec");
  Serial.print("Free RAM: "); Serial.println(ESP.getFreeHeap());
  Serial.print("Wi-Fi: "); Serial.println(isWiFiConnected() ? "Connesso" : "Disconnesso");
  if (isWiFiConnected()) {
    Serial.print("RSSI: "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
  }
  Serial.println();
}
