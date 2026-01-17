#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// Configurazione WiFi
#define STASSID "Gruppo4Network"
#define STAPSK  "Networks"

// Configurazione RestDB - CLONE 5
#define RESTDB_URL "https://clonedb5dhsjjhhfudii-66f3.restdb.io"
#define API_KEY "28ade382b313db86d3cab6da35d50b0666f2f"
#define URLsensori"https://clonedb5dhsjjhhfudii-66f3.restdb.io/rest/sensori"

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32-CAM RestDB - GET Dati ===");
  Serial.println("Database: CLONE 5");
  Serial.println("Connessione WiFi...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(STASSID, STAPSK);
  
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
    
    // Lettura dati dal database
    leggiDati();
    
  } else {
    Serial.println("✗ Connessione WiFi fallita!");
  }
  
  Serial.println("\n=== Completato ===");
  Serial.println("Premi RESET per nuova lettura");
  
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
}

void loop() {
  delay(10000);
}

void leggiDati() {
  Serial.println("\n--- GET dati dal database ---");
  
  WiFiClientSecure *client = new WiFiClientSecure;
  
  if(client) {
    client->setInsecure();
    
    HTTPClient https;
    
    String endpoint = RESTDB_URL;
    
    // ===== SCEGLI LA TABELLA DA LEGGERE =====
    // Opzione 1: Leggi SENSORI (per sen_min e sen_max)
    endpoint += "/rest/sensori";
    
    // Opzione 2: Leggi RILEVAZIONI (per ril_dataOra timestamp)
    // endpoint += "/rest/rilevazioni";
    
    // Puoi anche filtrare o ordinare:
    // endpoint += "?max=10&sort=_created&dir=-1"; // ultimi 10 record
    
    Serial.print("[GET] ");
    Serial.println(endpoint);
    
    if (https.begin(*client, endpoint)) {
      
      https.addHeader("Content-Type", "application/json");
      https.addHeader("x-apikey", API_KEY);
      https.addHeader("cache-control", "no-cache");
      
      int httpCode = https.GET();
      
      if (httpCode > 0) {
        Serial.printf("[HTTP] Codice: %d ", httpCode);
        
        if (httpCode == HTTP_CODE_OK) {
          Serial.println("✓ SUCCESS");
          
          String payload = https.getString();
          
          // Mostra la risposta RAW del server
          Serial.println("\n--- RISPOSTA SERVER (RAW) ---");
          Serial.println(payload);
          Serial.println("-----------------------------\n");
          
          JsonDocument responseDoc;
          DeserializationError error = deserializeJson(responseDoc, payload);
          
          if (!error) {
            
            if (responseDoc.is<JsonArray>()) {
              JsonArray array = responseDoc.as<JsonArray>();
              
              Serial.println("╔════════════════════════════════════════════════╗");
              Serial.println("║              DATI DAL DATABASE                 ║");
              Serial.println("╠════════════════════════════════════════════════╣");
              
              if (array.size() == 0) {
                Serial.println("║ ⚠️  NESSUN DATO TROVATO NEL DATABASE!         ║");
                Serial.println("║                                               ║");
                Serial.println("║ Possibili motivi:                             ║");
                Serial.println("║ 1. La tabella è vuota                         ║");
                Serial.println("║ 2. Stai leggendo la tabella sbagliata         ║");
                Serial.println("║ 3. Devi prima inserire dati nel database      ║");
                Serial.println("╚════════════════════════════════════════════════╝");
              } else {
                int count = 0;
                for (JsonObject obj : array) {
                  count++;
                  
                  Serial.print("║ Record #");
                  Serial.println(count);
                  Serial.println("╟────────────────────────────────────────────────╢");
                  
                  // TABELLA SENSORI
                  if (!obj["sen_min"].isNull()) {
                    Serial.print("║ Soglia MIN:  ");
                    Serial.println(obj["sen_min"].as<float>(), 2);
                  }
                  
                  if (!obj["sen_max"].isNull()) {
                    Serial.print("║ Soglia MAX:  ");
                    Serial.println(obj["sen_max"].as<float>(), 2);
                  }
                  
                  // TABELLA RILEVAZIONI
                  if (!obj["ril_dataOra"].isNull()) {
                    Serial.print("║ Timestamp:   ");
                    Serial.println(obj["ril_dataOra"].as<const char*>());
                  }
                  
                  if (!obj["ril_dato"].isNull()) {
                    Serial.print("║ Dato:        ");
                    Serial.println(obj["ril_dato"].as<float>(), 2);
                  }
                  
                  // Timestamp automatico RestDB (presente in tutte le tabelle)
                  if (!obj["_created"].isNull()) {
                    Serial.print("║ Creato:      ");
                    Serial.println(obj["_created"].as<const char*>());
                  }
                  
                  Serial.println("╚════════════════════════════════════════════════╝");
                  Serial.println();
                  
                  // Limita a primi 5 per non riempire il serial
                  if (count >= 5) {
                    Serial.println("(mostrati primi 5 record...)");
                    break;
                  }
                }
                
                Serial.print("Totale record trovati: ");
                Serial.println(array.size());
              }
              
            } else if (responseDoc.is<JsonObject>()) {
              // Singolo record
              Serial.println("╔════════════════════════════════════════════════╗");
              Serial.println("║              SINGOLO RECORD                    ║");
              Serial.println("╠════════════════════════════════════════════════╣");
              
              if (!responseDoc["sen_min"].isNull()) {
                Serial.print("║ Soglia MIN:  ");
                Serial.println(responseDoc["sen_min"].as<float>(), 2);
              }
              
              if (!responseDoc["sen_max"].isNull()) {
                Serial.print("║ Soglia MAX:  ");
                Serial.println(responseDoc["sen_max"].as<float>(), 2);
              }
              
              if (!responseDoc["ril_dataOra"].isNull()) {
                Serial.print("║ Timestamp:   ");
                Serial.println(responseDoc["ril_dataOra"].as<const char*>());
              }
              
              if (!responseDoc["ril_dato"].isNull()) {
                Serial.print("║ Dato:        ");
                Serial.println(responseDoc["ril_dato"].as<float>(), 2);
              }
              
              if (!responseDoc["_created"].isNull()) {
                Serial.print("║ Creato:      ");
                Serial.println(responseDoc["_created"].as<const char*>());
              }
              
              Serial.println("╚════════════════════════════════════════════════╝");
            }
            
          } else {
            Serial.print("✗ Errore parsing JSON: ");
            Serial.println(error.c_str());
          }
          
        } else {
          Serial.println("✗ ERRORE");
          String errorPayload = https.getString();
          if (errorPayload.length() > 0) {
            Serial.println("\n--- Dettagli errore ---");
            Serial.println(errorPayload);
            Serial.println("-----------------------");
          }
        }
      } else {
        Serial.printf("\n✗ Errore connessione: %s\n", https.errorToString(httpCode).c_str());
      }
      
      https.end();
      
    } else {
      Serial.println("✗ HTTPS begin fallito!");
    }
    
    delete client;
    
  } else {
    Serial.println("✗ Impossibile creare client!");
  }
}

