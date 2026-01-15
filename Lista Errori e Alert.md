# 1) Errori/Alert COMUNI (cross‑sensor)

##Integrità del dato / validazione base (INPUT VALIDATION)
- **Dato nullo / mancante**
- **Dato numericamente non valido (NaN / infinito / formato errato)**
- **Dato negativo non ammesso (quando il dominio non lo consente)**
**Categoria suggerita unica:** `ERR_DATA_NULL`, `ERR_DATA_INVALID_NUMBER`, `ERR_DATA_NEGATIVE_NOT_ALLOWED`

---

##Range fisico/operativo del sensore (OUT OF RANGE “hard”)
- **Quando la misura è fuori dai limiti “plausibili” o supportati**
**Categoria unica:** `ERR_MEASURE_OUT_OF_RANGE`

---

##Sensore/Hardware non disponibile (SENSOR OFFLINE / NOT DETECTED)
- **Il dato non è affidabile perché il sensore non risponde o non è rilevabile**
**Categoria unica:** `ERR_SENSOR_NOT_READY`, `ERR_SENSOR_TIMEOUT`, `ERR_SENSOR_OFFLINE`

---

##Connettività e invio a Cloud/DB (NETWORK / DELIVERY)
- **Quando la misura è valida ma non può essere inviata**
**Categoria unica:** `ERR_NETWORK_OFFLINE`, `ERR_UPLOAD_FAILED`, `ERR_UPLOAD_RETRY_EXHAUSTED`

---

# 2) Errori/Alert SPECIFICI (da lasciare “individuali”)

## Sensore di Peso (PS) — specifici del dominio “ADC + taratura”
Questi sono davvero particolari del sensore di peso con ADC e calibrazione:

- **ERR-PS-2.03 Saturazione ADC**  
  (tipico di ADC/load cell: stuck a 0 o full-scale)
- **ERR-PS-2.06 Taratura non presente**
- **ERR-PS-2.07 Taratura non valida**
- (in parte anche **ERR-PS-2.08** è comune come “NaN”, ma la causa “conversione kg con taratura” è tipica del peso)

## Sensore Umidità — specifici del sensore (così come lo hai descritto)
- **3.5 “Il dato deve essere gestito con una variabile float”**  
  È più un vincolo implementativo/di interfaccia software (non fisico), ma nel tuo elenco è specifico dell’umidità.

## Temperatura — specifici del “processo”
Nel tuo elenco temperatura è soprattutto un **workflow** (acquisizione → storage → sync → soglie). Non hai errori “fisici” specifici tipo “conversione NTC fallita” o “CRC fail”. Quindi, come “specifico”, resta più che altro:
- La presenza di un **intervallo di campionamento fisso di 6 minuti (1.12)** come requisito di processo (non errore/alert, ma specificità del ciclo).

---

# 3) Output finale “pulito” (pronto da usare come catalogo comune)

## Catalogo comune (riusabile per tutti i sensori)
1. **Dato mancante/nullo**  
2. **Dato non valido (NaN/Inf/formato errato)**  
3. **Dato negativo non ammesso (se applicabile)**  
4. **Misura fuori range (plausibilità / limiti sensore)**  
5. **Sensore non rilevato / offline / non pronto**  
6. **Timeout acquisizione / lettura fallita**  
7. **Misura instabile / rumore / outlier / warm-up post wake**  
8. **Timestamp mancante / non valido**  
9. **Connettività assente / DB non raggiungibile**  
10. **Invio fallito + retry/store-and-forward**  
11. **Duplicazione misura (idempotenza)**  
12. **Alert soglia alta / soglia bassa**

## Specifici PS (solo peso)
- Saturazione ADC
- Taratura non presente
- Taratura non valida
- Conversione kg fallita per taratura

## Specifici Umidità (come da elenco)
- Vincolo “deve essere float” (se vuoi tenerlo come errore separato)

## Specifici Temperatura (come da elenco)
- Intervallo di campionamento 6 minuti (requisito di processo)

---

Se vuoi, nel prossimo messaggio posso:
- proporti una **tabella di mapping** (Temperatura/Umidità/Peso → Categoria comune → codice unificato),
- oppure uno **schema di enum unico** (es. `ERR_COMMON_xx`, `ALERT_COMMON_xx`, `ERR_PS_xx`), così riduci davvero spazio e duplicazione nel firmware.
