# 🐦 Nido di Agenti — Guida Claude Code Collaborativa

**Per**: Davide e Collega  
**Tool**: Claude Code (due istanze)  
**Repository**: `nido-di-agenti` su GitHub  
**Objetivo**: Lavorare assieme SENZA conflitti

---

## 📋 Pre-requisiti

- [ ] Repository GitHub clonato in locale (entrambi)
- [ ] Git configurato:
  ```bash
  git config --global user.name "Nome"
  git config --global user.email "email@example.com"
  ```
- [ ] Struttura cartella:
  ```
  nido-di-agenti/
  ├── src/
  │   ├── broker/        (Agent Broker)
  │   ├── queue/         (BullMQ Manager)
  │   ├── orchestration/ (Sub-agent Orchestration)
  │   └── auth/          (Supabase Auth)
  ├── tests/
  ├── docs/
  ├── COLLABORATION_CLAUDE.md (questo file)
  ├── .gitignore
  └── README.md
  ```

---

## 🚀 Flusso: Come iniziare una task in Claude Code

### Passo 1: Aggiorna il repo (SEMPRE)

```bash
git checkout main
git pull origin main
```

**Perché**: Assicurati di avere l'ultimo codice del collega mergiato.

---

### Passo 2: Crea un feature branch

```bash
git checkout -b feature/[descrizione-chiara]
```

**Esempi**:
- `feature/agent-broker-router`
- `feature/queue-manager-implementation`
- `feature/supabase-auth-setup`
- `feature/circuit-breaker-logic`

**Regola**: Il nome del branch deve dire ESATTAMENTE quello che farai.

---

### Passo 3: Comunica all'altro

**Scrivi un messaggio:**

> "Sto creando il feature branch `feature/agent-broker-router`. Finirò entro mercoledì. Non toccare `src/broker/router.py` fino ad allora."

---

### Passo 4: Lavora normalmente in Claude Code

Modifica i file in Claude Code come al solito. Tutto è locale, non tocchi il collega.

```
Claude Code editor → Modifica file → Salva
(Il collega non vede niente finché non pushEI)
```

---

### Passo 5: Commit FREQUENTI

**Ogni 1-2 ore** (o quando finisci una sotto-task), fai un commit:

```bash
git add .
git commit -m "Agent Broker: implementato Router con priority queue"
```

**Regole commit:**
- ✅ Descrizione **CHIARA** in italiano
- ✅ Cosa HAI FATTO (non "fix" o "update")
- ✅ Se risolvi un bug, scrivi: `Bugfix: [cosa]`
- ✅ Se aggiungi feature, scrivi: `Feature: [cosa]`

**Esempi BUONI:**
```
Agent Broker: aggiunto retry logic per timeout
Queue Manager: implementato BullMQ async processor
Auth: setup Supabase RLS per tenant isolation
Circuit Breaker: aggiunto health check endpoint
```

**Esempi CATTIVI:**
```
fix
update
changes
wip (work in progress)
```

---

### Passo 6: Push regolarmente

```bash
git push origin feature/[il-tuo-branch]
```

**Perché**: Se il collega deve lavorare, vede il tuo lavoro su GitHub. Se il PC crasha, non perdi nulla.

---

### Passo 7: Quando FINISCI la task

1. **Commit finale**:
   ```bash
   git add .
   git commit -m "Agent Broker: completato Router e Priority Engine"
   ```

2. **Push finale**:
   ```bash
   git push origin feature/[il-tuo-branch]
   ```

3. **Vai su GitHub** e crea una **Pull Request**:
   - Titolo: `Agent Broker: Router + Priority Engine implementation`
   - Descrizione (copia questo template):
   ```markdown
   ## Cosa ho implementato
   - Router core logic
   - Priority Engine
   - Retry mechanism
   
   ## File modificati
   - src/broker/router.py
   - src/broker/priority_engine.py
   - tests/test_broker.py
   
   ## Test
   - [x] Test unitari passano
   - [x] Testato localmente
   - [x] No errori console
   
   ## Note
   - Dipende da [#issue-numero] se c'è
   - Il collega deve pullare main dopo merge
   ```

4. **Aspetta l'approvazione** del collega (code review)

5. **Merge su GitHub**: Clicca "Merge pull request" → "Squash and merge"

6. **Entrambi fate pull**:
   ```bash
   git checkout main
   git pull origin main
   ```

---

## 🔄 Se il collega finisce una task (Tu ricevi il codice)

```bash
# Scarica il codice mergiato
git checkout main
git pull origin main

# Adesso hai il codice del collega
# Continua il tuo lavoro normalmente
```

---

## ⚠️ Se succede un CONFLITTO

**Scenario:**
- Tu e il collega modificate lo stesso file
- Uno di voi prova a fare merge → **CONFLITTO**

**Come risolvere:**

1. **Chi pushEI per secondo** vede l'errore:
   ```
   error: failed to push some refs to 'origin'
   hint: Updates were rejected because the tip of your current branch is behind
   ```

2. **Fai pull del branch**:
   ```bash
   git pull origin feature/[il-tuo-branch]
   ```

3. **Git ti mostra il conflitto** (se non riusciva a mergiare automaticamente):
   ```
   <<<<<<< HEAD
   il tuo codice
   =======
   il codice del collega
   >>>>>>> origin/feature/...
   ```