/*
 * ╔═══════════════════════════════════════════════════════════╗
 * ║           CODICE CORRETTO - DATABASE CLONE 5             ║
 * ╚═══════════════════════════════════════════════════════════╝
 * 
 * PROBLEMA RISOLTO:
 * ✓ La tabella SENSORI era vuota (0 record)
 * ✓ Aggiunto supporto per ril_dataOra (timestamp RILEVAZIONI)
 * ✓ Mostra risposta RAW per debug
 * ✓ Avvisa se database vuoto
 * 
 * ═══════════════════════════════════════════════════════════
 * TABELLE DISPONIBILI:
 * ═══════════════════════════════════════════════════════════
 * 
 * SENSORI (/rest/sensori):
 *   - sen_min (soglia minima)
 *   - sen_max (soglia massima)
 *   - sen_stato (attivo/non attivo)
 * 
 * RILEVAZIONI (/rest/rilevazioni):
 *   - ril_dato (valore misurato)
 *   - ril_dataOra (timestamp) ← QUESTO!
 * 
 * Tutte le tabelle hanno anche:
 *   - _created (timestamp creazione automatico RestDB)
 *   - _changed (timestamp ultima modifica)
 * 
 * ═══════════════════════════════════════════════════════════
 * COME USARE:
 * ═══════════════════════════════════════════════════════════
 * 
 * 1. Cambia la riga 52 per scegliere la tabella:
 *    endpoint += "/rest/sensori";      ← soglie min/max
 *    endpoint += "/rest/rilevazioni";  ← dati + timestamp
 * 
 * 2. Se il database è vuoto, devi prima inserire dati
 *    usando il POST o manualmente da RestDB.io
 * 
 * 3. Il codice mostra la risposta RAW per capire
 *    esattamente cosa c'è nel database
 * 
 * ═══════════════════════════════════════════════════════════
 * OUTPUT:
 * ═══════════════════════════════════════════════════════════
 * Vedrai:
 * - La risposta completa del server (JSON)
 * - Dati formattati con sen_min, sen_max, ril_dataOra
 * - Avviso se database vuoto
 */
