
## 1. Introduzione al progetto

### Scopo del progetto:
Lo scopo del progetto Apicoltura Digitale è la progettazione e realizzazione di un sistema IoT per il monitoraggio delle arnie dei apiari. Il sistema ha l’obiettivo di raccogliere dati significativi sullo stato dell’arnia e renderli disponibili in modo semplice e accessibile, così da supportare il controllo, l’analisi e la gestione dell’attività di apicoltura attraverso strumenti digitali.

### Descrizione del sistema:
Il sistema è composto da un dispositivo IoT installato sull’arnia, da un server centrale e da un’interfaccia web per l’utente finale. I dati acquisiti dal dispositivo vengono inviati a un server REST, memorizzati in un database e successivamente visualizzati tramite una web app accessibile da smartphone. Il sistema consente inoltre la configurazione di alcuni parametri di funzionamento direttamente dall’interfaccia web.

### Ambito di utilizzo:
Il progetto è sviluppato come prototipo didattico, realizzato nell’ambito di un project work scolastico. Pur avendo finalità di studio e sperimentazione, l’architettura del sistema è progettata in modo modulare e scalabile, così da poter essere estesa o adattata in futuro a un contesto reale di possibile utilizzo produttivo.

### Target:
Il progetto è rivolto principalmente a:
- Sviluppatori, interessati alla realizzazione di sistemi IoT e applicazioni web.
- Manutentori, incaricati della gestione, del controllo del sistema nel tempo.
- Studenti e docenti, come strumento didattico per l’apprendimento di tecnologie IoT e programmazione.
- Apicoltori che vogliono controllare la loro produzione da distanza e in modo intelligente.

---

## 2. Panoramica dell’architettura del sistema



### Vista generale del sistema
L’architettura del sistema Apicoltura Digitale è basata su una struttura distribuita composta da: acquisizione dei dati, gestione centrale e interfaccia utente. Il livello di acquisizione è rappresentato dal dispositivo IoT installato sull’arnia, che raccoglie i dati ambientali e di stato. Il livello centrale comprende il server e il database, responsabili della ricezione, dell’elaborazione e della memorizzazione delle informazioni. Il livello di presentazione consente all’utente di consultare i dati e configurare il sistema tramite una web app mobile.

### Ruolo dell’ESP nel sistema
Il microcontrollore ESP32 CAM rappresenta il nodo principale del sistema IoT. Il suo ruolo è quello di coordinare la lettura dei sensori collegati, gestire la raccolta dei dati e inviarli periodicamente al server centrale tramite la rete. L’ESP funge quindi da punto di collegamento tra l’ambiente fisico dell’arnia e l’infrastruttura software del sistema.

### Relazioni tra ESP e sensori
I sensori sono collegati direttamente all’ESP e consentono la rilevazione di parametri ambientali dell’arnia, come temperatura, umidità, peso e altri dati. L’ESP si occupa della gestione dei sensori, della sincronizzazione delle letture e della preparazione dei dati per la trasmissione verso il server. Questa relazione permette di ottenere una raccolta dati continua e strutturata.

### Eventuali attuatori, alimentazione, comunicazione esterna
L’alimentazione del dispositivo IoT è progettata per garantire il funzionamento continuo del sistema, grazie a pannelli solari e accumulatori, tenendo conto delle condizioni operative tipiche di un’arnia. La comunicazione esterna avviene tramite rete wireless, consentendo all’ESP di inviare i dati al server remoto in modo affidabile e di ricevere eventuali configurazioni o comandi.

### Microcontrollore:
* Esp32 Cam

### Sensori:
* Sonda Temperatura (DS18B20)
* Sensore Bilancia Peso (HX711)
* Microfono Rumore (KY-038)
* Sensore Temperatura e umidità (SHT21 - HTU21)
* Sensore umidità (FC-28)
* Sensore livello Acqua (HW-038)

### Comunicazione:
* Wifi

---

## 3. Requisiti di sistema

I seguenti requisiti di sistema derivano dall’integrazione dei requisiti hardware e funzionali definiti per il dispositivo ESP32-CAM e i sensori associati. Essi descrivono il comportamento complessivo del sistema.

