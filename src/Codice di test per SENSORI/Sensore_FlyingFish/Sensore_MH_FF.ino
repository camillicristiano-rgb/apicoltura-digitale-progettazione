#include <NTC_Thermistor.h>

// --- CONFIGURAZIONE PIN ---
#define PIN_TEMP        2     // Sensore Temperatura (NTC)
#define PIN_FLYING_FISH 13    // Sensore Ostacoli (Flying Fish)

// --- CONFIGURAZIONE TERMISTORE ---
#define R_RIF           10000 // Resistenza 10k
#define R_NOM           10000 // Resistenza a 25 gradi
#define T_NOM           25    // Temp nominale
#define B_VAL           3950  // Beta value

// Creazione oggetto termistore
Thermistor* thermistor;

void setup() {
  // 1. Avvia la comunicazione seriale
  // IMPORTANTE: Ricorda questo numero (115200)
  Serial.begin(115200);

  // 2. Configura il sensore ostacoli
  pinMode(PIN_FLYING_FISH, INPUT);

  // 3. Configura il sensore temperatura
  thermistor = new NTC_Thermistor(PIN_TEMP, R_RIF, R_NOM, T_NOM, B_VAL);
  
  Serial.println("--- SISTEMA AVVIATO ---");
  Serial.println("Lettura dati in corso...");
  delay(1000);
}

void loop() {
  // --- LETTURA TEMPERATURA ---
  // Facciamo una media di 10 letture per stabilizzare il valore
  double sommaTemp = 0;
  for(int i=0; i<10; i++){
      sommaTemp += thermistor->readCelsius();
      delay(5);
  }
  double temperatura = sommaTemp / 10;

  // --- LETTURA OSTACOLO ---
  int ostacolo = digitalRead(PIN_FLYING_FISH);
  String statoOstacolo;
  
  // Il sensore Flying Fish dà LOW (0) quando vede un ostacolo
  if (ostacolo == LOW) {
    statoOstacolo = "⚠️ OSTACOLO RILEVATO!";
  } else {
    statoOstacolo = "Strada Libera";
  }

  // --- STAMPA SUL MONITOR SERIALE ---
  Serial.print("Temp: ");
  Serial.print(temperatura, 1); // 1 cifra decimale
  Serial.print(" °C  |  Sensore IR: ");
  Serial.println(statoOstacolo);

  delay(500); // Aggiorna ogni mezzo secondo
}