4. **Apri il file in VS Code** e scegli manualmente cosa tenere:
   - Clicca su "Accept Current Change" (il tuo)
   - Oppure "Accept Incoming Change" (del collega)
   - Oppure "Accept Both Changes" (entrambi)
   - Oppure **mescola manualmente** il codice

5. **Commit il merge**:
   ```bash
   git add .
   git commit -m "Merge: risolti conflitti con branch router"
   git push origin feature/[il-tuo-branch]
   ```

6. **La PR su GitHub si aggiorna automaticamente**

---

## 🎯 Come EVITARE conflitti (IMPORTANTE)

### ✅ DIVIDETE I FILE

```
Davide:
- src/broker/router.py
- src/broker/priority_engine.py

Collega:
- src/queue/manager.py
- src/queue/processor.py
```

**Non toccate il file dell'altro finché non mergia a main.**

### ✅ BRANCH SEPARATI

Ogni task = un branch diverso. Se Davide fa `feature/router` e il collega fa `feature/queue-manager`, non ci sono conflitti.

### ✅ PULL SPESSO

```bash
# Ogni mattina
git pull origin main
```

Se il collega ha mergiato ieri, tu hai il suo codice oggi.

### ✅ COMMUNICATE

Prima di toccare un file: 
> "Sto modificando X fino a giovedì"

---

## 📊 Tabella: Chi sta facendo cosa

**AGGIORNA QUESTO** all'inizio di ogni task:

| Task | Owner | Branch | Stato | Fine prevista |
|------|-------|--------|-------|---------------|
| Agent Broker: Router | Davide | `feature/agent-broker-router` | In progress | 19/06 |
| Queue Manager | Collega | `feature/queue-manager` | In progress | 20/06 |
| Orchestration | — | — | Not started | — |
| Auth Supabase | — | — | Not started | — |
| Circuit Breaker | — | — | Not started | — |

---

## 🛠️ Comandi rapidi (copia-incolla)

```bash
# Inizio giorno
git checkout main && git pull origin main

# Creare un feature branch
git checkout -b feature/mio-task

# Commit
git add . && git commit -m "Descrizione chiara"

# Push
git push origin feature/mio-task

# Aggiornare il mio branch se il collega mergiato
git pull origin main

# Vedere lo stato
git status

# Vedere i branch
git branch -a

# Annullare l'ultimo commit (oops!)
git reset --soft HEAD~1
```

---

## 📱 Checklist giornaliera (leggila ogni mattina)

- [ ] Ho fatto `git pull origin main`?
- [ ] Sto sul mio feature branch (`git branch` me lo dice)?
- [ ] Il nome del branch è chiaro e descrive il task?
- [ ] Ho comunicato al collega che sto lavorando su X?
- [ ] Ho fatto commit ogni 1-2 ore?
- [ ] Ho pushato il mio branch su GitHub?
- [ ] Ho aggiornato la tabella "Chi sta facendo cosa" qui sopra?

---

## 🚨 Aiuto! Qualcosa è andato storto

### Caso 1: Ho fatto un commit sbagliato
```bash
git reset --soft HEAD~1
# Sistema il codice
git add .
git commit -m "Messaggio corretto"
```

### Caso 2: Ho modificato il file sbagliato
```bash
git checkout -- [file-sbagliato.py]
# Torni alla versione precedente (perdi le modifiche)
```

### Caso 3: Il mio branch è dietro di molti commit
```bash
git pull origin main
# Aggiorna il tuo branch con main
```

### Caso 4: Voglio cancellare un branch locale (pulire)
```bash
git branch -D feature/branch-vecchio
```

---

## 💡 Tips finali

1. **Commit spesso, push spesso** — Non tenere codice locale per ore
2. **Feature branch = feature piccola** — Se il task è grande, dividilo in 2-3 branch
3. **Pull ogni mattina** — Assicurati di avere l'ultimo codice
4. **Comunica sempre** — Una riga su chat: "Sto facendo X"
5. **Code review** — Leggi il codice dell'altro prima di mergiare, impari cose nuove
6. **Main deve essere stabile** — Se qualcosa non funziona, NON mergiare a main

---

## 📞 Domande ricorrenti

**D: Posso modificare il file del collega?**  
R: Solo se ha finito e mergiato a main. Se il file è in un feature branch suo, aspetta.

**D: Quante volte faccio commit?**  
R: Ogni volta che finisci una sotto-task logica. Almeno ogni 1-2 ore.

**D: Cosa faccio se ho conflitti?**  
R: Vedi sezione "⚠️ Se succede un CONFLITTO" qui sopra.

**D: Posso fare push a main direttamente?**  
R: **NO**. Sempre: branch → commit → push → Pull Request → code review → merge.

**D: E se il collega è offline?**  
R: Niente problema. Tu fai il tuo lavoro, lui dopo fa pull e ha il tuo codice.

---

## 📚 Riassunto in 10 secondi

```
1. git checkout -b feature/task
2. Lavora in Claude Code (salva normalmente)
3. git commit -m "Descrizione"
4. git push origin feature/task
5. Crea Pull Request su GitHub
6. Collega revisa
7. Merge su main
8. Entrambi: git pull origin main
9. Repeat
```

---

**Ultima modifica**: 17/06/2026  
**Scritto per**: Davide + Collega  
**Version**: 1.0
