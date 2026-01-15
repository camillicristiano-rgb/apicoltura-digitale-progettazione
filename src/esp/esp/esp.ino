#include <Wire.h>
#include "Adafruit_HTU21DF.h" 

// --- PIN DEFINITIONS ---
#define PIN_MIC_DO 12     // Microfono
#define PIN_SDA 14        // SHT21 SDA
#define PIN_SCL 15        // SHT21 SCL

Adafruit_HTU21DF htu = Adafruit_HTU21DF();

void setup() {
  // Avvia la comunicazione seriale
  Serial.begin(115200);
  Serial.println("\n--- AVVIO TEST SERIALE ---");
  delay(1000);

  // 1. Configurazione Microfono
  pinMode(PIN_MIC_DO, INPUT);
  Serial.println("Microfono configurato su Pin 12");

  // 2. Avvio SHT21
  // Importante: Wire.begin(SDA, SCL) serve per dire all'ESP32 quali pin usare
  Wire.begin(PIN_SDA, PIN_SCL);
  
  if (!htu.begin()) {
    Serial.println("ERRORE: SHT21 non trovato! Controlla i cavi su 14 e 15.");
    while (1); // Blocca il codice se il sensore non c'è
  } else {
    Serial.println("SHT21 Connesso correttamente.");
  }
  
  Serial.println("--- INIZIO LETTURE ---");
}

void loop() {
  // --- LETTURA SHT21 ---
  float umidita = htu.readHumidity();
  float temp = htu.readTemperature();

  // --- LETTURA MICROFONO ---
  int mic_val = digitalRead(PIN_MIC_DO);
  String stato_rumore;
  
  if (mic_val == HIGH) {
    stato_rumore = "RUMORE !!!";
  } else {
    stato_rumore = "Silenzio...";
  }

  // --- STAMPA I DATI ---
  Serial.print("Temp: "); 
  Serial.print(temp); 
  Serial.print(" C  |  Umidita': "); 
  Serial.print(umidita);
  Serial.print(" %  |  Mic: ");
  Serial.println(stato_rumore);

  // Rallenta un po' per leggere bene (1 secondo)
  delay(1000);
}