### 3.1 Requisiti funzionali di sistema
* **RS-F-01 Acquisizione coordinata dei dati:** Il sistema deve acquisire i dati provenienti da tutti i sensori installati in modo coordinato.
* **RS-F-02 Aggregazione ed elaborazione locale:** Il sistema deve essere in grado di effettuare una prima elaborazione locale dei dati prima dell’invio al server, riducendo il volume di dati trasmessi.
* **RS-F-03 Trasmissione periodica e su evento:** Il sistema deve inviare i dati al server remoto sia a intervalli temporali configurabili sia in risposta a eventi significativi rilevati durante il monitoraggio.
* **RS-F-04 Sincronizzazione temporale:** Il sistema deve associare a ogni misura un riferimento temporale affidabile, in modo da consentire l’analisi storica e il confronto dei dati nel tempo.
* **RS-F-05 Monitoraggio continuo in condizioni operative reali:** Il sistema deve garantire il funzionamento continuo durante l’attività normale dell’arnia, senza richiedere interventi frequenti da parte dell’utente.

### 3.2 Requisiti non funzionali di sistema
* **RS-NF-01 Consumi energetici:** Il consumo energetico complessivo del sistema deve essere compatibile con un funzionamento prolungato in ambiente esterno, limitando l’assorbimento medio e utilizzando modalità di risparmio energetico quando possibile.
* **RS-NF-02 Latenza di acquisizione e invio:** Il sistema deve completare un ciclo completo di acquisizione, elaborazione e trasmissione dei dati entro un tempo massimo definito, compatibile con il monitoraggio quasi in tempo reale dell’arnia.
* **RS-NF-03 Affidabilità operativa:** Il sistema deve essere in grado di continuare a funzionare correttamente anche in presenza di condizioni ambientali avverse o temporanee interruzioni di comunicazione, evitando la perdita critica dei dati.
* **RS-NF-04 Robustezza ambientale complessiva:** L’integrazione dei componenti hardware deve garantire che il sistema, nel suo insieme, mantenga le prestazioni previste anche in presenza di umidità, polvere, escursioni termiche e agenti chimici.

### 3.3 Vincoli hardware di sistema
* **RS-VH-01 Integrazione fisica compatta:** Tutti i componenti hardware devono essere integrati in modo compatto e ordinato, rispettando i vincoli dimensionali dell’arnia e senza ostacolare le normali attività della colonia.
* **RS-VH-02 Alimentazione centralizzata:** Il sistema deve utilizzare una soluzione di alimentazione unica e centralizzata per il dispositivo ESP32-CAM e i sensori collegati, garantendo stabilità e sicurezza elettrica.
* **RS-VH-03 Compatibilità elettromeccanica:** I componenti del sistema non devono generare vibrazioni, rumori o campi che possano interferire con il comportamento naturale delle api.

---

## 4. Descrizione hardware dettagliata

### 4.1 ESP:

**Modello**
Modulo ESP32-CAM.

**Caratteristiche rilevanti per il progetto**
* **Connettività Duale:** Wi-Fi (802.11b/g/n) per la trasmissione dati al server e Bluetooth 4.2.
* **Storage Locale:** Slot per scheda MicroSD (supporto fino a 4GB) per il data-logging locale.
* **Interfacce di I/O:** 9 porte IO disponibili con supporto a protocolli standard (UART, SPI, I2C, ADC) per la lettura dei sensori.
* **Potenza di calcolo:** CPU con clock fino a 160 MHz e 4 MB di PSRAM esterna per gestire buffer dati e stack di rete (Lwip/FreeRTOS).
* **Consumi:** Supporto a modalità Deep-sleep (minimo 6mA) per efficienza energetica nei momenti di inattività.

**Perché è stato scelto**
L'ESP32-CAM è stato identificato come il componente critico per il progetto poiché soddisfa pienamente i criteri di accettazione "ibridi" in un unico dispositivo compatto.
* **Gestione Dati:** Permette di accentrare la raccolta dati dai sensori distribuiti tramite i pin GPIO.
* **Continuità Operativa:** La combinazione di Wi-Fi e slot MicroSD è fondamentale per la logica di sicurezza richiesta: invio immediato al server in condizioni normali e salvataggio locale (backup) su scheda SD in caso di assenza di corrente o connessione Internet, garantendo il successivo recupero dei log senza perdita di informazioni.

