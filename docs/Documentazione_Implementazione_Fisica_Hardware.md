\# \*\*Protocollo di Installazione Hardware: Arnia Digitale\*\*

Il sistema prevede l\'integrazione di sensori di precisione per il
monitoraggio ponderale e termo-igrometrico all\'interno di una struttura
standard.

\## \*\*1\\. Schema di Cablaggio e Pinout (ESP32-CAM)\*\*

Per l\'interfacciamento dei sensori viene utilizzato il microcontrollore
ESP32-CAM. Poiché i GPIO sono condivisi con il lettore SD, la
programmazione prevede l\'uso esclusivo dei pin per i sensori, senza
l\'inserimento di schede di memoria.

\| \*\*Componente\*\* \| \*\*Pin Sensore\*\* \| \*\*Pin ESP32-CAM\*\* \|
\*\*Note Tecniche\*\* \| \| \-\-- \| \-\-- \| \-\-- \| \-\-- \| \|
\*\*Alimentazione\*\* \| VCC / GND \| \*\*5V / GND\*\* \| Ingresso da
regolatore stabilizzato \| \| \-\-- \| \-\-- \| \-\-- \| \-\-- \| \|
\*\*SHT21 (Ambiente)\*\* \| SDA \| \*\*GPIO 14\*\* \| Bus I2C (Dati) \|
\| \-\-- \| \-\-- \| \-\-- \| \-\-- \| \| \*\*SHT21 (Ambiente)\*\* \|
SCL \| \*\*GPIO 15\*\* \| Bus I2C (Clock) \| \| \-\-- \| \-\-- \| \-\--
\| \-\-- \| \| \*\*DS18B20 (Sonda)\*\* \| DATI \| \*\*GPIO 13\*\* \|
\*\*Resistenza 4.7kΩ tra DATI e 3.3V\*\* \| \| \-\-- \| \-\-- \| \-\--
\| \-\-- \| \| \*\*HX711 (Bilancia)\*\* \| DT \| \*\*GPIO 12\*\* \|
Canale dati amplificatore peso \| \| \-\-- \| \-\-- \| \-\-- \| \-\-- \|
\| \*\*HX711 (Bilancia)\*\* \| SCK \| \*\*GPIO 2\*\* \| Canale clock
amplificatore peso \| \| \-\-- \| \-\-- \| \-\-- \| \-\-- \|

\## \*\*2\\. Installazione della Cella di Carico (Sistema Peso)\*\*

Il monitoraggio del peso avviene tramite una cella di carico montata a
\"sandwich\" tra due basi rigide.

\- \*\*Posizionamento:\*\* La cella è interposta tra due piani in legno
multistrato fenolico (minimo 20mm) o piastre metalliche. -
\*\*Fissaggio:\*\* L\'ancoraggio avviene tramite bulloni in acciaio
INOX. È mandatorio inserire rondelle di spessore tra la cella e i piani
per garantire un \"gap\" di 2-3mm, permettendo la deformazione elastica
necessaria alla misurazione. - \*\*Protezione:\*\* Il modulo
\*\*HX711\*\* viene collocato in una custodia stagna adiacente alla
cella. Viene utilizzato cavo quadripolare schermato per minimizzare i
disturbi elettromagnetici.

\## \*\*3\\. Installazione dei Sensori Interni\*\*

\### \*\*Sensore Termo-igrometrico (SHT21)\*\*

\- \*\*Ubicazione:\*\* Parte superiore dell\'arnia, fissato alla faccia
inferiore del coprifavo. - \*\*Protezione Meccanica:\*\* Il modulo deve
essere racchiuso in una gabbia di rete metallica con maglia inferiore a
0.5mm. Tale accorgimento impedisce alle api la deposizione di propoli
sulla membrana sensibile, preservando la capacità di lettura
dell\'umidità.

\### \*\*Sonda di Temperatura (DS18B20)\*\*

