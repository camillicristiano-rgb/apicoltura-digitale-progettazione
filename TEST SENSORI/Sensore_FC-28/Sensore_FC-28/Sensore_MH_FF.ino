/*
 * Test Sensore IR "MH Flying Fish" (Evita Ostacoli)
 *
 * Logica:
 * Il sensore invia un segnale LOW (0) quando rileva un ostacolo.
 * Invia un segnale HIGH (1) quando non c'è nessun ostacolo.
 */

const int pinSensore = 2;  // Pin collegato all'uscita OUT del sensore
const int pinLed = 13;     // LED integrato su Arduino
int statoSensore = 0;      // Variabile per memorizzare lo stato

void setup() {
  pinMode(pinSensore, INPUT); // Imposta il pin del sensore come ingresso
  pinMode(pinLed, OUTPUT);    // Imposta il pin del LED come uscita
  
  Serial.begin(9600);         // Avvia la comunicazione seriale
  Serial.println("Test Sensore Avviato...");
}

void loop() {
  // Legge il valore dal sensore
  statoSensore = digitalRead(pinSensore);

  // Controllo logico (LOW = Ostacolo rilevato)
  if (statoSensore == LOW) {
    digitalWrite(pinLed, HIGH);  // Accende il LED
    Serial.println("OSTACOLO RILEVATO!"); 
  } 
  else {
    digitalWrite(pinLed, LOW);   // Spegne il LED
    Serial.println("Area libera...");
  }
  
  delay(200); // Piccola pausa per leggere meglio il monitor seriale
}
