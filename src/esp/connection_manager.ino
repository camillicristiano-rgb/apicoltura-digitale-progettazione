// ============================================================================
// CONNECTION MANAGER - Gestione comunicazione con server REST / DB
// ============================================================================
// Questo modulo astrae la comunicazione con il backend.
// Puo' essere sostituito con implementazioni diverse (REST, MySQL, file, ecc.)
// senza modificare il resto del firmware.
// ============================================================================

#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "SensorValidation.h"

// ============================================================================
// CONFIGURAZIONE SERVER (impostata da init_data_manager)
// ============================================================================
static char _server_base_url[128] = "";
static char _server_api_key[64] = "";
static int _server_timeout = 10000;

// Endpoint REST (configurabili)
static const char* ENDPOINT_CONFIG = "/configurazioni";
static const char* ENDPOINT_RILEVAZIONI = "/rilevazioni";
static const char* ENDPOINT_NOTIFICHE = "/notifiche";

// ============================================================================
// STATO
// ============================================================================
static bool _manager_inizializzato = false;

// ============================================================================
// STRUTTURE DATI
// ============================================================================

// Configurazione server
struct ServerConfig {
  char baseUrl[128];
  char apiKey[64];
  int timeout;
};

// Valore sensore da salvare
struct SensorData {
  char macAddress[18];
  char tipoSensore[32];
  char idSensore[32];
  float valore;
  char unita[8];
  unsigned long timestamp;
  int codiceStato;
  bool alert;
  char alertTipo[16];
};

// Notifica/Log
struct NotificationData {
  char macAddress[18];
  char tipoSensore[32];
  float valoreRiferimento;
  unsigned long timestamp;
  char messaggio[128];
  int livello;  // 0=INFO, 1=WARNING, 2=ERROR, 3=CRITICAL
};

// Risposta configurazione
struct ConfigData {
  bool success;
  SensorConfig ds18b20;
  SensorConfig sht21_humidity;
  SensorConfig sht21_temperature;
  SensorConfig hx711;
  float calibrationFactor;
  long calibrationOffset;
};

// ============================================================================
// INIT - Inizializzazione Data Manager
// ============================================================================
void init_data_manager(ServerConfig* config) {
  if (config == NULL) {
    Serial.println("  ! init_data_manager: config NULL");
    return;
  }

  strncpy(_server_base_url, config->baseUrl, sizeof(_server_base_url) - 1);
  strncpy(_server_api_key, config->apiKey, sizeof(_server_api_key) - 1);
  _server_timeout = config->timeout;
  _manager_inizializzato = true;

  Serial.println("  --- Data Manager inizializzato ---");
  Serial.print("    Server: ");
  Serial.println(_server_base_url);
}

// ============================================================================
// VERIFICA STATO
// ============================================================================
bool is_data_manager_ready() {
  return _manager_inizializzato && strlen(_server_base_url) > 0;
}