\- \*\*Ubicazione:\*\* Inserimento tra i telaini centrali del nido. -
\*\*Installazione:\*\* Il cavo della sonda attraversa il coprifavo
mediante un foro da 6mm, successivamente sigillato con silicone
atossico. La punta in acciaio deve trovarsi in corrispondenza del
glomere (core dell\'alveare).

\## \*\*4\\. Alloggiamento Elettronica e Cablaggi\*\*

\- \*\*Contenitori:\*\* L\'ESP32-CAM e i moduli di regolazione sono
ospitati in custodie con grado di protezione IP67 fissate
esternamente. - \*\*Gestione Cavi:\*\* Tutti i passaggi di cavi tra
l\'interno e l\'esterno dell\'arnia sono gestiti tramite pressacavi
stagni o fori sigillati. I cavi interni sono fissati alle pareti con
fascette in plastica per non interferire con le operazioni
dell\'apicoltore. - \*\*Trattamento Anti-Corrosione:\*\* Data la
presenza di vapori organici (acido ossalico/formico), è prescritta
l\'applicazione di vernice protettiva isolante su tutti i contatti
elettrici e le saldature esposte.

\## \*\*5\\. Specifiche dei Componenti Meccanici\*\*

\- \*\*Viteria:\*\* Esclusivamente acciaio INOX 304 o 316. -
\*\*Sigillanti:\*\* Silicone acetico atossico o mastice per uso
alimentare. - \*\*Cavi:\*\* Tipologia schermata per il segnale della
bilancia; cavi twistati per il bus I2C (SHT21) se la lunghezza supera i
50cm.

\### \*\*Note Tecniche Obbligatorie per il Cablaggio\*\*

\#### \*\*1\\. Resistenze di Pull-up\*\*

\- \*\*Sensore DS18B20:\*\* È necessario inserire una resistenza da
\*\*\\\$4.7k \\\\Omega\\\$\*\* tra il pin DATI (GPIO 13) e il pin 3.3V.
Senza questa resistenza, il bus 1-Wire non sarà in grado di trasmettere
i dati correttamente. - \*\*Sensore SHT21:\*\* Molti moduli commerciali
hanno già le resistenze di pull-up integrate. In caso di componenti
nudi, inserire due resistenze da \*\*\\\$4.7k \\\\Omega\\\$\*\* tra
SDA/SCL e il 3.3V.

\#### \*\*2\\. Alimentazione Differenziata\*\*

\- L\'\*\*ESP32-CAM\*\* deve ricevere \*\*5V\*\* stabili sul pin
dedicato (VCC/5V) tramite lo Step-Down collegato alle batterie a 12V. -
L\'\*\*HX711\*\* può essere alimentato a 5V per garantire una maggiore
precisione nella lettura della cella di carico, ma i segnali logici DT e
SCK devono essere compatibili con i 3.3V dell\'ESP32. Se il modulo HX711
non supporta la logica a 3.3V, è preferibile alimentarlo direttamente a
3.3V.

\#### \*\*3\\. Gestione GPIO Critici\*\*

\- \*\*GPIO 2:\*\* Questo pin è collegato internamente a un LED sulla
scheda e influisce sul boot mode. Assicurarsi che l\'HX711 non forzi
questo pin a uno stato logico basso durante l\'avvio, altrimenti
l\'ESP32 non caricherà il programma correttamente. - \*\*GPIO 12:\*\*
All\'avvio (boot), questo pin non deve essere tenuto \"High\" (alto).
Verificare che il modulo HX711 mantenga lo stato flottante o basso
durante l\'accensione.

\### \*\*Schema del Circuito di Alimentazione (Hardware Team)\*\*

\- \*\*Ingresso:\*\* Batteria 12V (Caricata dal pannello solare). -
\*\*Conversione:\*\* Convertitore DC-DC Step-Down tarato a
\*\*5.1V\*\*. - \*\*Distribuzione:\*\*  - \*\*5V\*\* diretti al pin 5V
dell\'ESP32 e al VCC dell\'HX711.  - \*\*GND comune\*\* a tutti i
componenti (Batteria, ESP32, Sensori).  - \*\*3.3V\*\* prelevati dal pin
di uscita dell\'ESP32 per alimentare SHT21 e DS18B20.

\### \*\*Raccomandazioni per l\'Assemblaggio\*\*

\- \*\*Lunghezza Cavi:\*\* Il bus I2C (SHT21) è sensibile alla distanza.
Se il sensore dista più di 1 metro dall\'ESP32, è consigliato l\'uso di
cavi twistati e schermati. - \*\*Messa a terra:\*\* Collegare la calza
metallica dei cavi schermati (specialmente quella della cella di carico)
al GND del circuito per ridurre i disturbi sulle letture del peso.

\*\*Lista della spesa tecnica :\*\*

\*\*1\\. Elettronica di Controllo e Potenza\*\*

Questi componenti servono a interfacciare i tuoi sensori con la batteria
a 12V.

\- \*\*1x Convertitore DC-DC Step-Down (LM2596 o MP1584EN):\*\* Per
abbassare i 12V della batteria a 5V per l\'ESP32. - \*\*1x Set di
Resistenze da \\\$4.7k \\\\Omega\\\$:\*\* Fondamentali per i pull-up dei
sensori DS18B20 e SHT21. - \*\*1x Breadboard miniaturizzata o PCB
millefori (5x7 cm):\*\* Per saldare i componenti ed evitare connessioni
volanti. - \*\*1x Condensatore elettrolitico da 100uF 25V:\*\* Da
mettere in parallelo all\'alimentazione per stabilizzare i picchi di
consumo del WiFi.

\### \*\*2\\. Meccanica e Fissaggio (Acciaio INOX)\*\*

L\'ambiente dell\'arnia è corrosivo; l\'uso dell\'inox è obbligatorio.

\- \*\*4x Bulloni M6x30mm con dadi e rondelle:\*\* Per il fissaggio
della cella di carico alle piastre di legno. - \*\*12x Viti da legno
INOX (3.5x16mm):\*\* Per fissare le custodie plastiche e i supporti
sensori. - \*\*2x Piastre in multistrato fenolico (spessore 20mm):\*\*
Dimensioni 50x50cm (o pari alla base dell\'arnia) per creare la
bilancia. - \*\*1x Confezione di fascette in plastica nere (resistenti
UV):\*\* Misura piccola e media.

\### \*\*3\\. Protezione e Isolamento\*\*

\- \*\*1x Tubetto di silicone acetico atossico:\*\* Per sigillare i fori
di passaggio cavi nell\'arnia. - \*\*1x Spray isolante per circuiti
(Conformal Coating) o smalto trasparente:\*\* Per proteggere le
saldature dai vapori acidi. - \*\*1x Retina metallica a maglia finissima
(Acciaio o Alluminio):\*\* Quadrato di 10x10cm (da tagliare per
proteggere l\'SHT21).

\### \*\*4\\. Cablaggio e Lunghezze Stimate\*\*

Si consiglia l\'uso di cavi schermati per evitare interferenze tra il
router e i sensori.

\| \*\*Collegamento\*\* \| \*\*Tipo di Cavo\*\* \| \*\*Lunghezza
Stimata\*\* \| \| \-\-- \| \-\-- \| \-\-- \| \| \*\*Cella di carico →
HX711\*\* \| Cavo quadripolare schermato (tipo allarme) \| \*\*0.5 - 1
metro\*\* \| \| \-\-- \| \-\-- \| \-\-- \| \| \*\*SHT21 → ESP32\*\* \|
Cavo quadripolare (o 2 coppie twistate) \| \*\*1.5 - 2 metri\*\* \| \|
\-\-- \| \-\-- \| \-\-- \| \| \*\*DS18B20 → ESP32\*\* \| Cavo tripolare
(già integrato nella sonda) \| \*\*1 metro\*\* (estendibile a 2m) \| \|
\-\-- \| \-\-- \| \-\-- \| \| \*\*Batteria/Pannello → Centralina\*\* \|
Cavo bipolare sezione 1.5mmq \| \*\*2 - 3 metri\*\* \| \| \-\-- \| \-\--
\| \-\-- \| \| \*\*Ponteggi interni\*\* \| Cavetti jumper
maschio-femmina o filo rigido \| \*\*30 cm\*\* (per test) \| \| \-\-- \|
\-\-- \| \-\-- \|

\### \*\*Riepilogo stima lunghezze totali da acquistare:\*\*

\- \*\*Cavo schermato 4 poli:\*\* 5 metri (per avere margine di
errore). - \*\*Cavo elettrico bipolare (rosso/nero):\*\* 5 metri. -
\*\*Guaina termorestringente (diametri vari):\*\* 1 metro per isolare le
saldature dei sensori.
