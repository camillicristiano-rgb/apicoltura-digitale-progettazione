# SHT21 - HTU21

- VIN (Tensione di ingresso)
- GND (Massa)
- SCL (Segnale di clock I2C)
- SDA (Segnale dati I2C)

## Umidità Relativa

- Risoluzione: 0,04 %RH (a 12 bit) / 0,7 %RH (a 8 bit)
- Tolleranza accuratezza: tipica ±2 %RH; massima (vedere Figura 2)
- Ripetibilità: ±0,1 %RH
- Isteresi: ±1 %RH
- Non linearità: <0,1 %RH
- Tempo di risposta (\$\\tau\$ 63%): 8 s
- Intervallo operativo (esteso): da 0 a 100 %RH
- Deriva a lungo termine (Tipica): <0,25 %RH/anno

## Temperatura

- Risoluzione: 0,01 °C (a 14 bit) / 0,04 °C (a 12 bit)
- Tolleranza accuratezza: tipica ±0,3 °C; massima (vedere Figura 3)
- Ripetibilità: ±0,1 °C
- Intervallo operativo (esteso): da -40 a 125 °C
- Tempo di risposta (\$\\tau\$ 63%): da 5 a 30 s
- Deriva a lungo termine (Tipica): <0,02 °C/anno

## Libreria
[Adafruit HTU21D v1.1.2](https://github.com/adafruit/Adafruit_HTU21DF_Library)

## Codice

```cpp
#include <Wire.h>
#include "Adafruit_HTU21DF.h"

Adafruit_HTU21DF sht21 = Adafruit_HTU21DF();

// Pin per ESP32-CAM
#define I2C_SDA 15
#define I2C_SCL 14

// Dichiaro le variabili qui in alto (Globali)
// Così puoi leggerle da qualsiasi punto del programma (es. se aggiungerai il WiFi dopo)
float temperatura = 0.0;
float umidita = 0.0;

void setup() {
  Wire.begin(I2C_SDA, I2C_SCL);
  sht21.begin();
}

void loop() {
  temperatura = sht21.readTemperature();
  umidita = sht21.readHumidity();
  delay(2000);
}

```
| Pin SHT21 | Pin ESP32-CAM | Descrizione |
| :--- | :--- | :---: |
| VIN | 3V3 | Alimentazione |
| GND | GND | Massa |
| SCL | IO14 | Clock |
| SDA | IO15 | Dati |

![Alt Text](https://www.arduiner.com/wp-content/uploads/2014/06/3788-SHT21-Umidita-and-Temp-Sensore.jpg)