// ============================================================================
// FETCH CONFIG - Lettura configurazione sensori dal server
// ============================================================================
ConfigData fetch_sensor_config(const char* macAddress) {
  ConfigData response;
  response.success = false;

  // Valori default
  response.ds18b20 = {30.0f, 37.0f, 360000, true};
  response.sht21_humidity = {40.0f, 70.0f, 360000, true};
  response.sht21_temperature = {10.0f, 45.0f, 360000, true};
  response.hx711 = {10.0f, 80.0f, 10800000, true};
  response.calibrationFactor = 2280.0f;
  response.calibrationOffset = 50000;

  if (!is_data_manager_ready()) {
    Serial.println("  ! fetch_sensor_config: manager non inizializzato");
    return response;
  }

  HTTPClient http;

  // Costruisci URL con filtro MAC address
  char url[256];
  snprintf(url, sizeof(url), "%s%s?q={\"macAddress\":\"%s\"}",
           _server_base_url, ENDPOINT_CONFIG, macAddress);

  Serial.print("  [GET] ");
  Serial.println(url);

  http.begin(url);
  http.setTimeout(_server_timeout);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-apikey", _server_api_key);
  http.addHeader("Cache-Control", "no-cache");

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();

    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc.size() > 0) {
      JsonObject config = doc[0];

      // DS18B20
      if (config.containsKey("ds18b20")) {
        response.ds18b20.sogliaMin = config["ds18b20"]["sogliaMin"] | 30.0f;
        response.ds18b20.sogliaMax = config["ds18b20"]["sogliaMax"] | 37.0f;
        response.ds18b20.intervallo = config["ds18b20"]["intervallo"] | 360000UL;
        response.ds18b20.abilitato = config["ds18b20"]["abilitato"] | true;
      }

      // SHT21 Humidity
      if (config.containsKey("sht21_humidity")) {
        response.sht21_humidity.sogliaMin = config["sht21_humidity"]["sogliaMin"] | 40.0f;
        response.sht21_humidity.sogliaMax = config["sht21_humidity"]["sogliaMax"] | 70.0f;
        response.sht21_humidity.intervallo = config["sht21_humidity"]["intervallo"] | 360000UL;
        response.sht21_humidity.abilitato = config["sht21_humidity"]["abilitato"] | true;
      }

      // SHT21 Temperature
      if (config.containsKey("sht21_temperature")) {
        response.sht21_temperature.sogliaMin = config["sht21_temperature"]["sogliaMin"] | 10.0f;
        response.sht21_temperature.sogliaMax = config["sht21_temperature"]["sogliaMax"] | 45.0f;
        response.sht21_temperature.intervallo = config["sht21_temperature"]["intervallo"] | 360000UL;
        response.sht21_temperature.abilitato = config["sht21_temperature"]["abilitato"] | true;
      }

      // HX711
      if (config.containsKey("hx711")) {
        response.hx711.sogliaMin = config["hx711"]["sogliaMin"] | 10.0f;
        response.hx711.sogliaMax = config["hx711"]["sogliaMax"] | 80.0f;
        response.hx711.intervallo = config["hx711"]["intervallo"] | 10800000UL;
        response.hx711.abilitato = config["hx711"]["abilitato"] | true;
      }

      // Calibrazione peso
      response.calibrationFactor = config["calibrationFactor"] | 2280.0f;
      response.calibrationOffset = config["calibrationOffset"] | 50000L;

      response.success = true;
      Serial.println("  + Config caricata dal server");
    } else {
      Serial.println("  ! Errore parsing JSON");
    }
  } else {
    Serial.print("  ! HTTP Error: ");
    Serial.println(httpCode);
  }

  http.end();
  return response;
}

// ============================================================================
// SAVE SENSOR DATA - Salvataggio valore sensore sul server
// ============================================================================
bool save_sensor_data(SensorData* data) {
  if (data == NULL) {
    Serial.println("  ! save_sensor_data: data NULL");
    return false;
  }

  if (!is_data_manager_ready()) {
    Serial.println("  ! save_sensor_data: manager non inizializzato");
    return false;
  }

  HTTPClient http;

  char url[256];
  snprintf(url, sizeof(url), "%s%s", _server_base_url, ENDPOINT_RILEVAZIONI);

  // Costruisci JSON
  StaticJsonDocument<512> doc;
  doc["macAddress"] = data->macAddress;
  doc["tipoSensore"] = data->tipoSensore;
  doc["idSensore"] = data->idSensore;
  doc["valore"] = data->valore;
  doc["unita"] = data->unita;
  doc["timestamp"] = data->timestamp;
  doc["codiceStato"] = data->codiceStato;
  doc["alert"] = data->alert;
  if (data->alert) {
    doc["alertTipo"] = data->alertTipo;
  }

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.print("  [POST] ");
  Serial.println(url);

  http.begin(url);
  http.setTimeout(_server_timeout);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-apikey", _server_api_key);

  int httpCode = http.POST(jsonPayload);

  bool success = (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED);

  if (success) {
    Serial.println("  + Dato salvato");
  } else {
    Serial.print("  ! HTTP Error: ");
    Serial.println(httpCode);
  }

  http.end();
  return success;
}