### 4.2 Sensori:

#### 4.2.1 Sensore Temperatura (DS18B20)
* **Funzione:** Monitoraggio della temperatura interna, Il form factor a sonda impermeabile permette l'inserimento diretto tra i telaini per rilevare la salute della covata (target ~35°C) senza temere l'umidità o la propoli.
* **Interfaccia:** 1-Wire. Richiede un singolo GPIO digitale per la comunicazione bidirezionale.
* **Parametri rilevanti:**
    * Accuratezza: ±0,5°C (nel range critico -10°C / +85°C), sufficiente per rilevare anomalie della regina.
    * Alimentazione: 3.0V ~ 5.5V (compatibile con la logica 3.3V dell'ESP32).
    * Tempo di conversione: Max 750 ms (da considerare nel firmware per non bloccare il loop).
    * Fisica: Sonda Inox impermeabile, cavo da 1m.
* **Dipendenze elettriche:** Necessita di una resistenza di pull-up (tipicamente 4.7kΩ) collegata tra il pin Dati (Giallo) e VCC (Rosso) per stabilizzare il segnale digitale.

#### 4.2.2 Sensore Peso (HX711)
* **Funzione:** Amplificatore e convertitore analogico-digitale (ADC) a 24 bit progettato specificamente per bilance. Interfaccia le celle di carico (i sensori fisici posti sotto l'arnia) al microcontrollore. Permette di monitorare la produzione di miele (aumento peso), il consumo delle scorte invernali e rilevare sciamature (calo improvviso di peso).
* **Interfaccia:** Proprietaria (Serial 2-Wire). Simile a SPI ma non standard. Richiede due GPIO digitali: DT (Data) e SCK (Clock).
* **Parametri rilevanti:**
    * Risoluzione: 24-bit (Alta precisione: fondamentale per rilevare variazioni di pochi grammi su un peso totale che può superare i 50-80 kg).
    * Guadagno (Gain): Selezionabile (tipicamente impostato a 128 per il Canale A).
    * Data Rate: Selezionabile tra 10 Hz (consigliato per stabilità e reiezione disturbi) e 80Hz.
    * Alimentazione: 2.6V ~ 5.5V.
* **Dipendenze elettriche:**
    * Richiede il collegamento fisico alle celle di carico (solitamente 4 celle da 50 kg l'una.
    * Molto sensibile ai disturbi elettromagnetici: mantenere i cavi tra celle e HX711 i più corti possibile.

#### 4.2.3 Sensore Sonoro (KY-038)
* **Funzione:** Ascolta il ronzio dell'alveare. Serve a capire l'intensità dell'attività (es. ronzio forte = agitazione o ventilazione attiva; silenzio = problema).
* **Interfaccia:** ADC (Analogico). Analogica (ADC). Si usa solo il pin A0 collegato a un ingresso dell'ESP32. L'uscita digitale (D0) non serve per questo scopo.
* **Parametri rilevanti:**
    * Sensibilità Regolabile: Presenza di un trimmer (potenziometro) per calibrare il guadagno del microfono in base al rumore di fondo dell'alveare.
    * Tensione Operativa: 3.3V - 5V. Operando a 3.3V è direttamente compatibile con i livelli logici dell'ESP32-CAM.
* **Dipendenze elettriche:**
    * Necessita di un'alimentazione stabile: eventuali fluttuazioni di tensione si riflettono direttamente sulla lettura analogica (rumore elettrico).
    * Richiede il posizionamento lontano da fonti di vibrazione meccanica (es. ventole o motori) che potrebbero falsare i dati acustici.

#### 4.2.4 Sensore Umidità e Temperatura (SHT21 / HTU21)
* **Funzione:** Monitoraggio dell'umidità relativa interna e della temperatura ambientale dell'arnia. L'umidità è un parametro vitale: un eccesso può favorire la proliferazione di funghi e malattie (come la covata calcina), mentre un'umidità troppo bassa può danneggiare le larve.
* **Interfaccia:** I2C. Usa due pin per comunicare: SDA (Dati) e SCL (Clock).
* **Parametri rilevanti:**
    * Precisione: ±2% sull'Umidità (molto alta).
    * Tempo di risposta: Rapido (8-30 secondi).
* **Dipendenze elettriche:** Alimentazione: Funziona nativamente a 3.3V, rendendolo perfetto per il collegamento diretto all'ESP32-CAM senza regolatori di tensione aggiuntivi.

#### 4.2.5 Sensore Umidità Suolo (FC-28)
* **Funzione:** Misura la conducibilità volumetrica dell'acqua. In un contesto di apicoltura, viene utilizzato per due scopi principali:
    * Monitoraggio esterno: Inserito nel terreno sotto l'arnia per valutare l'umidità del suolo (utile per capire la fioritura o il ristagno idrico).
    * Monitoraggio interno (Fondo): Posizionato sul fondo dell'arnia per rilevare accumuli di condensa o infiltrazioni d'acqua gravi (funzionamento simile all'HW-038).
* **Interfaccia:** Analogica (AO) e/o Digitale (DO).
    * AO (Analog Output): Collegato a un pin ADC dell'ESP32 (es. GPIO 32-39). Fornisce un valore preciso (più acqua = resistenza più bassa = valore più basso/alto a seconda della logica).
    * DO (Digital Output): Fornisce un segnale 0/1 basato su una soglia regolabile tramite trimmer (meno utile per analisi dati).
* **Parametri Rilevanti:**
    * Chip Comparatore: LM393 (per l'uscita digitale).
    * Tensione di alimentazione: 3.3V ~ 5V.
    * Principio: Resistivo
    * Vita operativa: Limitata dalla corrosione se alimentato costantemente.
* **Dipendenze elettriche:**
    * Problema Corrosione (Elettrolisi): Essendo un sensore resistivo, se lasciato sempre alimentato a VCC,
    * Soluzione Circuitale: Non collegare VCC direttamente ai 3.3V fissi. Collegare VCC a un GPIO digitale dell'ESP32. Il software dovrà accendere il pin solo per i 100ms necessari alla lettura e poi spegnerlo immediatamente.

#### 4.2.6 Sensore Acqua (HW-038)
* **Funzione:** Il modulo è progettato per il monitoraggio in tempo reale del livello dell’acqua nel contenitore di abbeveraggio delle api. Utilizza una serie di piste conduttive esposte (processo FR4 HASL) che variano la loro resistenza elettrica in base alla quantità di liquido che le sommerge. Questo permette al sistema di rilevare se il secchio è pieno, se l'acqua sta evaporando o se è vuoto, attivando le notifiche necessarie per l'apicoltore.
* **Interfaccia:** Analogica. Il pin di segnale ("S" o Signal) fornisce una tensione variabile proporzionale al livello dell'acqua rilevato, che viene letta tramite un ingresso ADC del microcontrollore. Non richiede librerie.
* **Parametri rilevanti:**
    * Tensione di esercizio: DC 3.0V – 5.0V (Compatibile con logica ESP32).
    * Corrente di esercizio: 20mA.
    * Area di rilevamento: 40mm x 16mm (Zona utile per la misura).
    * Dimensioni totali: 66mm x 20mm x 8mm.
    * Condizioni operative: Temperatura 10°C-30°C, Umidità 10%-90% (senza condensa).
    * Criteri di accettazione: Fornitura di un segnale stabile e interpretabile che permetta di distinguere tra presenza e assenza di acqua.
* **Dipendenze elettriche:**
    * Richiede un collegamento a 3 fili e un'alimentazione stabile per letture precise.
    * Signal (S): Collegato a un pin ADC (GPIO) del microcontrollore.
    * VCC (+): Polo positivo (3.3V o 5V). Nota di progetto: Pilotabile tramite GPIO digitale per prevenire l'ossidazione.
    * GND (-): Polo negativo (Massa comune).

---

## 5. Integrazione hardware



### ESP32-CAM

**Lato Sinistro (dall'alto in basso)**
* 5V: Ingresso alimentazione (richiede 5V stabilizzati).
* GND: Massa comune.
* GPIO 12: Pin Libero (usabile per sensori).
* GPIO 13: Pin Libero (usabile per sensori).
* GPIO 15: Pin Comando SD.
* GPIO 14: Pin Clock SD.
* GPIO 2: Pin Dati 0 SD.
* GPIO 4: Pin Dati 1 SD / Flash LED.

**Lato Destro (dall'alto in basso)**
* 3.3V: Uscita 3.3V (per alimentare sensori).
* GPIO 16: Pin Libero.
* GPIO 0: Pin Boot.
* GND: Massa comune.
* VCC: Uscita alimentazione.
* GPIO 3 (RX) & GPIO 1 (TX): Seriali per il PC.

### DS18B20 (Sonda di Temperatura)
* Dati (Cavo Giallo): Canale dati digitali (Protocollo 1-Wire).
* VCC (Cavo Rosso): Alimentazione Positiva (3.0V ~ 5.5V).
* GND (Cavo Nero): Massa / Negativo.

### HW-038 (Sensore Livello Acqua)
* Signal (o D5 Pin): Pin di Segnale (Uscita Analogica). Più l'acqua copre il sensore, più cambia il valore letto.
* VCC: Alimentazione Positiva (+5V o 3V).
* GND: Massa / Negativo.

### KY-038 (Sensore Suono / Microfono)
* A0: Uscita Analogica. Fornisce il segnale audio grezzo (tensione variabile in base al volume istantaneo).
* Gnd: Massa / Negativo (GND).
* +: Alimentazione Positiva (3.3V - 5.5V).
* D0: Uscita Digitale.

### SHT21 / HTU21 (Sensore Temperatura e Umidità)
* VIN: Tensione di ingresso (Alimentazione).
* GND: Massa (Ground).
* SCL: Segnale di Clock per interfaccia I2C.
* SDA: Segnale Dati per interfaccia I2C.

### HX711 (Amplificatore per Celle di Carico / Bilance)
* GND: Massa / Negativo.
* DT (Data): Uscita Dati seriale (spesso indicata come DOUT). Invia la lettura del peso al microcontrollore.
* SCK (Clock): Ingresso di Clock (spesso indicato come PD_SCK).
* VCC: Alimentazione Positiva (2.6V ~ 5.5V).

### FC-28 (Sensore Livello Acqua)
* A0: Output Analogico (Segnale variabile in base all'umidità).
* D0: Output Digitale (Segnale logico 0/1 quando l'umidità supera la soglia impostata).
* GND: Massa / Negativo.
* VCC: Alimentazione Positiva (3.3V ~ 5V).

---

## 6. Alimentazione e consumi

Questa sezione analizza il budget energetico del sistema.

1.  **Il Voltaggio (Tensione):** La "pressione" elettrica necessaria per far funzionare i componenti.
2.  **L'Assorbimento (Corrente):** Quanta energia viene consumata nelle varie fasi.

### 6.1 Schema di alimentazione
Il sistema utilizza una logica a doppia tensione. Immaginala come una strada principale a scorrimento veloce (5V) e una strada locale più delicata (3.3V).

**1. L'Ingresso Principale: 5V DC**
Questa è l'energia che entra nel sistema dalla tua fonte di alimentazione (batteria o alimentatore).
* Dove collegare: Ai pin 5V e GND dell'ESP32-CAM.
* Requisiti: Hai bisogno di una fonte stabile che possa fornire almeno 500mA.

**2. La Regolazione Interna (On-board)**
Una volta che i 5V entrano nell'ESP32-CAM, un piccolo chip sulla scheda (regolatore LDO) li trasforma automaticamente in 3.3V. Questa è la tensione che serve al processore ESP32 e alla fotocamera per non bruciarsi.

**3. Il Bus dei Sensori: 3.3V DC**
Tutti i tuoi sensori (temperatura, peso, umidità) devono essere collegati qui.
* Dove collegare: Preleva l'energia dal pin 3.3V o VCC dell'ESP32 (che è un'uscita).
* Perché non usare i 5V? Perché l'ESP32 "parla" a 3.3V. Se si alimentasse un sensore a 5V e questo inviasse un segnale di ritorno a 5V, si potrebbero danneggiare i pin di lettura dell'ESP32. Usare 3.3V ovunque mantiene tutti i livelli logici sicuri e uniformi.

### 6.2 Consumi stimati
Ecco quanto consuma nelle diverse situazioni:

* **Picco Massimo (~310 mA):**
    * Situazione Critica: Il sistema scatta una foto al buio (Flash LED acceso) e trasmette via Wi-Fi contemporaneamente.
* **Lavoro Standard (~180 mA):**
    * Routine: Il sistema legge i sensori (peso, temperatura) e invia i numeri al server. Il Wi-Fi è acceso, ma il Flash è spento.
* **Modem-sleep (~20 mA):**
    * La CPU è sveglia, ma il Wi-Fi è spento. Consuma ancora troppo per una batteria.
* **Deep-sleep (~6 mA):**
    * Riposo Totale: Questa è la modalità più importante. Il processore è quasi spento, rimane attivo solo un timer interno per svegliarlo.

---

## 7. Casi d’uso

### Sensore DS18B20:
Il sensore DS18B20 è utilizzato per il monitoraggio della temperatura interna dell’arnia. La temperatura rappresenta un indicatore fondamentale dello stato di salute della colonia, della presenza della covata e di situazioni critiche come fame, sciamatura o collasso della famiglia.
* Il sistema rileva una temperatura stabile compresa tra 34 °C e 36 °C. Questa condizione viene interpretata come presenza di covata attiva e colonia in buono stato. Il dato viene inviato al server come stato normale e archiviato nello storico senza generare notifiche.
* Il sistema rileva temperature comprese tra 15°C e 25°C durante il periodo invernale. Il sistema interpreta il dato come formazione del glomere e presenza di una colonia viva. Il valore viene salvato per analisi stagionali.
* Il sistema rileva una temperatura inferiore ai 10°C per un periodo prolungato. Il sistema genera un allarme indicando un possibile stato di fame o collasso della colonia e invia una notifica all’utente.
* Il sistema rileva un innalzamento rapido della temperatura oltre i 37 °C. Il dato viene correlato con altri parametri e segnalato come possibile evento di sciamatura imminente.
* Il sistema rileva una temperatura interna identica a quella esterna per oltre 24 ore. Il sistema segnala una probabile perdita della colonia e registra l’evento come critico.

### Sensore di umidità HTU21D:
Il sensore HTU21D è utilizzato per il monitoraggio dell’umidità relativa all’interno dell’arnia. L’umidità è un parametro fondamentale per valutare la maturazione del miele, la corretta ventilazione dell’arnia e la presenza di condizioni critiche come condensa, allagamenti o blocchi del sensore dovuti alla propoli.
* Il sistema rileva valori di umidità compresi indicativamente tra il 55% e il 70%. Questa condizione viene interpretata come normale funzionamento dell’arnia. Il dato viene inviato al server e memorizzato nello storico per l’analisi dell’andamento del miele, senza generare notifiche.
* Il sistema rileva una discesa graduale dell’umidità al di sotto del 60%. Il sistema interpreta il dato come corretta maturazione del miele. Viene inviata una notifica informativa all’utente.
* Il sistema rileva un aumento improvviso e marcato dell’umidità, superiore all’85%. Questa condizione viene interpretata come possibile inizio di una sciamatura.
* Il sistema rileva valori di umidità costantemente superiori al 90% per un periodo prolungato. Il sistema segnala una condizione di rischio legata alla formazione di condensa all’interno dell’arnia. Viene inviata una notifica di attenzione all’utente.
* Il sistema rileva un valore di umidità fisso e non variabile nel tempo. Il sistema interpreta il dato come possibile blocco del sensore dovuto alla propoli. Viene inviata una notifica di manutenzione.
* Il sistema rileva una saturazione improvvisa dell’umidità al 100%. Il sistema segnala una condizione critica di possibile allagamento o infiltrazione. Viene generato un allarme critico e notificato l’utente.

### Sensore di peso HX711:
Il sensore di peso basato su HX711 è utilizzato per il monitoraggio del peso complessivo dell’arnia. La variazione di peso consente di stimare la produzione di miele, il consumo delle scorte, eventi di sciamatura e situazioni.
* Il sistema rileva un aumento costante del peso durante le ore diurne. Questa condizione viene interpretata come raccolta attiva di nettare. Il sistema invia al server un report di produzione.
* Il sistema rileva che il peso totale dell’arnia ha raggiunto una soglia predefinita.
* Il sistema rileva una diminuzione lenta e costante del peso durante il periodo invernale. Il dato viene interpretato come consumo regolare delle scorte. Il sistema aggiorna lo storico per il calcolo delle riserve disponibili.
* Il sistema rileva che il peso dell’arnia è sceso sotto una soglia critica di sicurezza. Il sistema genera un allarme critico indicando esaurimento delle scorte.
* Il sistema rileva un calo improvviso e significativo del peso in un breve intervallo di tempo.
* Il sistema rileva una variazione di peso istantanea o instabile.
* Il sistema rileva dati fuori scala o assenza di comunicazione dal sensore.

### Sensore acustico KY-038:
Il sensore acustico KY-038 è utilizzato per il monitoraggio dell’attività sonora e vibratoria all’interno e in prossimità dell’arnia. L’analisi delle frequenze consente di identificare stati comportamentali della colonia e eventi di disturbo o pericolo.
* Il sistema rileva un livello sonoro minimo con frequenze comprese tra 100 Hz e 180 Hz. Il sistema interpreta il dato come stato di riposo.
* Il sistema rileva frequenze comprese tra 190 Hz e 250 Hz. Il sistema interpreta il dato come normale attività della colonia.
* Il sistema rileva un’attività sonora costante tra 250 Hz e 350 Hz. Il sistema interpreta il dato come intensa attività di ventilazione o deumidificazione del miele.
* Il sistema rileva frequenze elevate e persistenti tra 350 Hz e 550 Hz. Il sistema segnala una possibile sciamatura imminente.
* Il sistema rileva un picco improvviso superiore a 1000 Hz. Il sistema interpreta l’evento come possibile urto o manomissione.
* Il sistema rileva frequenze irregolari e elevate tra 600 Hz e 800 Hz. Il sistema segnala uno stato di forte agitazione della colonia.
* Il sistema rileva assenza di vibrazioni sonore per un periodo prolungato. Il sistema segnala una possibile anomalia tecnica o la perdita della colonia. Viene inviato un allarme.

### Sensore livello acqua HW-038:
Il sensore HW-038 è utilizzato per il monitoraggio del livello dell’acqua disponibile per la colonia. L’acqua è essenziale per la termoregolazione dell’arnia, soprattutto nei periodi caldi.
* Il sistema rileva la presenza di conducibilità nel sensore. Il sistema interpreta il dato come livello d’acqua adeguato. Il dato viene registrato come stato normale.
* Il sistema rileva assenza di conducibilità. Il sistema segnala che l’acqua è terminata. Viene inviata una notifica informativa all’utente.
* Il sistema rileva una variazione graduale del valore analogico. Il sistema interpreta il dato come consumo progressivo dell’acqua. Il dato viene salvato per analisi dei consumi.
* Il sistema rileva valori instabili o incoerenti. Il sistema segnala una condizione di possibile ossidazione del sensore. Viene inviata una notifica di manutenzione.

### Modulo ESP32-CAM
Il modulo ESP32-CAM rappresenta l’unità centrale di controllo e comunicazione del sistema. Coordina i sensori, gestisce la comunicazione con il server e fornisce funzionalità di monitoraggio visivo.
* L’utente richiede un’acquisizione visiva tramite l’interfaccia mobile. Il sistema scatta una fotografia dell’ingresso dell’arnia e la invia all’utente.
* Il sistema acquisisce automaticamente immagini a intervalli programmati o manualmente. Le immagini vengono inviate al server e archiviate per l’analisi storica.

---

## 8. Sequenze operative

### Sequenza di avvio:
Questa sequenza descrive il comportamento del sistema dal momento in cui viene alimentato fino alla piena operatività:
* Il sistema viene alimentato tramite la sorgente di energia prevista (batteria o alimentazione esterna). L’ESP32-CAM riceve tensione e avvia la fase di boot.
* L’ESP32 esegue il firmware di avvio e verifica l’integrità del programma. Vengono inizializzate le periferiche di base del microcontrollore (CPU, RAM, GPIO principali).
* Il sistema inizializza i bus necessari alla comunicazione con i sensori: Bus I²C per i sensori di temperatura e umidità, Bus digitale per il sensore di peso (HX711) Ingressi analogici per sensori di livello o microfono, Interfaccia della camera per il modulo ESP32-CAM. Questa fase garantisce che ogni sensore possa comunicare correttamente con l’ESP.
* I sensori vengono inizializzati uno alla volta secondo un ordine predefinito.
* L’ESP32 tenta la connessione alla rete Wi-Fi configurata. In caso di successo, il sistema ottiene un indirizzo IP e diventa operativo per la comunicazione con il server REST.
* Il sistema invia al server un messaggio di avvio contenente: identificativo del dispositivo, versione firmware, stato dei sensori. Il server può rispondere con eventuali parametri di configurazione.
* Il sistema entra nella modalità di funzionamento normale e avvia il ciclo periodico di acquisizione dati.

### Sequenza di acquisizione dati:
Questa sequenza descrive il comportamento del sistema durante il funzionamento normale.
* Il sistema attende l’intervallo di campionamento configurato
* L’ESP legge i dati dai sensori secondo priorità
* I valori vengono aggregati in un pacchetto dati
* Il pacchetto viene inviato al server REST
* Il sistema ritorna in stato di attesa

### Sequenza di acquisizione immagini:
* Il sistema riceve una richiesta di acquisizione (manuale o programmata)
* Il modulo camera viene attivato
* Viene scattata una fotografia all'ingresso dell’arnia
* L’immagine viene compressa.
* L’immagine viene inviata al server o archiviata temporaneamente

### Dipendenze tra componenti:
* I sensori dipendono dal l'inizializzazione corretta dei bus di comunicazione
* La trasmissione dei dati dipende dalla connessione di rete attiva
* L’invio delle immagini dipende dalla disponibilità del modulo camera e dalla rete
* Il sistema di allarme dipende dalla corretta acquisizione e validazione dei dati

---

## 9. Scalabilità e possibili estensioni

Questa sezione descrive le possibilità di espansione del sistema sia dal punto di vista hardware che software, evidenziando come l’architettura sia progettata per accogliere nuovi sensori e funzionalità senza modifiche strutturali rilevanti:

### Sensori aggiuntivi possibili:
* **Sensore audio/vibrazioni:** Per l’analisi del ronzio della colonia, utile per individuare stati di stress, pre-sciamatura o eventi di disturbo esterno.
* **Sensori di gas (CO₂ / O₂):** Per lo studio della qualità dell’aria interna all’arnia e dell’attività metabolica della colonia.
* **Sensori di luminosità:** Per rilevare intrusioni o aperture anomale dell’arnia.
* **Sensori ambientali esterni:** Temperatura, umidità e pressione esterna per confronti con i valori interni e analisi climatiche.
* **Sensore Livello Acqua:** Per rilevare il livello di acqua nel contenitore dove le api bevono.
* **Sensore Camera:** Per scattare foto all'ingresso dell'arnia.

### Estensioni basate su visione artificiale e AI:
* Conteggio automatico delle api in entrata e uscita
* Riconoscimento di comportamenti anomali
* Identificazione di predatori o intrusioni con analisi fotografia

### Espansioni future dell’architettura:
* Supporto a più arnie tramite rete di nodi
* Aggiornamenti firmware remoto
* Evoluzione del progetto verso sistemi di ricerca o monitoraggio avanzato

## 10. Riferimenti

# [ESP32Router](../src/Codice%20di%20test%20per%20SENSORI/esp_router/)

# [ESP32-CAM](../src/Codice%20di%20test%20per%20SENSORI/Esp32%20Cam/)

# [DS18B20](../src/Codice%20di%20test%20per%20SENSORI/Sensore_DS18B20/)

# [FC-28](../src/Codice%20di%20test%20per%20SENSORI/Sensore_FC-28/)

# [HW-038](../src/Codice%20di%20test%20per%20SENSORI/Sensore_HW-038/)

# [HX711](../src/Codice%20di%20test%20per%20SENSORI/Sensore_HX711/)

# [KY-038](../src/Codice%20di%20test%20per%20SENSORI/Sensore_KY-038/)

# [SHT21](../src/Codice%20di%20test%20per%20SENSORI/Sensore_SHT21/)

# [SensorePesoRobusto](../src/Codice%20di%20test%20per%20SENSORI/SensorePesoRobusto/)