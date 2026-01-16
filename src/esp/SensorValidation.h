#ifndef SENSOR_VALIDATION_H
#define SENSOR_VALIDATION_H

#include <Arduino.h>

// ... [TUTTI I TUOI ENUM VANNO QUI, SONO CORRETTI] ...
// (Ho omesso gli enum per brevità, mantienili uguali al tuo codice originale)
// ...

// ============================================================================
// STRUTTURE
// ============================================================================

struct ConfigValidazioneSensore {
  float rangeMin;
  float rangeMax;
  bool permettiNegativi;
  bool richiedeTimestamp;
  float valoreDefault;
  const char* nomeSensore;
};

struct SensorConfig {
  float sogliaMin;
  float sogliaMax;
  unsigned long intervallo;
  bool abilitato;
};

struct RisultatoValidazione {
  bool valido;
  int codiceErrore;
  float valorePulito;
  char messaggioErrore[80];
};

// ============================================================================
// IMPLEMENTAZIONE FUNZIONI (Marcate come INLINE per stare nel .h)
// ============================================================================

// NOTA: Se usi Arduino UNO/NANO, queste stringhe occupano molta RAM.
// Considera l'uso di F() o PROGMEM se hai problemi di memoria.
inline const char* getErroreDescrizione(int codiceErrore) {
  switch(codiceErrore) {
    // 9XXX - Status
    case 9000: return "OK";
    case 9001: return "OK con warning";
    
    // 10XX - Dato
    case 1001: return "Dato nullo/mancante";
    case 1002: return "Dato NaN o Infinito";
    case 1003: return "Dato negativo non ammesso";
    case 1004: return "Formato dato errato";
    
    // 11XX - Range
    case 1101: return "Misura fuori range";
    case 1102: return "Misura sotto minimo";
    case 1103: return "Misura sopra massimo";
    
    // ... [INSERISCI QUI IL RESTO DEI TUOI CASI SWITCH] ...
    // ... Copia tutto il contenuto del tuo switch originale qui ...
    
    default: return "Errore sconosciuto";
  }
}

inline const char* getErroreCategoria(int codiceErrore) {
  int categoria = codiceErrore / 1000;
  
  switch(categoria) {
    case 1: return "ERRORE_COMUNE";
    case 2: return "ALERT";
    case 3: return "ERRORE_PESO";
    case 4: return "ERRORE_UMIDITA";
    case 5: return "ERRORE_TEMPERATURA";
    case 9: return "STATUS";
    default: return "SCONOSCIUTO";
  }
}