// ============================================================================
// HELPER - Salvataggio rapido senza creare struct
// ============================================================================
bool save_value(const char* macAddress, const char* tipoSensore,
                const char* idSensore, float valore, const char* unita,
                unsigned long timestamp, int codiceStato,
                bool alert, const char* alertTipo) {

  SensorData data;
  strncpy(data.macAddress, macAddress, sizeof(data.macAddress) - 1);
  strncpy(data.tipoSensore, tipoSensore, sizeof(data.tipoSensore) - 1);
  strncpy(data.idSensore, idSensore, sizeof(data.idSensore) - 1);
  data.valore = valore;
  strncpy(data.unita, unita, sizeof(data.unita) - 1);
  data.timestamp = timestamp;
  data.codiceStato = codiceStato;
  data.alert = alert;
  strncpy(data.alertTipo, alertTipo, sizeof(data.alertTipo) - 1);

  return save_sensor_data(&data);
}

// ============================================================================
// SEND NOTIFICATION - Invio notifica/log al server
// ============================================================================
// Livelli: 0=INFO, 1=WARNING, 2=ERROR, 3=CRITICAL
// ============================================================================
bool send_notification(NotificationData* notification) {
  if (notification == NULL) {
    Serial.println("  ! send_notification: notification NULL");
    return false;
  }

  if (!is_data_manager_ready()) {
    Serial.println("  ! send_notification: manager non inizializzato");
    return false;
  }

  HTTPClient http;

  char url[256];
  snprintf(url, sizeof(url), "%s%s", _server_base_url, ENDPOINT_NOTIFICHE);

  // Costruisci JSON
  StaticJsonDocument<512> doc;
  doc["macAddress"] = notification->macAddress;
  doc["tipoSensore"] = notification->tipoSensore;
  doc["valoreRiferimento"] = notification->valoreRiferimento;
  doc["timestamp"] = notification->timestamp;
  doc["messaggio"] = notification->messaggio;
  doc["livello"] = notification->livello;

  // Mappa livello a stringa
  const char* livelloStr;
  switch (notification->livello) {
    case 0: livelloStr = "INFO"; break;
    case 1: livelloStr = "WARNING"; break;
    case 2: livelloStr = "ERROR"; break;
    case 3: livelloStr = "CRITICAL"; break;
    default: livelloStr = "UNKNOWN"; break;
  }
  doc["livelloStr"] = livelloStr;
  doc["letto"] = false;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.print("  [POST NOTIFICA] ");
  Serial.println(url);

  http.begin(url);
  http.setTimeout(_server_timeout);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-apikey", _server_api_key);

  int httpCode = http.POST(jsonPayload);

  bool success = (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED);

  if (success) {
    Serial.println("  + Notifica inviata");
  } else {
    Serial.print("  ! HTTP Error: ");
    Serial.println(httpCode);
  }

  http.end();
  return success;
}

// ============================================================================
// HELPER - Invio notifica rapido senza creare struct
// ============================================================================
bool notify(const char* macAddress, const char* tipoSensore,
            float valoreRiferimento, unsigned long timestamp,
            const char* messaggio, int livello) {

  NotificationData notification;
  strncpy(notification.macAddress, macAddress, sizeof(notification.macAddress) - 1);
  strncpy(notification.tipoSensore, tipoSensore, sizeof(notification.tipoSensore) - 1);
  notification.valoreRiferimento = valoreRiferimento;
  notification.timestamp = timestamp;
  strncpy(notification.messaggio, messaggio, sizeof(notification.messaggio) - 1);
  notification.livello = livello;

  return send_notification(&notification);
}

// ============================================================================
// COSTANTI LIVELLI NOTIFICA
// ============================================================================
#define NOTIFY_INFO     0
#define NOTIFY_WARNING  1
#define NOTIFY_ERROR    2
#define NOTIFY_CRITICAL 3
