#include <ArduinoJson.h>
#include <WiFi.h>
#include <WebServer.h>

#define LED_PIN 4   // LED flash ESP32-CAM

// ===== WIFI ROUTER (2.4 GHz) =====
const char* ssid = "Gruppo4Network";
const char* password = "Networks";

WebServer server(80);
bool statoLED = false;

// LED ON
void accendiLED() {
  digitalWrite(LED_PIN, HIGH);
  statoLED = true;
}

// LED OFF
void spegniLED() {
  digitalWrite(LED_PIN, LOW);
  statoLED = false;
}

// Pagina web
void handleRoot() {
  server.send(200, "text/html", R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ESP32-CAM</title>
<style>
body{background:#000;color:#fff;text-align:center;font-family:Arial}
button{font-size:20px;padding:12px;margin:10px;border:2px solid #fff;
background:transparent;color:#fff;border-radius:8px}
#status{margin-top:20px;font-size:18px}
</style>
<script>
async function on(){await fetch('/H')}
async function off(){await fetch('/L')}
setInterval(async ()=>{
  let s = await fetch('/STATO').then(r=>r.json());
  document.getElementById('status').innerHTML =
    'LED: ' + s.led + '<br>Pulsante: ' + s.button;
},500);
</script>
</head>
<body>
<h1>ESP32-CAM</h1>
<button onclick="on()">Accendi LED</button>
<button onclick="off()">Spegni LED</button>
<div id="status">Caricamento...</div>
</body>
</html>
)rawliteral");
}

// Endpoint
void handleH() { accendiLED(); server.send(200, "text/plain", "ON"); }
void handleL() { spegniLED(); server.send(200, "text/plain", "OFF"); }

void handleStato() {
  StaticJsonDocument<100> doc;
  doc["led"] = statoLED ? "on" : "off";
  doc["button"] = digitalRead(0) == LOW ? "pressed" : "released";
  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);

  pinMode(LED_PIN, OUTPUT);
  pinMode(0, INPUT_PULLUP);

  // ===== WIFI =====
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connessione al WiFi");

  int tentativi = 0;
  while (WiFi.status() != WL_CONNECTED && tentativi < 30) {
    delay(500);
    Serial.print(".");
    tentativi++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi CONNESSO!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.println("CIAO");
  } else {
    Serial.println("❌ NON connesso al WiFi");
    Serial.print("Status WiFi: ");
    Serial.println(WiFi.status());
  }

  server.on("/", handleRoot);
  server.on("/H", handleH);
  server.on("/L", handleL);
  server.on("/STATO", handleStato);

  server.begin();
  Serial.println("Server avviato");
}

void loop() {
  server.handleClient();
}