inline RisultatoValidazione validaDatoSensore(
  float valoreGrezzo,
  unsigned long timestamp,
  bool sensoreReady,
  ConfigValidazioneSensore config
) {
  RisultatoValidazione risultato;
  risultato.valido = true;
  risultato.codiceErrore = 9000; // STATUS_OK (Hardcoded se enum non visibile qui, o usa STATUS_OK)
  risultato.valorePulito = valoreGrezzo;
  strcpy(risultato.messaggioErrore, "OK");
  
  // 1) SENSORE NON PRONTO
  if (!sensoreReady) {
    risultato.valido = false;
    risultato.codiceErrore = 1201; // ERR_SENSOR_NOT_READY
    risultato.valorePulito = config.valoreDefault;
    snprintf(risultato.messaggioErrore, 80, 
             "[%s][%d] %s", 
             config.nomeSensore, 
             risultato.codiceErrore,
             getErroreDescrizione(risultato.codiceErrore));
    return risultato;
  }
  
  // 2) DATO NaN
  if (isnan(valoreGrezzo)) {
    risultato.valido = false;
    risultato.codiceErrore = 1002; // ERR_DATA_INVALID_NUMBER
    risultato.valorePulito = config.valoreDefault;
    snprintf(risultato.messaggioErrore, 80, 
             "[%s][%d] %s (NaN)", 
             config.nomeSensore,
             risultato.codiceErrore,
             getErroreDescrizione(risultato.codiceErrore));
    return risultato;
  }
  
  // 3) DATO INFINITO
  if (isinf(valoreGrezzo)) {
    risultato.valido = false;
    risultato.codiceErrore = 1002; // ERR_DATA_INVALID_NUMBER
    risultato.valorePulito = config.valoreDefault;
    snprintf(risultato.messaggioErrore, 80, 
             "[%s][%d] %s (Inf)", 
             config.nomeSensore,
             risultato.codiceErrore,
             getErroreDescrizione(risultato.codiceErrore));
    return risultato;
  }
  
  // 4) NEGATIVO NON AMMESSO
  if (!config.permettiNegativi && valoreGrezzo < 0.0f) {
    risultato.valido = false;
    risultato.codiceErrore = 1003; // ERR_DATA_NEGATIVE_NOT_ALLOWED
    risultato.valorePulito = config.valoreDefault;
    // CORRETTO: rimosso spazio in %.2f
    snprintf(risultato.messaggioErrore, 80, 
             "[%s][%d] %s: %.2f", 
             config.nomeSensore,
             risultato.codiceErrore,
             getErroreDescrizione(risultato.codiceErrore),
             valoreGrezzo);
    return risultato;
  }
  
  // 5) FUORI RANGE
  // CORRETTO: rimossi spazi in config.range...
  if (valoreGrezzo < config.rangeMin || valoreGrezzo > config.rangeMax) {
    risultato.valido = false;
    risultato.codiceErrore = 1101; // ERR_MEASURE_OUT_OF_RANGE
    risultato.valorePulito = config.valoreDefault;
    snprintf(risultato.messaggioErrore, 80, 
             "[%s][%d] %s: %.2f [%.2f-%.2f]", 
             config.nomeSensore,
             risultato.codiceErrore,
             getErroreDescrizione(risultato.codiceErrore),
             valoreGrezzo, config.rangeMin, config.rangeMax);
    return risultato;
  }
  
  // 6) TIMESTAMP MANCANTE
  if (config.richiedeTimestamp && (timestamp == 0 || timestamp == ULONG_MAX)) {
    risultato.valido = false;
    risultato.codiceErrore = 1401; // ERR_TIMESTAMP_INVALID
    risultato.valorePulito = valoreGrezzo;
    snprintf(risultato.messaggioErrore, 80, 
             "[%s][%d] %s", 
             config.nomeSensore,
             risultato.codiceErrore,
             getErroreDescrizione(risultato.codiceErrore));
    return risultato;
  }
  
  // TUTO OK
  risultato.valido = true;
  risultato.codiceErrore = 9000;
  risultato.valorePulito = valoreGrezzo;
  snprintf(risultato.messaggioErrore, 80, 
           "[%s][%d] Valore valido: %.2f", 
           config.nomeSensore, 9000, valoreGrezzo);
  
  return risultato;
}

inline void gestisciRisultatoValidazione(RisultatoValidazione risultato) {
  if (risultato.codiceErrore != 9000) { // STATUS_OK
    Serial.print("X ");
    Serial.print(getErroreCategoria(risultato.codiceErrore));
    Serial.print(" ");
  } else {
    Serial.print("OK ");
  }
  
  Serial.println(risultato.messaggioErrore);
}

inline int verificaSoglie(float valore, float sogliaMin, float sogliaMax, const char* nomeSensore) {
  if (valore > sogliaMax) {
    Serial.print("[ALERT][");
    Serial.print(2002); // ALERT_THRESHOLD_HIGH
    Serial.print("] ");
    Serial.print(nomeSensore);
    Serial.print(": ");
    Serial.print(valore);
    Serial.print(" > ");
    Serial.println(sogliaMax);
    return 2002;
  }
  
  if (valore < sogliaMin) {
    Serial.print("[ALERT][");
    Serial.print(2001); // ALERT_THRESHOLD_LOW
    Serial.print("] ");
    Serial.print(nomeSensore);
    Serial.print(": ");
    Serial.print(valore);
    Serial.print(" < ");
    Serial.println(sogliaMin);
    return 2001;
  }
  
  return 9000; // STATUS_OK
}

#endif // SENSOR_VALIDATION_H
