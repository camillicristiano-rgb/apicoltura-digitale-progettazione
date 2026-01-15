#include "SensorValidation.h"

// ============================================================================
// DICHIARAZIONE FUNZIONI DEI SENSORI (definite nei file . ino separati)
// ============================================================================
extern void setupTemperatura();
extern void setupUmidita();
extern void setupPeso();

extern void funzioneTemperatura();
extern void funzioneUmidita();
extern void funzionePeso();

// ============================================================================
// CONFIGURAZIONE TIMING
// ============================================================================
unsigned long ultimoCheckTemp = 0;
unsigned long ultimoCheckUmid = 0;
unsigned long ultimoCheckPeso = 0;

const unsigned long INTERVALLO_TEMP = 360000;  // 6 minuti
const unsigned long INTERVALLO_UMID = 2000;    // 2 secondi (TEST, poi 360000)
const unsigned long INTERVALLO_PESO = 20000;   // 20 secondi (TEST)

// ============================================================================
// SETUP PRINCIPALE
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n");
  Serial.println("SISTEMA MONITORAGGIO ARNIA - PCTO");
  Serial.println("Main Controller v1.0");
  Serial.println("Gestione Robusta Errori Sensori");
  Serial.println("INIZIALIZZAZIONE SISTEMA");
  
  // Inizializzazione sensori
  setupTemperatura();
  setupUmidita();
  setupPeso();
  
  Serial.println("TUTTI I SENSORI PRONTI");
  
  Serial.println("Intervalli di campionamento:");
  Serial.print("  • Temperatura: "); Serial.print(INTERVALLO_TEMP / 1000); Serial.println(" sec");
  Serial.print("  • Umidità:      "); Serial.print(INTERVALLO_UMID / 1000); Serial.println(" sec");
  Serial.print("  • Peso:        "); Serial.print(INTERVALLO_PESO / 1000); Serial.println(" sec");
  Serial.println();
  
  Serial.println("---\n");
  Serial.println("→ AVVIO MONITORAGGIO.. .\n");
}

// ============================================================================
// LOOP PRINCIPALE
// ============================================================================
void loop() {
  unsigned long tempoAttuale = millis();
  
  // ──────────────────────────────────────
  // TEMPERATURA (ogni 6 minuti)
  // ──────────────────────────────────────
  if (tempoAttuale - ultimoCheckTemp >= INTERVALLO_TEMP) {
    ultimoCheckTemp = tempoAttuale;
    
    Serial.println("\nSENSORE TEMPERATURA");
    
    funzioneTemperatura();
    
    Serial.println("---\n");
  }
  
  // ──────────────────────────────────────
  // UMIDITÀ (ogni 2 secondi in TEST)
  // ──────────────────────────────────────
  if (tempoAttuale - ultimoCheckUmid >= INTERVALLO_UMID) {
    ultimoCheckUmid = tempoAttuale;
    
    Serial.println("\nSENSORE UMIDITÀ");
    
    funzioneUmidita();
    
    Serial.println("---\n");
  }
  
  // ──────────────────────────────────────
  // PESO (ogni 20 secondi in TEST)
  // ──────────────────────────────────────
  if (tempoAttuale - ultimoCheckPeso >= INTERVALLO_PESO) {
    ultimoCheckPeso = tempoAttuale;
    
    Serial.println("\nSENSORE PESO");
    
    funzionePeso();
    
    Serial.println("---\n");
  }
  
  // Piccolo delay per evitare busy-wait
  delay(100);
}

// ============================================================================
// FUNZIONI UTILITY (opzionali)
// ============================================================================

// Funzione per stampare statistiche sistema (opzionale)
void stampaStatisticheSistema() {
  Serial.println("\n--- STATISTICHE SISTEMA ---");
  Serial.print("Uptime: "); Serial.print(millis() / 1000); Serial.println(" sec");
  Serial.print("Free RAM: "); Serial.println(ESP.getFreeHeap());
  Serial.println();
}