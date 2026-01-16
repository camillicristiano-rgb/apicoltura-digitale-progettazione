# KY-038

## PIN
- A0: Output Analogico
- G: Negativo
- +: Positivo
- D0: Non Utilizzato

## SPECIFICHE
- Modello: KY-038 (Small Sound Sensor)
- Tensione Operativa (VCC): 3.3V - 5.5V DC
- Chip Comparatore: LM393 (Doppio comparatore differenziale)
- Tipo Microfono: Condensatore Elettret (Omnidirezionale)
- Uscita Digitale: Segnale logico (0 o 1) regolabile tramite trimmer
- Uscita Analogica: Tensione variabile (segnale audio grezzo)
- Indicatori LED: 1x LED Alimentazione (Power), 1x LED Attivazione Uscita (L2)
- Distanza Rilevamento: Efficace fino a ~2-3 metri (per battiti/urla)
- Dimensioni: 32mm x 17mm x 15mm (circa)
- Diametro foro di montaggio: 3mm (Standard M3)

## LIBRERIA
N/A

## CODICE
```
const int micPin = 04; 
const int soglia = 200; //valore temporaneo

void setup() {
  pinMode(micPin, INPUT);
}

void loop() {
  int valoreSento = analogRead(micPin);

  if (valoreSento > soglia) {
    // Qui andrà l'azione (es. accendi LED)
  }

  delay(50);
}
```

![Alt Text](https://win.adrirobot.it/sensori/37_in_1/KY-037_KY-038-Microphone-sound-sensor-module/KY-038-pin.jpg)