
### 1. Introduzione

Questo documento descrive gli standard di rete necessari per la connessione e l’integrazione tra:

1.  Modulo ESP32-CAM (microcontroller con fotocamera e Wi-Fi)  
      
    
2.  Router Strong 4G LTE 300 Mini (gateway di rete cellulare e Wi-Fi)  
      
    

L’obiettivo è definire letteralmente gli standard tecnici di rete, i protocolli, le bande e i requisiti per la comunicazione affidabile tra i due dispositivi.

----------

## 2. ESP32-CAM – Standard di rete

### 2.1 Tipo di comunicazione Wi-Fi

-   Supporto per IEEE 802.11 b/g/n (Wi-Fi 4) in banda 2,4 GHz.  
      
    
-   Modalità operative Wi-Fi: Station (STA), SoftAP e promiscuous.  
      
    

### 2.2 Stack di rete e protocolli

-   Supporto TCP/IP completo per socket, client e server.  
      
    
-   Gestione di DHCP client per indirizzo IP in rete infrastrutturata.  
      
    
-   Possibilità di configurazione come Access Point per hosting SSID.  
      
    
-   Sicurezza supportata: WPA2-PSK (tramite libreria Wi-Fi standard).  
      
    

### 2.3 Capacità radio

-   Velocità fisica dati fino a 150 Mbps in modalità 802.11n (dipendente da banda e MCS).  
      
    

### 2.4 Standard di sicurezza

-   WPA/WPA2, autenticazione PSK, crittografia AES/CCMP se configurata.  
      
    

----------

## 3. Strong 4G LTE 300 Mini – Standard di rete

### 3.1 Reti mobili

-   Supporto 4G LTE su standard LTE-FDD e LTE-TDD.  
      
    
-   Compatibilità con reti 3G (UMTS/HSPA+) e 2G (EDGE/GPRS/GSM).  
      
    

Note importanti:

-   Velocità dati LTE DL teorica fino a 150 Mbps.  
      
    
-   Supporto multi-banda per frequenze operative 4G, ad esempio 800/900/1800/1900/2100/2300/2500/2600 MHz.  
      
    

----------

### 3.2 Wi-Fi Standard

-   IEEE 802.11 b/g/n su 2,4 GHz, con velocità WLAN fino a 300 Mbps.  
      
    
-   Security: WPA/WPA2-PSK, WPS disponibile.  
      
    

----------

### 3.3 Ethernet e LAN

-   Supporto IEEE 802.3 / IEEE 802.3u con porte Ethernet 10/100 Mbps.  
      
    
-   Funzioni di rete: DHCP server, NAT, Port Forward, DNS dinamico (se configurabile).  
      
    

----------

## 4. Connettività tra ESP32-CAM e Router

### 4.1 Scenario infrastrutturale

Il modulo ESP32-CAM si connette alla rete locale creata dal router tramite Wi-Fi:

-   SSID: definito sul router  
      
    
-   Sicurezza: WPA2-PSK  
      
    
-   IP: assegnato tramite DHCP client del modulo ESP32.  
      
    

----------

### 4.2 Configurazione IP e protocolli

-   Indirizzo IPv4 assegnato dal router Strong.  
      
    
-   Protocollo di trasporto: TCP/IP (per esempio per video streaming via HTTP) o UDP secondo applicazione.  
      
    
-   Possibile uso di HTTPS con certificati se richiesto per sicurezza applicativa.  
      
    

----------

## LINK UTILI PER APPROFONDIRE

ESP32 Datasheet (Espressif) — [https://documentation.espressif.com/esp32_datasheet_en.html](https://documentation.espressif.com/esp32_datasheet_en.html)

Strong 4G LTE 300 Mini — Specifiche prodotto (Strong.eu)  
Strong LTE Mini – Specifiche dettagliate rivenditori