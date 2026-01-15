#include <Arduino.h>
#include "SensorValidation.h"

// ============================================================================
// CONFIGURAZIONE TEST
// ============================================================================
static const float TEST_peso_min_kg = 0.0f;
static const float TEST_peso_max_kg = 40.0f;

// ============================================================================
// CATALOGO ERRORI SPECIFICI PESO (PS)
// ============================================================================
enum ErrorePeso {
  ERR_PS_NONE = 0,
  ERR_PS_SATURAZIONE_ADC = 2030,
  ERR_PS_TARATURA_NON_PRESENTE = 2060,
  ERR_PS_TARATURA_NON_VALIDA = 2070,
  ERR_PS_CONVERSIONE_KG_FALLITA = 2080
};

// ============================================================================
// CONFIGURAZIONE VALIDAZIONE PESO
// ============================================================================
ConfigValidazioneSensore configPeso = {
  .rangeMin = TEST_peso_min_kg,
  .rangeMax = TEST_peso_max_kg,
  .permettiNegativi = false,
  .richiedeTimestamp = true,
  .valoreDefault = 0.0f,
  .nomeSensore = "PESO"
};

// ============================================================================
// STRUTTURA RISULTATO VALIDAZIONE PESO (estesa)
// ============================================================================
struct RisultatoValidazionePeso {
  RisultatoValidazione validazioneComune;
  ErrorePeso erroreSpecifico;
};

// ============================================================================
// SETUP PESO (rinominato da setup)
// ============================================================================
void setupPeso() {
  Serial.println("→ Inizializzazione sensore Peso.. .");
  
  // TODO: Inizializzazione HX711 o altro ADC
  // Esempio: 
  // scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  // scale.set_scale(calibration_factor);
  // scale.tare();
  
  Serial.println("  ✓ Sensore Peso pronto\n");
}

// ============================================================================
// FUNZIONI SPECIFICHE PESO
// ============================================================================

static bool verificaTaraturaPeso(ErrorePeso* errore) {
  bool taratura_presente = true;
  bool taratura_valida = true;
  
  if (! taratura_presente) {
    *errore = ERR_PS_TARATURA_NON_PRESENTE;
    Serial.println("  ERR_PS_TARATURA_NON_PRESENTE:  calibrazione mancante");
    return false;
  }
  
  if (! taratura_valida) {
    *errore = ERR_PS_TARATURA_NON_VALIDA;
    Serial.println("  ERR_PS_TARATURA_NON_VALIDA: calibrazione corrotta");
    return false;
  }
  
  return true;
}

static void taraturaDifferenzaPeso() {
  Serial.println("  Esecuzione taratura peso...");
  // TODO: In produzione, applicare offset
}

static RisultatoValidazionePeso acquisisciEValidaPeso() {
  RisultatoValidazionePeso risultato;
  risultato.erroreSpecifico = ERR_PS_NONE;
  
  // STEP 1: Verifica taratura
  if (!verificaTaraturaPeso(&risultato.erroreSpecifico)) {
    risultato.validazioneComune.valido = false;
    risultato.validazioneComune.codiceErrore = ERR_SENSOR_NOT_READY;
    risultato.validazioneComune.valorePulito = configPeso.valoreDefault;
    strcpy(risultato.validazioneComune.messaggioErrore, "[PESO] Taratura non valida");
    return risultato;
  }
  
  // STEP 2: Lettura ADC (simulata)
  float valore_kg = 12.5f; // TEST
  
  // TODO: Lettura reale
  // float valore_kg = scale.get_units(10);
  
  if (isnan(valore_kg) || isinf(valore_kg)) {
    risultato.erroreSpecifico = ERR_PS_CONVERSIONE_KG_FALLITA;
    risultato.validazioneComune.valido = false;
    risultato.validazioneComune.codiceErrore = ERR_DATA_INVALID_NUMBER;
    risultato.validazioneComune.valorePulito = configPeso.valoreDefault;
    strcpy(risultato.validazioneComune.messaggioErrore, "[PESO] Conversione kg fallita");
    return risultato;
  }
  
  // STEP 3: Validazione comune
  bool sensoreReady = true;
  unsigned long timestamp = millis();
  
  risultato.validazioneComune = validaDatoSensore(
    valore_kg,
    timestamp,
    sensoreReady,
    configPeso
  );
  
  return risultato;
}

static void invioAlertPesoFuoriRange(RisultatoValidazionePeso* risultato) {
  Serial.println("\n  ╔════════════════════════════════════╗");
  Serial.println("  ║        ALERT PESO ANOMALO         ║");
  Serial.println("  ╚════════════════════════════════════╝");
  
  if (risultato->validazioneComune.codiceErrore != ERR_COMMON_NONE) {
    Serial.print("  Errore comune: ");
    Serial.println(risultato->validazioneComune.messaggioErrore);
  }
  
  if (risultato->erroreSpecifico != ERR_PS_NONE) {
    Serial.print("  Errore specifico: ");
    Serial.print(risultato->erroreSpecifico);
    Serial.print(" (");
    switch(risultato->erroreSpecifico) {
      case ERR_PS_SATURAZIONE_ADC:  Serial.print("Saturazione ADC"); break;
      case ERR_PS_TARATURA_NON_PRESENTE: Serial.print("Taratura assente"); break;
      case ERR_PS_TARATURA_NON_VALIDA: Serial.print("Taratura non valida"); break;
      case ERR_PS_CONVERSIONE_KG_FALLITA: Serial.print("Conversione fallita"); break;
      default:  Serial.print("Altro"); break;
    }
    Serial.println(")");
  }
  
  Serial.print("  Valore: ");
  Serial.print(risultato->validazioneComune.valorePulito, 3);
  Serial.println(" kg\n");
}

static void confermaPesoValido(float valore_peso_kg) {
  Serial.println("\n  ✓ PESO VALIDO");
  Serial.print("    Peso misurato: ");
  Serial.print(valore_peso_kg, 3);
  Serial.println(" kg\n");
}

// ============================================================================
// FUNZIONE PRINCIPALE PESO (chiamata dal Main)
// ============================================================================

void funzionePeso() {
  Serial.println("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("    ESECUZIONE CICLO PESO");
  Serial.println("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // 1) Taratura
  taraturaDifferenzaPeso();
  
  // 2) Acquisizione e validazione
  RisultatoValidazionePeso risultato = acquisisciEValidaPeso();
  
  // 3) Gestione risultato
  if (! risultato.validazioneComune.valido) {
    invioAlertPesoFuoriRange(&risultato);
  } else {
    confermaPesoValido(risultato.validazioneComune.valorePulito);
  }
}