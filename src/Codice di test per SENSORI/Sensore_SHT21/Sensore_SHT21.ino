#include <Wire.h>
#include "Adafruit_HTU21DF.h"

Adafruit_HTU21DF sht21 = Adafruit_HTU21DF();

#define I2C_SDA 15
#define I2C_SCL 14

void setup() {

  Serial.begin(115200);
  Serial.println("Avvio Arnia (SDA=15, SCL=14)...");
  Wire.begin(I2C_SDA, I2C_SCL);
  if (!sht21.begin()) {
    Serial.println("ERRORE: Sensore non trovato!");
    Serial.println("Controlla che i cavetti facciano contatto bene.");
    while (1);
  }
  Serial.println("SHT21 OK! Lettura in corso...");
}
void loop() {
  float temperatura = sht21.readTemperature();
  float umidita = sht21.readHumidity();
  Serial.print("Umidità: ");
  Serial.print(hum);
  Serial.print(" % \t");
  Serial.print("Temperatura: ");
  Serial.print(temp);
  Serial.println(" C");
  delay(2000);
}
