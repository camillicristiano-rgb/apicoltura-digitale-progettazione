## **DOCUMENTAZIONE REQUISITI HARDWARE**

# [ESP32 CAM](TEST%20SENSORI/Esp32%20Cam/Documentazione%20Esp32%20Cam.md)

# [SHT21 - HTU21](TEST%20SENSORI/Sensore_SHT21/Documentazione%20Sensore%20SHT21.md)

# [DS18B20](TEST%20SENSORI/Sensore_DS18B20/Documentazione%20Sensore%20DS18B20.md)

# INMP441

## SPECIFICHE

- SCK: Clock dei dati seriali per l'interfaccia I2S.
- SD: Uscita dati seriali per l'interfaccia I2S; il pin va in alta impedenza (tri-state) quando non trasmette attivamente sul canale appropriato.
- WS: Selezione della parola dati seriali (Word Select) per l'interfaccia I2S.
- L/R: Selezione del canale Sinistro/Destro; se impostato su basso l'uscita è nel canale sinistro, se alto nel canale destro.
- GND: Massa (Ground) da collegare al PCB (Pin 5, 6 e 9).
- VDD: Alimentazione da 1,8 V a 3,3 V; deve essere disaccoppiato con un condensatore da 0,1 μF collegato specificamente al Pin 6.
- CHIPEN: Abilitazione del microfono; impostare su alto (VDD​) per abilitarlo o su basso (GND) per la modalità power-down.
- Direzionalità: Omnidirezionale.
- Sensibilità: -26 dBFS (tipica a 1 kHz, 94 dB SPL); intervallo garantito tra -29 e -23 dBFS.
- Rapporto Segnale-Rumore (SNR): 61 dBA (pesato A).
- Rumore Equivalente in Ingresso (EIN): 33 dBA SPL (pesato A).
- Gamma Dinamica: 87 dB (derivata da EIN e massimo ingresso acustico).
- Risposta in Frequenza: Da 60 Hz a 15 kHz (punti di roll-off a -3 dB).
- Distorsione Armonica Totale (THD): 3% a 105 dB SPL.
- Reiezione dell'Alimentazione (PSR): -75 dBFS (con onda quadra da 100 mVp-p a 217 Hz su VDD​ = 1,8 V).
- Massimo Ingresso Acustico: 120 dB SPL (picco).
- Rumore di Fondo (Noise Floor): -87 dBFS (pesato A, RMS).
- Tensione di Alimentazione (VDD​): Intervallo operativo reale tra 1,62 V e 3,63 V.
- Consumo di Corrente (Normal Mode): 1,4 mA a 1,8 V oppure 2,2 mA a 3,3 V.
- Consumo in Standby: 0,8 mA.
- Consumo in Power Down: Da 2 μA (a 1,8 V) a 4,5 μA (a 3,3 V).
- Caratteristiche Filtro Digitale: Ritardo di gruppo di 17,2/fS​ secondi; ripple in banda passante di ±0,04 dB; attenuazione in banda d'arresto di 60 dB.
- Livelli Logici Digitali: VIH​ (Alto) minimo 0,7×VDD​; VIL​ (Basso) massimo 0,25×VDD​.
- Specifiche di Temporizzazione (Timing):
- Frequenza SCK: Da 0,5 MHz a 3,2 MHz.
- Frequenza WS: Da 7,8 kHz a 50 kHz.
- Tempi minimi SCK High/Low (tSCH​,tSCL​): 50 ns.
- Periodo SCK (tSCP​): Minimo 312 ns.
- Setup WS (tWSS​): Minimo 0 ns; Hold WS (tWSH​): Minimo 20 ns.

Note Hardware: La linea SD dovrebbe avere una resistenza di pulldown da 100 k\$\\Omega\$ per scaricare la linea durante il tri-state.

![Alt Text](https://plexylab.com/web/image/product.image/1571/image_1024/inmp441-sensor-microfono-interfaz-i2s-mems-bajo-consumo-002)

# HW-038

- D5 Pin (Signal): Pin di segnale (uscita analogica).
- VCC (+5V): Polo positivo dell'alimentazione.
- GND (Ground): Polo negativo (massa).

## SPECIFICHE

- Tipo di Sensore: Analogico.
- Tensione di esercizio: DC 3V - 5V.
- Corrente di esercizio: Minore o uguale a 20mA (\$\\le\$ 20mA).
- Area di rilevamento: 40mm x 16mm.
- Temperatura operativa: Da 10°C a 30°C.
- Umidità operativa: Da 10% a 90% (senza condensa).
- Dimensioni del prodotto: 66mm x 20mm x 8mm (nota: una tabella indica una lunghezza di 60mm, l'altra specifica 66mm includendo probabilmente i pin).
- Peso: 3.5g.
- Processo di produzione: FR4 a doppia faccia con livellamento della saldatura ad aria calda (HASL / stagnatura).

![Alt Text](https://m.media-amazon.com/images/I/41ZlUsZMClL.jpg)

# HX711 (~40kg)

- Pin 1 (VSUP): Ingresso alimentazione regolatore (2,7 ~ 5,5V).
- Pin 2 (BASE): Uscita controllo regolatore (non collegato se non usato).
- Pin 3 (AVDD): Alimentazione analogica (2,6 ~ 5,5V).
- Pin 4 (VFB): Ingresso controllo regolatore (collegare a AGND se non usato).
- Pin 5 (AGND): Massa analogica.
- Pin 6 (VBG): Uscita bypass riferimento.
- Pin 7 (INA-): Ingresso negativo Canale A.
- Pin 8 (INA+): Ingresso positivo Canale A.
- Pin 9 (INB-): Ingresso negativo Canale B.
- Pin 10 (INB+): Ingresso positivo Canale B.
- Pin 11 (PD_SCK): Controllo spegnimento (attivo alto) e ingresso clock seriale.
- Pin 12 (DOUT): Uscita dati seriale.
- Pin 13 (XO): I/O cristallo (non collegato se non usato).
- Pin 14 (XI): Ingresso cristallo o clock esterno (0 = usa oscillatore interno).
- Pin 15 (RATE): Controllo frequenza dati (0: 10Hz; 1: 80Hz).
- Pin 16 (DVDD): Alimentazione digitale (2,6 ~ 5,5V).

## SPECIFICHE TECNICHE

- Intervallo ingresso differenziale: ±0.5(AVDD/GUADAGNO) V.
- Ingresso modo comune: Da AGND + 1,2V a AVDD - 1,3V.
- Frequenza dati in uscita: 10Hz o 80Hz con oscillatore interno.
- Codifica dati: Complemento a 2, da 800000 a 7FFFFF HEX.
- Tempo di assestamento: 400ms (a 10Hz) o 50ms (a 80Hz).
- Rumore in ingresso (Guadagno 128): 50 nV(rms) a 10Hz o 90 nV(rms) a 80Hz.
- Deriva termica dell'offset: ±6 nV/°C.
- Reiezione dei disturbi (PSRR/CMRR): 100 dB.
- Frequenza clock esterno: Da 1 MHz a 20 MHz.
- Consumo corrente normale: Analogica 1400 µA, Digitale 100 µA.
- Consumo corrente "Power down": Analogica 0,3 µA, Digitale 0,2 µA.

![Alt Text](https://m.media-amazon.com/images/I/61O-sYI2d0L._AC_UF894,1000_QL80_.jpg)