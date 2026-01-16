#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// Configurazione WiFi
#define STASSID "Gruppo4Network"
#define STAPSK  "Networks"

// Configurazione RestDB
#define RESTDB_URL "https://clonedb1-7b36.restdb.io"
#define API_KEY "2e1c9e05dd157fa74d69bfeab6b520b7c1e58"

// Pin ESP32-CAM (se servono per altri sensori)
// GPIO 4 = Flash LED
// GPIO 33 = LED rosso interno

void setup() {
  Serial.begin(115200);
  delay(1000); // Attesa stabilizzazione seriale
  
  Serial.println("\n=== ESP32-CAM RestDB Test ===");
  Serial.println("Avvio connessione WiFi...");
  
  // Configurazione WiFi per ESP32
  WiFi.mode(WIFI_STA);
  WiFi.begin(STASSID, STAPSK);
  
  // Attesa connessione
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✓ WiFi connesso!");
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("  RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    // ===== INVIO DATI AL DATABASE =====
    inviaDataRestDB();
    
  } else {
    Serial.println("✗ Connessione WiFi fallita!");
    Serial.println("Verifica SSID e password, poi resetta ESP32");
  }
  
  Serial.println("\n=== Setup completato ===");
  Serial.println("Premi RESET per inviare nuovi dati");
}

void loop() {
  // Loop vuoto - tutto viene fatto in setup()
  // Premi il pulsante RESET sulla ESP32-CAM per ripetere l'invio
  delay(1000);
}

// ===== FUNZIONE INVIO DATI =====
void inviaDataRestDB() {
  Serial.println("\n--- Preparazione invio dati ---");
  
  WiFiClientSecure *client = new WiFiClientSecure;
  
  if(client) {
    // Per sviluppo - in produzione usa certificati!
    client->setInsecure();
    
    HTTPClient https;
    
    // Endpoint RestDB
    String endpoint = RESTDB_URL;
    endpoint += "/rest/rilevazioni"; // Cambia per altri endpoint
    
    Serial.print("[HTTPS] Connessione a: ");
    Serial.println(endpoint);
    
    if (https.begin(*client, endpoint)) {
      
      // Headers richiesti da RestDB
      https.addHeader("Content-Type", "application/json");
      https.addHeader("x-apikey", API_KEY);
      https.addHeader("cache-control", "no-cache");
      
      // Creazione JSON con ArduinoJson 6.x
      StaticJsonDocument<200> doc;
      
      // Inserisci i tuoi dati qui
      doc["weight"] = 1256;
      doc["humidity"] = 100;
      doc["temperature"] = 50;
      doc["sound_level"] = 999;
      
      // Serializza JSON in stringa
      String jsonOutput;
      serializeJson(doc, jsonOutput);
      
      Serial.println("\n[POST] Dati da inviare:");
      Serial.println(jsonOutput);
      Serial.println();
      
      // Invio POST
      Serial.print("[HTTP] Invio in corso");
      int httpCode = https.POST(jsonOutput);
      Serial.println(" ...fatto!");
      
      if (httpCode > 0) {
        Serial.printf("[HTTP] Codice risposta: %d ", httpCode);
        
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
          Serial.println("✓ SUCCESS");
          
          String payload = https.getString();
          Serial.println("\n--- Risposta del server ---");
          Serial.println(payload);
          Serial.println("---------------------------");
          
          // Parsing risposta JSON
          StaticJsonDocument<512> responseDoc;
          DeserializationError error = deserializeJson(responseDoc, payload);
          
          if (!error) {
            Serial.println("\n✓ JSON ricevuto e parsato correttamente!");
            
            // Mostra ID del record creato (se presente)
            if (responseDoc.containsKey("_id")) {
              const char* id = responseDoc["_id"];
              Serial.print("  Record ID: ");
              Serial.println(id);
            }
          } else {
            Serial.print("✗ Errore parsing JSON: ");
            Serial.println(error.c_str());
          }
          
        } else {
          Serial.println("✗ ERRORE");
        }
      } else {
        Serial.printf("\n✗ [HTTP] Errore connessione: %s\n", 
                      https.errorToString(httpCode).c_str());
      }
      
      https.end();
      
    } else {
      Serial.println("✗ [HTTPS] Impossibile iniziare connessione!");
    }
    
    delete client;
    
  } else {
    Serial.println("✗ Impossibile creare client sicuro!");
  }
}

/*
 * ===== COME USARE QUESTO CODICE =====
 * 
 * 1. Carica il codice su ESP32-CAM
 * 2. Apri Serial Monitor (115200 baud)
 * 3. Premi RESET su ESP32-CAM
 * 4. Vedrai l'invio singolo dei dati
 * 5. Per inviare di nuovo, premi ancora RESET
 * 
 * ===== ENDPOINT DISPONIBILI =====
 * Cambia riga 73 per usare altri endpoint:
 * 
 * "/rest/apiari"      - per apiari
 * "/rest/arnie"       - per arnie  
 * "/rest/sensori"     - per sensori
 * "/rest/rilevazioni" - per rilevazioni (attuale)
 * "/rest/notifiche"   - per notifiche
 * "/rest/tipi"        - per tipi
 * "/rest/utenti"      - per utenti
 * 
 * ===== VANTAGGI =====
 * ✓ Nessuno spreco di chiamate API (solo 1 invio per RESET)
 * ✓ Ideale per test e debug
 * ✓ Controllo manuale tramite pulsante RESET
 * ✓ Output serial dettagliato per debugging
 * 
 * ===== LIBRERIE NECESSARIE =====
 * - ArduinoJson (v6.x) - installabile da Library Manager
 * - ESP32 board support - da Board Manager
 */