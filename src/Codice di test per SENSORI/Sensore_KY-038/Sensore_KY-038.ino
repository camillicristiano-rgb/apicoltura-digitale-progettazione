const int micPin = 04;    // Pin analogico (GPIO 34)
const int soglia = 190;  // Regola questo valore in base alla sensibilità desiderata

void setup() {
  Serial.begin(115200);   // Velocità di comunicazione
  pinMode(micPin, INPUT);
}

void loop() {
  // Leggi il volume attuale (0 - 4095 per ESP32)
  int valoreSento = analogRead(micPin);

  // Stampa il valore numerico per il Serial Plotter
  Serial.print("Intensita:");
  Serial.print(valoreSento);

  // Se il rumore supera la soglia, stampa un avviso
  if (valoreSento > soglia) {
    Serial.print("\t !!! RUMORE RILEVATO !!!");
  }

  Serial.println(); // Va a capo per la prossima lettura

  delay(50); // Piccola pausa per leggere meglio i dati
}
