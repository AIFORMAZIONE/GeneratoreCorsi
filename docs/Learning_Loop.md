# Agent Learning Loop - Sistema di Apprendimento Continuo

**Versione**: 1.0  
**Ultimo aggiornamento**: 2026-06-17  
**Ambiente**: Nido di Agenti + LearnWorlds Course Generator  
**Stack**: FastAPI, Supabase, Redis, Claude API

---

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Componenti Principali](#componenti-principali)
4. [Flusso di Dati](#flusso-di-dati)
5. [Schema Database](#schema-database)
6. [Implementazione](#implementazione)
7. [Protezioni e Safeguard](#protezioni-e-safeguard)
8. [Metriche e Tracking](#metriche-e-tracking)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Panoramica

Il **Learning Loop** è un sistema di feedback continuo che migliora automaticamente gli agenti di generazione corsi basandosi sulle revisioni umane.

**Flusso base:**
```
Corso Generato → Revisione Umana → Analisi Errori → Ottimizzazione Prompt → Prossima Generazione
```

**Obiettivi:**
- ✅ Prevenire errori ricorrenti
- ✅ Imparare dai pattern di miglioramento umano
- ✅ Aumentare la qualità nel tempo
- ✅ Ridurre le revisioni necessarie
- ✅ Mantenere audit trail completo

---

## 🏗️ Architettura

### Componenti Principali

```
┌─────────────────────────────────────────────────────────┐
│                  NIDO DI AGENTI                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. COURSE GENERATOR AGENT                        │  │
│  │    - Genera corsi basati su system prompt       │  │
│  │    - Versione prompt tracciata                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 2. REVIEW ANALYZER AGENT                         │  │
│  │    - Confronta originale vs revisionato         │  │
│  │    - Estrae learning e pattern                   │  │
│  │    - Output: structured JSON insights            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 3. PROMPT OPTIMIZER AGENT                        │  │
│  │    - Legge learning history                      │  │
│  │    - Aggiorna system prompt                      │  │
│  │    - Crea versione incrementale                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
   ┌──────────────┐            ┌─────────────────┐
   │  Redis Cache │            │  Supabase DB    │
   │ (1h TTL)     │            │ (Persistent)    │
   └──────────────┘            └─────────────────┘
```

---

## 🔧 Componenti Principali

### 1. Review Analyzer Agent

**Responsabilità:**
- Confrontare corso originale con versione revisionata
- Identificare errori specifici e pattern
- Estrarre principi di qualità violati
- Generare insight strutturati

**System Prompt:**
```
Sei un esperto di analisi di revisioni di corsi e-learning.

Il tuo ruolo è identificare COSA è stato cambiato e PERCHÉ.

Analizza le modifiche fatte dalla revisione e identifica:

1. **Errori specifici** - cosa non era corretto nella versione originale?
2. **Pattern di miglioramento** - quali principi sono stati applicati nella revisione?
3. **Regole di qualità** - quali linee guida non erano seguite?
4. **Contesto** - in quale modulo/sezione è avvenuto l'errore?
5. **Severità** - quanto importante è questo errore?

Per ogni cambio identificato, specifica:
- La sezione interessata
- Il tipo di errore (grammatica, logica, completezza, struttura, altro)
- Il testo originale
- Il testo revisionato
- Il principio di qualità violato
- La regola che dovrebbe prevenire questo errore in futuro

Rispondi SOLO in JSON valido con questa struttura:
{
  "changes": [
    {
      "section": "Nome della sezione",
      "error_type": "grammatica|logica|completezza|struttura|contenuto|altro",
      "original": "testo originale tra 20-100 caratteri",
      "revised": "testo revisionato tra 20-100 caratteri",
      "reason": "perché questa modifica è importante",
      "principle": "quale principio di qualità è stato violato",
      "severity": "bassa|media|alta"
    }
  ],
  "patterns": ["pattern ricorrente 1", "pattern ricorrente 2"],
  "quality_rules": ["regola di qualità 1", "regola di qualità 2"],
  "overall_severity": "bassa|media|alta",
  "learning_points": ["learning 1", "learning 2", "learning 3"],
  "recommendation": "raccomandazione generale per il prompt dell'agente generatore"
}
```

**Input:**
```json
{
  "course_id": "course_123",
  "original_course": { /* struttura corso completa */ },
  "revised_course": { /* struttura corso revisionata */ }
}
```

**Output (Salvo in Supabase):**
```json
{
  "changes": [
    {
      "section": "Modulo 1 - Introduzione",
      "error_type": "completezza",
      "original": "L'intelligenza artificiale è una tecnologia",
      "revised": "L'intelligenza artificiale è una tecnologia che simula processi cognitivi umani",
      "reason": "Mancava contesto esplicativo",
      "principle": "Ogni definizione deve essere completa e contestualizzata",
      "severity": "media"
    }
  ],
  "patterns": [
    "Definizioni incomplete",
    "Mancanza di contesto storico",
    "Esempi pratici insufficienti"
  ],
  "quality_rules": [
    "Ogni concetto deve avere una definizione completa",
    "Includere esempi pratici per concetti astratti",
    "Fornire contesto storico dove rilevante"
  ],
  "overall_severity": "media",
  "learning_points": [
    "Gli studenti hanno bisogno di definizioni complete, non sommarie",
    "Gli esempi pratici devono sempre accompagnare concetti astratti",
    "Il contesto storico aiuta la comprensione"
  ],
  "recommendation": "Aggiorna il prompt per richiedere definizioni complete e sempre accompagnate da contesto e almeno un esempio pratico"
}
```

---

### 2. Prompt Optimizer Agent

**Responsabilità:**
- Leggere learning history accumulato
- Identificare pattern ricorrenti
- Aggiornare il system prompt dell'agente generatore
- Creare versione incrementale tracciabile

**System Prompt:**
```
Sei un esperto di ottimizzazione di system prompt per agenti di generazione corsi.

Il tuo compito è migliorare un system prompt basandosi su una storia di errori e learning.

INPUT:
1. Il system prompt ATTUALE dell'agente generatore
2. Una LISTA di errori ricorrenti (da ultimi 5 corsi)
3. I PRINCIPI DI QUALITÀ che sono stati violati
4. Le RACCOMANDAZIONI specifiche

OUTPUT:
Devi creare una versione MIGLIORATA del prompt che:
- Prevenga gli errori ricorrenti con istruzioni SPECIFICHE
- Applichi i nuovi principi di qualità
- Mantenga coerenza e tono generale
- Sia INCREMENTALE (aggiungi, non rifondi)

REGOLE CRITICHE:
1. Non cancellare mai istruzioni fondamentali
2. Aggiungi sezioni specifiche per prevenire gli errori identificati
3. Usa linguaggio chiaro e imperativo
4. Mantieni il tono e lo stile dell'agente
5. Sii incrementale: aggiungi una sezione "## Learning Update" che elenca i miglioramenti
6. Includi specificamente gli errori da prevenire
7. Non fare cambiamenti radicali se non necessario

STRUCTURE DI OUTPUT:
{
  "updated_prompt": "il prompt completo aggiornato (mantieni tutto + aggiungi nuove sezioni)",
  "added_sections": ["descrizione sezione aggiunta 1", "descrizione sezione aggiunta 2"],
  "modified_sections": ["descrizione modifica 1"],
  "removed_sections": [],
  "reasoning": "spiegazione del perché questi cambiamenti aiuteranno",
  "changes_summary": ["cambio 1 - motivo", "cambio 2 - motivo"],
  "rollback_instructions": "come ripristinare se qualcosa non funziona"
}
```

**Input:**
```json
{
  "current_prompt": "... system prompt attuale ...",
  "learning_history": [
    {
      "error_type": "completezza",
      "pattern": "Definizioni incomplete",
      "occurrences": 5,
      "recommendation": "Richiedere definizioni complete..."
    }
  ],
  "severity_level": "media",
  "last_n_courses": 5
}
```

**Output (Salvo in Supabase come nuova versione):**
```json
{
  "updated_prompt": "..prompt completo aggiornato..",
  "added_sections": [
    "Learning Update - Sezione che specifica i nuovi standard di qualità",
    "Error Prevention - Elenco specifico di errori da evitare"
  ],
  "modified_sections": [
    "Sezione 'Structure' - Aggiunto requirement per 'definizioni complete con contesto'"
  ],
  "removed_sections": [],
  "reasoning": "Gli ultimi 5 corsi mostrano pattern di definizioni incomplete e esempi insufficienti. Aggiungere istruzioni specifiche su come strutturare le definizioni e quando includere esempi.",
  "changes_summary": [
    "Aggiunto requirement per definizioni complete - previene errore ricorrente",
    "Aggiunto requirement per esempi con concetti astratti - aumenta chiarezza",
    "Aggiunto checklist di qualità - migliora autoconsapevolezza agente"
  ],
  "rollback_instructions": "Se le generazioni diventano troppo verbose, rimuovere la sezione 'Learning Update' e tornare a prompt_version_3"
}
```

---

## 📊 Flusso di Dati

### Trigger: Corso Revisionato

```python
# Event: corso revisionato da umano in LearnWorlds
# Payload: { course_id, original_course, revised_course, tenant_id }

async def on_course_revised(
    course_id: str,
    original_course: dict,
    revised_course: dict,
    tenant_id: str,
    generator_agent_id: str
):
    """
    Workflow completo del Learning Loop
    """
    
    # STEP 1: Analizza la revisione
    learning = await review_analyzer_agent(
        original=original_course,
        revised=revised_course
    )
    
    # STEP 2: Salva learning in Supabase
    await supabase.table("agent_learnings").insert({
        "agent_id": generator_agent_id,
        "tenant_id": tenant_id,
        "course_id": course_id,
        "analysis": learning,
        "created_at": datetime.now().isoformat()
    })
    
    # STEP 3: Verifica se aggiornare il prompt
    should_update = await check_update_conditions(
        agent_id=generator_agent_id,
        tenant_id=tenant_id
    )
    
    if should_update:
        # STEP 4: Ottimizza il prompt
        new_prompt = await optimize_prompt(
            agent_id=generator_agent_id,
            tenant_id=tenant_id,
            last_n_learnings=5
        )
        
        # STEP 5: Invalida cache e traccia
        await redis.delete(f"agent_prompt:{tenant_id}:{generator_agent_id}")
        
        # STEP 6: Inizia tracking efficacia
        await start_effectiveness_tracking(
            agent_id=generator_agent_id,
            tenant_id=tenant_id,
            prompt_version=new_version
        )
    
    return {
        "status": "success",
        "learning_extracted": len(learning["changes"]),
        "prompt_updated": should_update,
        "new_version": new_version if should_update else None
    }
```

### Condizioni per Aggiornamento Prompt

```python
async def check_update_conditions(
    agent_id: str,
    tenant_id: str
) -> bool:
    """
    Determina se è il momento di aggiornare il prompt
    """
    
    # Condizione 1: Numero minimo di learnings
    learning_count = await supabase.table("agent_learnings").select("COUNT(*)").match({
        "agent_id": agent_id,
        "tenant_id": tenant_id,
        "created_at": f"gt.{(datetime.now() - timedelta(days=7)).isoformat()}"
    }).single()
    
    if learning_count["count"] < 3:
        return False  # Aspetta almeno 3 feedback
    
    # Condizione 2: Pattern ricorrente rilevato
    patterns = await detect_recurring_patterns(agent_id, tenant_id)
    if not patterns or len(patterns) == 0:
        return False  # Nessun pattern ricorrente
    
    # Condizione 3: Tempo minimo tra aggiornamenti
    last_update = await get_last_prompt_update(agent_id, tenant_id)
    if last_update and (datetime.now() - last_update) < timedelta(days=3):
        return False  # Ultimo aggiornamento troppo recente
    
    # Condizione 4: Nessun rollback recente
    recent_rollback = await get_recent_rollback(agent_id, tenant_id, hours=24)
    if recent_rollback:
        return False  # Evita aggiornamenti dopo rollback
    
    return True  # Tutte le condizioni soddisfatte
```

---

## 🗄️ Schema Database

### Tabella: `agent_learnings`

Memorizza ogni analisi di revisione.

```sql
CREATE TABLE agent_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  
  -- Risultato dell'analisi (Review Analyzer output)
  analysis JSONB NOT NULL,  -- { changes, patterns, quality_rules, learning_points, ... }
  
  -- Metadati
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indici per performance
  UNIQUE(agent_id, course_id),
  INDEX idx_agent_tenant (agent_id, tenant_id),
  INDEX idx_created (created_at DESC)
);

-- Query comune: ultimi N learnings per agente
-- SELECT * FROM agent_learnings 
-- WHERE agent_id = $1 AND tenant_id = $2 
-- ORDER BY created_at DESC LIMIT 5;
```

### Tabella: `agent_prompts`

Versione del system prompt con storico completo.

```sql
CREATE TABLE agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  
  -- Il prompt stesso
  system_prompt TEXT NOT NULL,
  version INTEGER NOT NULL,
  
  -- Traccia della modifica
  previous_prompt_id UUID REFERENCES agent_prompts(id),
  changes_made JSONB,  -- ["cambio 1", "cambio 2"]
  reasoning TEXT,  -- Perché sono stati fatti questi cambiamenti
  
  -- Performance
  effectiveness_score FLOAT,  -- 0-100, calcolato dopo 7 giorni
  revision_rate_before FLOAT,  -- % revisioni prima di questo prompt
  revision_rate_after FLOAT,   -- % revisioni dopo di questo prompt
  
  -- Metadata
  created_by TEXT,  -- "system" | "optimizer_agent"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Indici
  INDEX idx_agent_tenant_version (agent_id, tenant_id, version DESC),
  INDEX idx_active (agent_id, is_active)
);

-- Query comune: prompt attuale per agente
-- SELECT * FROM agent_prompts 
-- WHERE agent_id = $1 AND tenant_id = $2 AND is_active = TRUE
-- ORDER BY version DESC LIMIT 1;
```

### Tabella: `agent_effectiveness_tracking`

Traccia l'impatto di ogni aggiornamento prompt.

```sql
CREATE TABLE agent_effectiveness_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  prompt_version INTEGER NOT NULL,
  
  -- Finestra di osservazione
  observation_window_days INTEGER DEFAULT 7,
  observation_start TIMESTAMP WITH TIME ZONE,
  observation_end TIMESTAMP WITH TIME ZONE,
  
  -- Metriche
  courses_generated INTEGER,
  courses_requiring_revision INTEGER,
  revision_rate FLOAT,  -- revision_required / courses_generated
  
  -- Dettagli delle revisioni
  revision_details JSONB,  -- { error_types: { "grammatica": 2, "logica": 1 }, ... }
  
  -- Comparazione
  improvement_percentage FLOAT,  -- (rate_before - rate_after) / rate_before * 100
  is_improvement BOOLEAN,
  
  -- Status
  status TEXT DEFAULT 'pending',  -- pending | completed | flagged
  flagged_reason TEXT,  -- Motivo se degradazione
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_agent_version (agent_id, prompt_version),
  INDEX idx_status (status)
);
```

### Tabella: `agent_prompt_rollbacks`

Registra tutti i rollback e i motivi.

```sql
CREATE TABLE agent_prompt_rollbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  
  from_version INTEGER NOT NULL,
  to_version INTEGER NOT NULL,
  
  reason TEXT NOT NULL,  -- "effectiveness_degradation" | "manual" | "auto"
  degradation_percentage FLOAT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  triggered_by TEXT  -- "system" | "manual"
);
```

---

## 💻 Implementazione

### Modulo 1: Review Analyzer

```python
# agents/review_analyzer.py

from anthropic import Anthropic
from typing import Optional
import json

REVIEW_ANALYZER_SYSTEM_PROMPT = """
Sei un esperto di analisi di revisioni di corsi e-learning.

Il tuo ruolo è identificare COSA è stato cambiato e PERCHÉ.

Analizza le modifiche fatte dalla revisione e identifica:

1. **Errori specifici** - cosa non era corretto nella versione originale?
2. **Pattern di miglioramento** - quali principi sono stati applicati nella revisione?
3. **Regole di qualità** - quali linee guida non erano seguite?
4. **Contesto** - in quale modulo/sezione è avvenuto l'errore?
5. **Severità** - quanto importante è questo errore?

Per ogni cambio identificato, specifica:
- La sezione interessata
- Il tipo di errore (grammatica, logica, completezza, struttura, contenuto, altro)
- Il testo originale
- Il testo revisionato
- Il principio di qualità violato
- La regola che dovrebbe prevenire questo errore in futuro

Rispondi SOLO in JSON valido con questa struttura:
{
  "changes": [
    {
      "section": "string",
      "error_type": "grammatica|logica|completezza|struttura|contenuto|altro",
      "original": "string",
      "revised": "string",
      "reason": "string",
      "principle": "string",
      "severity": "bassa|media|alta"
    }
  ],
  "patterns": ["string"],
  "quality_rules": ["string"],
  "overall_severity": "bassa|media|alta",
  "learning_points": ["string"],
  "recommendation": "string"
}
"""

class ReviewAnalyzer:
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)
    
    async def analyze_revision(
        self,
        original_course: dict,
        revised_course: dict
    ) -> dict:
        """
        Analizza le differenze tra corso originale e revisionato
        """
        
        comparison_prompt = f"""
Analizza le differenze tra questi due corsi:

CORSO ORIGINALE:
{json.dumps(original_course, ensure_ascii=False, indent=2)}

CORSO REVISIONATO:
{json.dumps(revised_course, ensure_ascii=False, indent=2)}

Identifica tutti i cambiamenti e fornisci l'analisi strutturata.
"""
        
        response = self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            system=REVIEW_ANALYZER_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": comparison_prompt}
            ]
        )
        
        # Estrai JSON dalla risposta
        response_text = response.content[0].text
        
        # Rimuovi markdown backticks se presenti
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        try:
            analysis = json.loads(response_text.strip())
            return analysis
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response from ReviewAnalyzer: {e}\nResponse: {response_text}")
```

### Modulo 2: Prompt Optimizer

```python
# agents/prompt_optimizer.py

from anthropic import Anthropic
from typing import List, Dict
import json

OPTIMIZER_SYSTEM_PROMPT = """
Sei un esperto di ottimizzazione di system prompt per agenti di generazione corsi.

Il tuo compito è migliorare un system prompt basandosi su una storia di errori e learning.

INPUT:
1. Il system prompt ATTUALE dell'agente generatore
2. Una LISTA di errori ricorrenti (da ultimi 5 corsi)
3. I PRINCIPI DI QUALITÀ che sono stati violati
4. Le RACCOMANDAZIONI specifiche

OUTPUT:
Devi creare una versione MIGLIORATA del prompt che:
- Prevenga gli errori ricorrenti con istruzioni SPECIFICHE
- Applichi i nuovi principi di qualità
- Mantenga coerenza e tono generale
- Sia INCREMENTALE (aggiungi, non rifondi)

REGOLE CRITICHE:
1. Non cancellare mai istruzioni fondamentali
2. Aggiungi sezioni specifiche per prevenire gli errori identificati
3. Usa linguaggio chiaro e imperativo
4. Mantieni il tono e lo stile dell'agente
5. Sii incrementale: aggiungi una sezione "## Learning Update" che elenca i miglioramenti
6. Includi specificamente gli errori da prevenire
7. Non fare cambiamenti radicali se non necessario

Struttura il tuo output SOLO in questo JSON format (senza markdown, senza altro testo):
{
  "updated_prompt": "il prompt completo aggiornato",
  "added_sections": ["descrizione 1", "descrizione 2"],
  "modified_sections": ["descrizione 1"],
  "removed_sections": [],
  "reasoning": "spiegazione del perché questi cambiamenti aiuteranno",
  "changes_summary": ["cambio 1 - motivo", "cambio 2 - motivo"],
  "rollback_instructions": "come ripristinare se qualcosa non funziona"
}
"""

class PromptOptimizer:
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)
    
    async def optimize_prompt(
        self,
        current_prompt: str,
        learning_history: List[Dict]
    ) -> Dict:
        """
        Ottimizza il prompt basandosi sulla history di learning
        """
        
        # Aggregazione dei learnings
        patterns = self._aggregate_patterns(learning_history)
        quality_rules = self._aggregate_quality_rules(learning_history)
        error_types = self._aggregate_error_types(learning_history)
        recommendations = self._aggregate_recommendations(learning_history)
        
        optimization_request = f"""
SISTEMA PROMPT ATTUALE:
{current_prompt}

---

STORIA DI ERRORI (ultimi 5 corsi):

PATTERN RICORRENTI:
{json.dumps(patterns, ensure_ascii=False)}

ERRORI PIÙ COMUNI:
{json.dumps(error_types, ensure_ascii=False)}

REGOLE DI QUALITÀ DA APPLICARE:
{json.dumps(quality_rules, ensure_ascii=False)}

RACCOMANDAZIONI SPECIFICHE:
{json.dumps(recommendations, ensure_ascii=False)}

---

Ora ottimizza il prompt per prevenire questi errori in futuro.
Mantieni la struttura generale, aggiungi sezioni specifiche dove necessario.
Rispondi SOLO con JSON valido, niente altro.
"""
        
        response = self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=3000,
            system=OPTIMIZER_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": optimization_request}
            ]
        )
        
        response_text = response.content[0].text
        
        # Rimuovi markdown backticks se presenti
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        try:
            optimization = json.loads(response_text.strip())
            return optimization
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response from PromptOptimizer: {e}")
    
    def _aggregate_patterns(self, learning_history: List[Dict]) -> Dict:
        """Aggrega i pattern ricorrenti"""
        pattern_count = {}
        for learning in learning_history:
            for pattern in learning.get("analysis", {}).get("patterns", []):
                pattern_count[pattern] = pattern_count.get(pattern, 0) + 1
        
        # Ordina per frequenza
        return {
            pattern: count 
            for pattern, count in sorted(pattern_count.items(), key=lambda x: x[1], reverse=True)
        }
    
    def _aggregate_quality_rules(self, learning_history: List[Dict]) -> List[str]:
        """Aggrega le regole di qualità"""
        rules = set()
        for learning in learning_history:
            rules.update(learning.get("analysis", {}).get("quality_rules", []))
        return list(rules)
    
    def _aggregate_error_types(self, learning_history: List[Dict]) -> Dict:
        """Aggrega i tipi di errore"""
        error_count = {}
        for learning in learning_history:
            for change in learning.get("analysis", {}).get("changes", []):
                error_type = change.get("error_type", "unknown")
                error_count[error_type] = error_count.get(error_type, 0) + 1
        
        return {
            error_type: count
            for error_type, count in sorted(error_count.items(), key=lambda x: x[1], reverse=True)
        }
    
    def _aggregate_recommendations(self, learning_history: List[Dict]) -> List[str]:
        """Aggrega le raccomandazioni"""
        recommendations = []
        for learning in learning_history:
            rec = learning.get("analysis", {}).get("recommendation")
            if rec and rec not in recommendations:
                recommendations.append(rec)
        return recommendations
```

### Modulo 3: Learning Loop Orchestrator

```python
# agents/learning_loop.py

from datetime import datetime, timedelta
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class LearningLoopOrchestrator:
    def __init__(self, supabase_client, redis_client, review_analyzer, prompt_optimizer):
        self.db = supabase_client
        self.cache = redis_client
        self.analyzer = review_analyzer
        self.optimizer = prompt_optimizer
    
    async def on_course_revised(
        self,
        course_id: str,
        original_course: dict,
        revised_course: dict,
        tenant_id: str,
        generator_agent_id: str
    ) -> dict:
        """
        Main entry point per il Learning Loop
        Triggered quando un corso viene revisionato
        """
        
        try:
            logger.info(f"Starting Learning Loop for course {course_id}")
            
            # STEP 1: Analizza la revisione
            learning = await self.analyzer.analyze_revision(
                original_course, 
                revised_course
            )
            logger.debug(f"Analysis complete: {len(learning['changes'])} changes found")
            
            # STEP 2: Salva learning in Supabase
            await self.db.table("agent_learnings").insert({
                "agent_id": generator_agent_id,
                "tenant_id": tenant_id,
                "course_id": course_id,
                "analysis": learning,
                "created_at": datetime.now().isoformat()
            })
            
            # STEP 3: Verifica se aggiornare il prompt
            should_update = await self._check_update_conditions(
                generator_agent_id,
                tenant_id
            )
            
            new_version = None
            if should_update:
                logger.info("Update conditions met, optimizing prompt...")
                
                # STEP 4: Ottimizza il prompt
                new_version = await self._update_prompt(
                    generator_agent_id,
                    tenant_id
                )
                
                # STEP 5: Invalida cache
                cache_key = f"agent_prompt:{tenant_id}:{generator_agent_id}"
                await self.cache.delete(cache_key)
                logger.info(f"Cache invalidated for {cache_key}")
                
                # STEP 6: Inizia tracking efficacia
                await self._start_effectiveness_tracking(
                    generator_agent_id,
                    tenant_id,
                    new_version
                )
            
            return {
                "status": "success",
                "learning_extracted": len(learning["changes"]),
                "prompt_updated": should_update,
                "new_version": new_version,
                "patterns_found": len(learning["patterns"])
            }
        
        except Exception as e:
            logger.error(f"Error in Learning Loop: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def _check_update_conditions(
        self,
        agent_id: str,
        tenant_id: str
    ) -> bool:
        """
        Determina se è il momento di aggiornare il prompt
        """
        
        # Condizione 1: Numero minimo di learnings (ultimi 7 giorni)
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        
        response = await self.db.table("agent_learnings").select("count").match({
            "agent_id": agent_id,
            "tenant_id": tenant_id
        }).gte("created_at", seven_days_ago)
        
        learning_count = len(response.data) if response.data else 0
        
        if learning_count < 3:
            logger.debug(f"Not enough learnings yet: {learning_count}/3")
            return False
        
        # Condizione 2: Tempo minimo tra aggiornamenti (3 giorni)
        last_prompt = await self._get_last_prompt_update(agent_id, tenant_id)
        if last_prompt:
            time_since_update = datetime.now() - datetime.fromisoformat(last_prompt["created_at"])
            if time_since_update < timedelta(days=3):
                logger.debug(f"Last update too recent: {time_since_update.days} days ago")
                return False
        
        # Condizione 3: Nessun rollback nelle ultime 24 ore
        recent_rollback = await self._get_recent_rollback(agent_id, tenant_id, hours=24)
        if recent_rollback:
            logger.debug("Recent rollback detected, skipping update")
            return False
        
        logger.info("All conditions met for prompt update")
        return True
    
    async def _update_prompt(
        self,
        agent_id: str,
        tenant_id: str
    ) -> int:
        """
        Aggiorna il prompt basandosi sulla learning history
        Restituisce la nuova versione
        """
        
        # Ottieni il prompt attuale
        current_prompt_data = await self._get_current_prompt(agent_id, tenant_id)
        current_prompt = current_prompt_data["system_prompt"]
        current_version = current_prompt_data["version"]
        
        # Ottieni ultimi learnings
        learning_history = await self._get_recent_learnings(agent_id, tenant_id, last_n=5)
        
        # Ottimizza il prompt
        optimization = await self.optimizer.optimize_prompt(
            current_prompt,
            learning_history
        )
        
        # Salva la nuova versione
        new_version = current_version + 1
        
        await self.db.table("agent_prompts").insert({
            "agent_id": agent_id,
            "tenant_id": tenant_id,
            "system_prompt": optimization["updated_prompt"],
            "version": new_version,
            "previous_prompt_id": current_prompt_data["id"],
            "changes_made": optimization["changes_summary"],
            "reasoning": optimization["reasoning"],
            "effectiveness_score": None,
            "revision_rate_before": None,
            "created_by": "optimizer_agent",
            "created_at": datetime.now().isoformat(),
            "is_active": True
        })
        
        # Disattiva la versione precedente
        await self.db.table("agent_prompts").update({"is_active": False}).match({
            "agent_id": agent_id,
            "tenant_id": tenant_id,
            "version": current_version
        })
        
        logger.info(f"Prompt updated from v{current_version} to v{new_version}")
        return new_version
    
    async def _start_effectiveness_tracking(
        self,
        agent_id: str,
        tenant_id: str,
        prompt_version: int
    ):
        """
        Inizia il tracking dell'efficacia del nuovo prompt
        """
        
        now = datetime.now()
        end_window = now + timedelta(days=7)
        
        await self.db.table("agent_effectiveness_tracking").insert({
            "agent_id": agent_id,
            "tenant_id": tenant_id,
            "prompt_version": prompt_version,
            "observation_window_days": 7,
            "observation_start": now.isoformat(),
            "observation_end": end_window.isoformat(),
            "status": "pending",
            "created_at": now.isoformat()
        })
        
        logger.info(f"Effectiveness tracking started for v{prompt_version}")
    
    async def _get_current_prompt(self, agent_id: str, tenant_id: str) -> dict:
        """Ottiene il prompt attualmente attivo"""
        response = await self.db.table("agent_prompts").select("*").match({
            "agent_id": agent_id,
            "tenant_id": tenant_id,
            "is_active": True
        }).order("version", desc=True).limit(1)
        
        return response.data[0] if response.data else None
    
    async def _get_last_prompt_update(self, agent_id: str, tenant_id: str) -> Optional[dict]:
        """Ottiene l'ultimo aggiornamento del prompt"""
        response = await self.db.table("agent_prompts").select("*").match({
            "agent_id": agent_id,
            "tenant_id": tenant_id
        }).order("created_at", desc=True).limit(1)
        
        return response.data[0] if response.data else None
    
    async def _get_recent_learnings(self, agent_id: str, tenant_id: str, last_n: int = 5) -> list:
        """Ottiene gli ultimi N learnings"""
        response = await self.db.table("agent_learnings").select("*").match({
            "agent_id": agent_id,
            "tenant_id": tenant_id
        }).order("created_at", desc=True).limit(last_n)
        
        return response.data if response.data else []
    
    async def _get_recent_rollback(self, agent_id: str, tenant_id: str, hours: int = 24) -> Optional[dict]:
        """Verifica se c'è stato un rollback recente"""
        cutoff = (datetime.now() - timedelta(hours=hours)).isoformat()
        response = await self.db.table("agent_prompt_rollbacks").select("*").match({
            "agent_id": agent_id,
            "tenant_id": tenant_id
        }).gte("created_at", cutoff).limit(1)
        
        return response.data[0] if response.data else None
```

---

## 🛡️ Protezioni e Safeguard

### 1. Protezione da Prompt Degradation

```python
async def check_effectiveness_and_rollback(
    agent_id: str,
    tenant_id: str,
    prompt_version: int,
    degradation_threshold: float = 0.95  # 5% degradazione = rollback
):
    """
    Controlla se il prompt ha degradato e esegue rollback se necessario
    """
    
    # Recupera il tracking
    tracking = await db.table("agent_effectiveness_tracking").select("*").match({
        "agent_id": agent_id,
        "tenant_id": tenant_id,
        "prompt_version": prompt_version
    }).single()
    
    if not tracking:
        return None
    
    revision_rate_after = tracking["revision_rate"]
    revision_rate_before = tracking["revision_rate_before"]
    
    # Calcola il degradation
    if revision_rate_before > 0:
        degradation_ratio = revision_rate_after / revision_rate_before
        
        if degradation_ratio > degradation_threshold:
            # Degradation detected - esegui rollback
            logger.warning(f"Degradation detected: {degradation_ratio:.2f}x worse")
            
            await rollback_to_previous_prompt(
                agent_id=agent_id,
                tenant_id=tenant_id,
                current_version=prompt_version,
                reason="effectiveness_degradation",
                degradation_percentage=(degradation_ratio - 1) * 100
            )
            
            return {
                "status": "rollback_executed",
                "degradation": degradation_ratio
            }
    
    return {
        "status": "no_degradation",
        "improvement": (1 - degradation_ratio) * 100 if revision_rate_before > 0 else 0
    }
```

### 2. Protezione da Update Loop Infinito

```python
async def prevent_update_loop(
    agent_id: str,
    tenant_id: str,
    max_updates_per_week: int = 2
) -> bool:
    """
    Previene troppi aggiornamenti nello stesso periodo
    """
    
    one_week_ago = (datetime.now() - timedelta(days=7)).isoformat()
    
    response = await db.table("agent_prompts").select("count").match({
        "agent_id": agent_id,
        "tenant_id": tenant_id,
        "created_by": "optimizer_agent"
    }).gte("created_at", one_week_ago)
    
    updates_this_week = len(response.data) if response.data else 0
    
    if updates_this_week >= max_updates_per_week:
        logger.warning(f"Too many updates this week: {updates_this_week}/{max_updates_per_week}")
        return False
    
    return True
```

### 3. Validazione del Prompt Ottimizzato

```python
def validate_optimized_prompt(
    original_prompt: str,
    optimized_prompt: str
) -> Tuple[bool, List[str]]:
    """
    Valida che il prompt ottimizzato sia sano
    """
    
    issues = []
    
    # Check 1: Non deve essere significativamente più corto/lungo
    original_len = len(original_prompt)
    optimized_len = len(optimized_prompt)
    ratio = optimized_len / original_len if original_len > 0 else 0
    
    if ratio < 0.5 or ratio > 3:
        issues.append(f"Length change too extreme: {ratio:.2f}x")
    
    # Check 2: Deve contenere almeno alcune istruzioni fondamentali
    fundamental_keywords = ["modulo", "struttura", "qualità", "learning"]
    found_keywords = sum(1 for kw in fundamental_keywords if kw.lower() in optimized_prompt.lower())
    
    if found_keywords < 2:
        issues.append("Missing fundamental keywords")
    
    # Check 3: Non deve avere pattern sospetti
    if "```" in optimized_prompt and optimized_prompt.count("```") % 2 != 0:
        issues.append("Malformed code blocks")
    
    return len(issues) == 0, issues
```

---

## 📊 Metriche e Tracking

### KPI Principali

```python
class LearningLoopMetrics:
    """
    Metriche per monitorare la salute del Learning Loop
    """
    
    async def get_agent_effectiveness(
        self,
        agent_id: str,
        tenant_id: str,
        window_days: int = 30
    ) -> dict:
        """
        Metriche di efficacia dell'agente nel tempo
        """
        
        cutoff = (datetime.now() - timedelta(days=window_days)).isoformat()
        
        # Ottieni tutti i corsi generati in questo periodo
        courses = await db.table("courses").select("*").match({
            "generator_agent_id": agent_id,
            "tenant_id": tenant_id
        }).gte("created_at", cutoff)
        
        # Calcola le metriche
        total_courses = len(courses.data)
        courses_requiring_revision = sum(
            1 for course in courses.data 
            if course.get("requires_revision", False)
        )
        
        revision_rate = courses_requiring_revision / total_courses if total_courses > 0 else 0
        
        return {
            "total_courses": total_courses,
            "revision_required": courses_requiring_revision,
            "revision_rate": revision_rate,
            "quality_score": 1 - revision_rate
        }
    
    async def get_prompt_version_comparison(
        self,
        agent_id: str,
        tenant_id: str,
        version1: int,
        version2: int
    ) -> dict:
        """
        Confronta due versioni di prompt in termini di efficacia
        """
        
        # Ottieni tracking per entrambe le versioni
        tracking1 = await db.table("agent_effectiveness_tracking").select("*").match({
            "agent_id": agent_id,
            "tenant_id": tenant_id,
            "prompt_version": version1
        }).single()
        
        tracking2 = await db.table("agent_effectiveness_tracking").select("*").match({
            "agent_id": agent_id,
            "tenant_id": tenant_id,
            "prompt_version": version2
        }).single()
        
        return {
            "version_1": {
                "revision_rate": tracking1["revision_rate"] if tracking1 else None,
                "courses_generated": tracking1["courses_generated"] if tracking1 else None
            },
            "version_2": {
                "revision_rate": tracking2["revision_rate"] if tracking2 else None,
                "courses_generated": tracking2["courses_generated"] if tracking2 else None
            },
            "improvement": {
                "rate_change_percentage": (
                    (tracking1["revision_rate"] - tracking2["revision_rate"]) / tracking1["revision_rate"] * 100
                ) if tracking1 and tracking1["revision_rate"] > 0 else None
            }
        }
    
    async def get_learning_patterns(
        self,
        agent_id: str,
        tenant_id: str,
        last_n: int = 20
    ) -> dict:
        """
        Analizza i pattern di learning nel tempo
        """
        
        learnings = await db.table("agent_learnings").select("*").match({
            "agent_id": agent_id,
            "tenant_id": tenant_id
        }).order("created_at", desc=True).limit(last_n)
        
        # Aggrega i pattern
        all_patterns = {}
        all_error_types = {}
        
        for learning in learnings.data:
            analysis = learning["analysis"]
            
            # Patterns
            for pattern in analysis.get("patterns", []):
                all_patterns[pattern] = all_patterns.get(pattern, 0) + 1
            
            # Error types
            for change in analysis.get("changes", []):
                error_type = change.get("error_type", "unknown")
                all_error_types[error_type] = all_error_types.get(error_type, 0) + 1
        
        return {
            "top_patterns": sorted(
                all_patterns.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10],
            "error_distribution": all_error_types,
            "total_learnings_analyzed": len(learnings.data)
        }
```

### Dashboard Queries

```sql
-- Query 1: Trend di revision rate per agente
SELECT 
    DATE(created_at) as date,
    agent_id,
    ROUND(AVG(revision_rate), 3) as avg_revision_rate,
    COUNT(*) as observation_count
FROM agent_effectiveness_tracking
WHERE agent_id = $1 AND tenant_id = $2
GROUP BY DATE(created_at), agent_id
ORDER BY date DESC;

-- Query 2: Prompt versions con loro effectiveness
SELECT 
    ap.version,
    ap.created_at,
    ap.changes_made,
    COALESCE(aet.revision_rate, 'pending') as effectiveness,
    COALESCE(aet.is_improvement, NULL) as is_improvement
FROM agent_prompts ap
LEFT JOIN agent_effectiveness_tracking aet 
    ON ap.agent_id = aet.agent_id 
    AND ap.tenant_id = aet.tenant_id 
    AND ap.version = aet.prompt_version
WHERE ap.agent_id = $1 AND ap.tenant_id = $2
ORDER BY ap.version DESC;

-- Query 3: Pattern ricorrenti negli ultimi 30 giorni
WITH recent_learnings AS (
    SELECT 
        analysis->'patterns' as patterns
    FROM agent_learnings
    WHERE agent_id = $1 
        AND tenant_id = $2
        AND created_at > NOW() - INTERVAL '30 days'
)
SELECT 
    jsonb_array_elements(patterns) as pattern,
    COUNT(*) as occurrences
FROM recent_learnings
GROUP BY pattern
ORDER BY occurrences DESC;
```

---

## 🔍 Troubleshooting

### Scenario 1: Prompt che degrada

```
Sintomo: Dopo un aggiornamento, il revision rate aumenta
Causa possibile: Il prompt optimizer ha aggiunto istruzioni conflittuali
Soluzione:
1. Verifica il `reasoning` della versione nel DB
2. Confronta il testo del prompt vecchio vs nuovo
3. Esegui rollback manuale: UPDATE agent_prompts SET is_active = FALSE WHERE version = X
4. Analizza quale sezione ha causato il problema
5. Aggiungi guardrail più specifici
```

### Scenario 2: Learning Loop non attiva mai

```
Sintomo: I learnings vengono salvati ma il prompt non si aggiorna mai
Causa possibile: Le condizioni di aggiornamento sono troppo stringenti
Soluzione:
1. Verifica: SELECT * FROM agent_learnings WHERE agent_id = ? ORDER BY created_at DESC LIMIT 5;
2. Conta il numero di learnings: SELECT COUNT(*) FROM agent_learnings WHERE agent_id = ?
3. Verifica l'ultima update: SELECT * FROM agent_prompts WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1;
4. Se < 3 learnings: aspetta altri corsi revisionati
5. Se > 3 learnings ma no update: verifica se c'è un rollback recente
```

### Scenario 3: Cache invalidation non funziona

```
Sintomo: L'agente continua a usare il vecchio prompt anche dopo l'update
Causa possibile: Redis cache non è stato invalidato correttamente
Soluzione:
1. Manualmente invalida: REDIS DEL agent_prompt:{tenant_id}:{agent_id}
2. Verifica che il nuovo prompt sia in Supabase: SELECT * FROM agent_prompts WHERE agent_id = ? AND is_active = TRUE
3. Forza reload della cache dalla app
4. Verifica che la cache key sia corretta
```

### Scenario 4: JSON parsing errors dal LLM

```
Sintomo: ReviewAnalyzer o PromptOptimizer fallisce con JSONDecodeError
Causa possibile: Il response non è JSON valido
Soluzione:
1. Aggiungi retry logic con exponential backoff
2. Aumenta max_tokens nel Claude API call
3. Aggiungi strict JSON schema validation
4. Se il LLM continua a fallire, verifica il system prompt
5. Prova con un prompt più semplice in test mode
```

---

## 📝 Checklist di Implementazione

- [ ] Schema Supabase creato (`agent_learnings`, `agent_prompts`, `agent_effectiveness_tracking`, `agent_prompt_rollbacks`)
- [ ] ReviewAnalyzer agent implementato
- [ ] PromptOptimizer agent implementato
- [ ] LearningLoopOrchestrator implementato
- [ ] Webhook per "course_revised" evento configurato
- [ ] Redis cache setup con TTL
- [ ] Metriche dashboard SQL queries testate
- [ ] Protezioni da degradation implementate
- [ ] Logging e monitoring setup
- [ ] Testing con corsi veri
- [ ] Rollback procedure documentata e testata
- [ ] Dashboard analytics creato

---

## 📚 Referenze Utili

- **Supabase Docs**: https://supabase.com/docs
- **Claude API**: https://docs.anthropic.com/
- **Learning Loop Paper**: Implement feedback loops in AI systems
- **Prompt Engineering**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering

---

**Versione documento**: 1.0  
**Ultima modifica**: 2026-06-17  
**Prossimo review**: 2026-07-01
