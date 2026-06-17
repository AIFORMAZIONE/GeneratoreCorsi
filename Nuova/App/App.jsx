import { useState, useEffect, useRef, useCallback } from "react";

// ─── Costanti Supabase ─────────────────────────────────────────────
const SUPABASE_URL = "https://zdvzxkzdkazewotiivxw.supabase.co";
// Fase 2: la generazione passa dalla Edge Function (la chiave Anthropic resta server-side)
const GENERA_FN_URL = `${SUPABASE_URL}/functions/v1/genera-lezione`;
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkdnp4a3pka2F6ZXdvdGlpdnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDI2NjgsImV4cCI6MjA5NDIxODY2OH0.VtYaMrGBD-zl7W5BCJ_a3U8mkxQQ9UJB_SBnRDJQOt8";

// Fase 3: token utente impostato dopo il login. Finche' e' null si usa la anon key.
let AUTH_TOKEN = null;
function setAuthToken(t) { AUTH_TOKEN = t; }

// FIX #1: helper centralizzato con gestione 204 No Content
async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${AUTH_TOKEN || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Prompt v5 default ────────────────────────────────────────────
const PROMPT_DEFAULT = `Sei un esperto di formazione sulla sicurezza sul lavoro ai sensi del D.Lgs. 81/08.
Genera la lezione {{NUMERO_LEZIONE}} dal titolo "{{TITOLO_LEZIONE}}" per il corso "{{TITOLO_CORSO}}" destinato a: {{DESTINATARI}}.

MATERIALE DI RIFERIMENTO:
{{CHUNKS_KB}}

ARTICOLI D.LGS. PERTINENTI:
{{ARTICOLI_DLGS}}

STRUTTURA OBBLIGATORIA (rispetta esattamente questo formato):

## Introduzione
[almeno 5-7 frasi discorsive che introducono l'argomento]

## In questa lezione apprenderai:
- [obiettivo 1 con verbo infinito]
- [obiettivo 2 con verbo infinito]
- [obiettivo 3 con verbo infinito]
- [obiettivo 4 con verbo infinito]

## 💡 Pillola informativa
[massima memorabile, max 20 parole]

## Sezione 1 — [titolo]
[almeno 8 frasi discorsive, cita articoli D.Lgs. sviluppando i comma centrali]

## Sezione 2 — [titolo]
[almeno 8 frasi discorsive]

## Sezione 3 — [titolo]
[almeno 8 frasi discorsive]

## Sezione 4 — [titolo]
[almeno 8 frasi discorsive]

[Sezione 5 e 6 opzionali se il contenuto lo richiede]

## Casi pratici e spunti di riflessione

### 🔍 Esempio pratico 1
[caso concreto aziendale, 3-4 frasi]

### 💭 Domanda di riflessione 1
[domanda aperta, senza risposta]

### 🔍 Esempio pratico 2
[caso concreto aziendale, 3-4 frasi]

### 💭 Domanda di riflessione 2
[domanda aperta, senza risposta]

## Riepilogo
[almeno 4 frasi che sintetizzano i punti chiave]

## ❓ Domanda di verifica
[domanda con 4 risposte A/B/C/D, indica la risposta corretta]

REGOLE:
- Target: 1.400-1.900 parole totali
- Niente elenchi puntati nelle sezioni narrative (solo per elementi normativi enumerabili)
- Per figure SSL (datore, RSPP, MC, RLS): paragrafo autonomo di 8-10 frasi per ciascuna
- Sviluppa gli articoli D.Lgs. centrali comma per comma
- Tono professionale ma accessibile`;

// ─── Design tokens ────────────────────────────────────────────────
const T = {
  font: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  bg: "#F7F8FA",
  white: "#FFFFFF",
  border: "#E8E8EC",
  borderLight: "#F0F0F4",
  text: "#16181D",
  textSub: "#6B6F7A",
  textMuted: "#A0A4AD",
  blue: "#2563EB",
  blueSoft: "#EFF4FF",
  blueBorder: "#BFCFFF",
  green: "#16A34A",
  greenSoft: "#F0FDF4",
  greenBorder: "#86EFAC",
  amber: "#D97706",
  amberSoft: "#FFFBEB",
  amberBorder: "#FCD34D",
  red: "#DC2626",
  redSoft: "#FEF2F2",
  redBorder: "#FECACA",
  purple: "#7C3AED",
  purpleSoft: "#F5F3FF",
  purpleBorder: "#C4B5FD",
  radius: "10px",
  radiusSm: "6px",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.08)",
};

// ─── Componenti UI base ────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: T.white, borderRadius: T.radius,
      border: `1px solid ${T.border}`, padding: 24, marginBottom: 16,
      boxShadow: T.shadow, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, style }) {
  return (
    <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: T.textSub,
      letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: "100%", padding: "10px 14px", borderRadius: T.radiusSm,
        border: `1px solid ${T.border}`, fontSize: 14, outline: "none",
        boxSizing: "border-box", background: "#FAFBFC", color: T.text,
        transition: "border-color 0.15s", fontFamily: T.font, ...style,
      }}
      onFocus={e => e.target.style.borderColor = T.blue}
      onBlur={e => e.target.style.borderColor = T.border}
      {...props}
    />
  );
}

function Btn({ children, variant = "primary", onClick, disabled, style }) {
  const variants = {
    primary: { bg: T.blue, color: "#fff", border: "none" },
    success: { bg: T.green, color: "#fff", border: "none" },
    danger:  { bg: T.red,  color: "#fff", border: "none" },
    ghost:   { bg: T.white, color: T.textSub, border: `1px solid ${T.border}` },
    ghostBlue: { bg: T.blueSoft, color: T.blue, border: `1px solid ${T.blueBorder}` },
    ghostRed: { bg: T.redSoft, color: T.red, border: `1px solid ${T.redBorder}` },
    ghostGreen: { bg: T.greenSoft, color: T.green, border: `1px solid ${T.greenBorder}` },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 22px", borderRadius: T.radiusSm,
        fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1, fontFamily: T.font,
        transition: "opacity 0.15s, transform 0.1s",
        ...v, ...style,
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = "0.88")}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
}

function Alert({ type = "error", children, onClose }) {
  const map = {
    error: { bg: T.redSoft, border: T.redBorder, color: T.red },
    warn:  { bg: T.amberSoft, border: T.amberBorder, color: T.amber },
    info:  { bg: T.blueSoft, border: T.blueBorder, color: T.blue },
  };
  const c = map[type];
  return (
    <div style={{
      margin: "0 0 16px", padding: "10px 14px", background: c.bg,
      border: `1px solid ${c.border}`, borderRadius: T.radiusSm,
      color: c.color, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    }}>
      <span>{children}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.color, fontSize: 16, lineHeight: 1, marginLeft: 8, padding: 0 }}>×</button>
      )}
    </div>
  );
}

function StatoBadge({ stato, approvato }) {
  const isOk = approvato || stato === "approvato";
  const isWait = stato === "analizzato" || stato === "in_attesa";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isOk ? T.greenSoft : isWait ? T.amberSoft : T.redSoft,
      color: isOk ? T.green : isWait ? T.amber : T.red,
      border: `1px solid ${isOk ? T.greenBorder : isWait ? T.amberBorder : T.redBorder}`,
    }}>
      {isOk ? "● Approvato" : isWait ? "◐ In attesa" : "○ Non usabile"}
    </span>
  );
}

function OverlapBar({ pct }) {
  if (!pct) return <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>;
  const color = pct > 70 ? T.red : pct > 40 ? T.amber : T.green;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 56, height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}

// ─── NavBar ────────────────────────────────────────────────────────
function NavBar({ sezione, onNav, config }) {
  const tabs = [
    { id: "kb",     label: "Knowledge Base", icon: "📚" },
    { id: "corso",  label: "Nuovo corso",    icon: "📝" },
    { id: "genera", label: "Generazione",    icon: "⚡" },
  ];
  return (
    <div style={{
      background: T.white, borderBottom: `1px solid ${T.border}`,
      padding: "0 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 56, boxShadow: T.shadow,
      position: "sticky", top: 0, zIndex: 200,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: T.blue, textTransform: "uppercase" }}>
          AIFORMAZIONE
        </div>
        <div style={{ width: 1, height: 18, background: T.border, marginLeft: 4 }} />
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {tabs.map(t => {
          // FIX #12: "Generazione" disabilitata se non c'è config valida
          const isDisabled = t.id === "genera" && !config;
          const isActive = sezione === t.id;
          return (
            <button
              key={t.id}
              onClick={() => !isDisabled && onNav(t.id)}
              title={isDisabled ? "Prima configura un corso" : ""}
              style={{
                padding: "7px 16px", borderRadius: T.radiusSm,
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                border: "none", cursor: isDisabled ? "not-allowed" : "pointer",
                background: isActive ? T.blue : "transparent",
                color: isActive ? "#fff" : isDisabled ? T.textMuted : T.textSub,
                opacity: isDisabled ? 0.5 : 1,
                transition: "background 0.15s, color 0.15s",
                fontFamily: T.font,
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, minWidth: 160, textAlign: "right" }}>
        {config ? (
          <span style={{ color: T.green, fontWeight: 600 }}>
            ● {config.titolo.slice(0, 28)}{config.titolo.length > 28 ? "…" : ""}
          </span>
        ) : (
          <span>Nessun corso configurato</span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SEZIONE 1 — KNOWLEDGE BASE
// ════════════════════════════════════════════════════════════════════

const CORSO_COLORS = {
  rls:          { bg: "#EFF4FF", text: "#2563EB", border: "#BFCFFF" },
  lavoratori:   { bg: T.greenSoft, text: T.green, border: T.greenBorder },
  "datore-lavoro": { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  slc:          { bg: T.purpleSoft, text: T.purple, border: T.purpleBorder },
  default:      { bg: "#F5F5F7", text: "#424242", border: "#D1D1D6" },
};

function tagColor(tag) {
  if (!tag) return CORSO_COLORS.default;
  const l = tag.toLowerCase();
  if (l.includes("rls")) return CORSO_COLORS.rls;
  if (l.includes("lavorator")) return CORSO_COLORS.lavoratori;
  if (l.includes("datore")) return CORSO_COLORS["datore-lavoro"];
  if (l.includes("slc") || l.includes("stress")) return CORSO_COLORS.slc;
  return CORSO_COLORS.default;
}

function TagBadge({ label }) {
  const c = tagColor(label);
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, background: c.bg, color: c.text,
      border: `1px solid ${c.border}`, marginRight: 4, marginBottom: 4, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function ChunkRow({ chunk, onToggle, updating }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 70px 110px 90px 110px",
      gap: 10, alignItems: "center",
      padding: "10px 16px", borderBottom: `1px solid ${T.borderLight}`,
      background: chunk.usabile ? T.white : T.redSoft,
      transition: "background 0.2s",
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>
          {chunk.titolo || `Chunk #${chunk.id}`}
        </div>
        <div style={{
          fontSize: 11, color: T.textSub, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {chunk.testo_chunk?.substring(0, 120)}…
        </div>
        {chunk.slide_range && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>slide {chunk.slide_range}</div>}
      </div>
      <div style={{ fontSize: 12, color: T.textSub }}>{chunk.n_parole ? `${chunk.n_parole}p` : "—"}</div>
      <div>
        {chunk.overlap_con ? (
          <>
            <OverlapBar pct={chunk.overlap_percentuale} />
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
              {chunk.overlap_con}
            </div>
          </>
        ) : <OverlapBar pct={0} />}
      </div>
      <div>
        <span style={{
          padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: chunk.usabile ? T.greenSoft : T.redSoft,
          color: chunk.usabile ? T.green : T.red,
        }}>
          {chunk.usabile ? "Usabile" : "Escluso"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {!chunk.usabile && (
          <Btn variant="ghostGreen" disabled={updating} onClick={() => onToggle(chunk.id, true)} style={{ padding: "4px 10px", fontSize: 11 }}>
            ✓ Approva
          </Btn>
        )}
        {chunk.usabile && (
          <Btn variant="ghostRed" disabled={updating} onClick={() => onToggle(chunk.id, false)} style={{ padding: "4px 10px", fontSize: 11 }}>
            ✕ Escludi
          </Btn>
        )}
      </div>
    </div>
  );
}

function DocumentoCard({ doc, isSelected, onClick }) {
  // FIX #10: overlap_max calcolato dai dati reali (passato come prop, non dal DB)
  const tags = Array.isArray(doc.argomenti_tag)
    ? doc.argomenti_tag
    : typeof doc.argomenti_tag === "string"
      ? doc.argomenti_tag.replace(/[{}"]/g, "").split(",").filter(Boolean)
      : [];

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px", borderRadius: T.radius,
        border: `2px solid ${isSelected ? T.blue : T.border}`,
        background: isSelected ? T.blueSoft : T.white,
        cursor: "pointer", transition: "all 0.15s", marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4, wordBreak: "break-word" }}>
            {doc.nome_file}
          </div>
          <div style={{ marginBottom: 6 }}>
            {tags.slice(0, 4).map(t => <TagBadge key={t} label={t.trim()} />)}
            {tags.length > 4 && <TagBadge label={`+${tags.length - 4}`} />}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <StatoBadge stato={doc.stato} approvato={doc.approvato} />
            {doc.n_parole && <span style={{ fontSize: 11, color: T.textMuted }}>{doc.n_parole.toLocaleString()} p.</span>}
            {doc.overlapMax > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: doc.overlapMax > 70 ? T.red : T.amber }}>
                overlap {doc.overlapMax}%
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 18, color: isSelected ? T.blue : T.textMuted, flexShrink: 0 }}>
          {isSelected ? "▸" : "›"}
        </div>
      </div>
    </div>
  );
}

function KBSection() {
  const [documenti, setDocumenti] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [updatingChunk, setUpdatingChunk] = useState(null);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("tutti");
  const [searchDoc, setSearchDoc] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => { loadDocumenti(); }, []);

  async function loadDocumenti() {
    setLoadingDocs(true);
    setError(null);
    try {
      const data = await sbFetch("documenti?select=*&order=nome_file.asc");
      const docs = data || [];

      // FIX #10: calcola overlapMax dai chunk per ogni documento
      // Per ora lo leggiamo da un campo computato se esiste, altrimenti 0
      // (il DB non ha overlap_max su documenti — va calcolato sui chunk al momento della selezione)
      const docsWithOverlap = docs.map(d => ({ ...d, overlapMax: 0 }));
      setDocumenti(docsWithOverlap);

      const approvati = docs.filter(d => d.approvato || d.stato === "approvato").length;
      const inAttesa = docs.filter(d => !d.approvato && (d.stato === "analizzato" || d.stato === "in_attesa")).length;
      setStats({ totale: docs.length, approvati, inAttesa });
    } catch (e) {
      setError("Errore caricamento documenti: " + e.message);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function loadChunks(docId) {
    setLoadingChunks(true);
    setChunks([]);
    try {
      const data = await sbFetch(`argomenti?documento_id=eq.${docId}&order=id.asc`);
      const cs = data || [];
      setChunks(cs);

      // FIX #10: aggiorna overlapMax del documento selezionato in memoria
      const maxOvlp = cs.reduce((m, c) => Math.max(m, c.overlap_percentuale || 0), 0);
      setDocumenti(prev => prev.map(d => d.id === docId ? { ...d, overlapMax: maxOvlp } : d));
    } catch (e) {
      setError("Errore caricamento chunk: " + e.message);
    } finally {
      setLoadingChunks(false);
    }
  }

  async function toggleChunk(chunkId, newUsabile) {
    setUpdatingChunk(chunkId);
    try {
      await sbFetch(`argomenti?id=eq.${chunkId}`, {
        method: "PATCH",
        body: JSON.stringify({ usabile: newUsabile }),
      });
      setChunks(prev => prev.map(c => c.id === chunkId ? { ...c, usabile: newUsabile } : c));
    } catch (e) {
      setError("Errore aggiornamento: " + e.message);
    } finally {
      setUpdatingChunk(null);
    }
  }

  function selectDoc(doc) {
    setSelectedDoc(doc);
    loadChunks(doc.id);
  }

  const docsFiltrati = documenti
    .filter(d => {
      if (filtro === "approvati") return d.approvato || d.stato === "approvato";
      if (filtro === "in_attesa") return !d.approvato && (d.stato === "analizzato" || d.stato === "in_attesa");
      return true;
    })
    .filter(d => !searchDoc || d.nome_file.toLowerCase().includes(searchDoc.toLowerCase()));

  const chunksUsabili = chunks.filter(c => c.usabile).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", height: "calc(100vh - 56px)" }}>
      {/* Colonna sinistra */}
      <div style={{ borderRight: `1px solid ${T.border}`, background: T.white, display: "flex", flexDirection: "column" }}>
        {/* Stats header */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", gap: 8 }}>
          {stats && [
            { label: "Totale", value: stats.totale, color: T.blue },
            { label: "Approvati", value: stats.approvati, color: T.green },
            { label: "In attesa", value: stats.inAttesa, color: T.amber },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, textAlign: "center", padding: "6px 0",
              borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Filtri */}
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.borderLight}` }}>
          <Input
            placeholder="Cerca documento..."
            value={searchDoc}
            onChange={e => setSearchDoc(e.target.value)}
            style={{ marginBottom: 8, fontSize: 13 }}
          />
          <div style={{ display: "flex", gap: 5 }}>
            {["tutti", "approvati", "in_attesa"].map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                padding: "4px 12px", borderRadius: 20, border: `1px solid ${filtro === f ? T.blue : T.border}`,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                background: filtro === f ? T.blueSoft : T.white,
                color: filtro === f ? T.blue : T.textSub,
              }}>
                {f === "tutti" ? "Tutti" : f === "approvati" ? "Approvati" : "In attesa"}
              </button>
            ))}
          </div>
        </div>
        {/* Lista */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
          {error && <Alert type="error" onClose={() => setError(null)}>⚠ {error}</Alert>}
          {loadingDocs ? (
            <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>
              <div style={{ fontSize: 28, marginBottom: 8, animation: "spin 1s linear infinite" }}>⟳</div>
              Caricamento…
            </div>
          ) : docsFiltrati.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 13 }}>Nessun documento trovato</div>
          ) : (
            docsFiltrati.map(doc => (
              <DocumentoCard key={doc.id} doc={doc} isSelected={selectedDoc?.id === doc.id} onClick={() => selectDoc(doc)} />
            ))
          )}
        </div>
      </div>

      {/* Colonna destra */}
      <div style={{ display: "flex", flexDirection: "column", background: T.bg }}>
        {!selectedDoc ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.textMuted }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Seleziona un documento</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>per vedere i chunk estratti</div>
          </div>
        ) : (
          <>
            <div style={{ padding: "14px 18px", background: T.white, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 5 }}>{selectedDoc.nome_file}</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <StatoBadge stato={selectedDoc.stato} approvato={selectedDoc.approvato} />
                {!loadingChunks && (
                  <span style={{ fontSize: 12, color: T.textSub }}>{chunksUsabili}/{chunks.length} chunk usabili</span>
                )}
                {selectedDoc.n_parole && (
                  <span style={{ fontSize: 12, color: T.textMuted }}>{selectedDoc.n_parole.toLocaleString()} parole</span>
                )}
                {selectedDoc.note_revisione && (
                  <span style={{ fontSize: 12, color: T.textSub, fontStyle: "italic" }}>{selectedDoc.note_revisione}</span>
                )}
              </div>
            </div>
            {/* Header colonne */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 70px 110px 90px 110px",
              gap: 10, padding: "7px 16px", background: "#F0F0F4",
              fontSize: 10, fontWeight: 700, color: T.textSub,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              <div>Chunk / Testo</div><div>Parole</div><div>Overlap</div><div>Stato</div><div>Azione</div>
            </div>
            {/* Lista chunk */}
            <div style={{ flex: 1, overflowY: "auto", background: T.white }}>
              {loadingChunks ? (
                <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Caricamento chunk…</div>
              ) : chunks.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 13 }}>Nessun chunk trovato</div>
              ) : (
                chunks.map(chunk => (
                  <ChunkRow key={chunk.id} chunk={chunk} onToggle={toggleChunk} updating={updatingChunk === chunk.id} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SEZIONE 2 — NUOVO CORSO (configurazione + gap analysis)
// ════════════════════════════════════════════════════════════════════

// FIX #9: ricerca gap analysis migliorata — cerca per titolo chunk E per corsi_tag su documenti
async function cercaChunkPerTag(tag) {
  // Ricerca normalizzata + sinonimi lato DB (insensibile a maiuscole/accenti/trattini)
  let chunks = [];
  try {
    chunks = await sbFetch("rpc/cerca_materiale", {
      method: "POST",
      body: JSON.stringify({ termine: tag }),
    }) || [];
  } catch (_) {
    chunks = [];
  }

  if (chunks.length === 0) return { tag, stato: "gap", chunkCount: 0, overlapMax: 0, overlapCon: null };

  const overlapMax = chunks.reduce((m, c) => Math.max(m, c.overlap_percentuale || 0), 0);
  const overlapCon = chunks.find(c => c.overlap_percentuale === overlapMax)?.overlap_con || null;

  return {
    tag,
    stato: overlapMax > 70 ? "warning" : "coperto",
    chunkCount: chunks.length,
    overlapMax,
    overlapCon,
  };
}

function TagChip({ label, onRemove }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: T.blueSoft, color: T.blue, border: `1px solid ${T.blueBorder}`,
      marginRight: 5, marginBottom: 5,
    }}>
      {label}
      {onRemove && (
        <button onClick={onRemove} style={{
          background: "none", border: "none", cursor: "pointer",
          color: T.blue, fontSize: 14, padding: 0, lineHeight: 1, opacity: 0.7,
        }}>×</button>
      )}
    </span>
  );
}

function ArgomentiInput({ valore, onChange, tuttiTag }) {
  const [input, setInput] = useState("");
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [aperto, setAperto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setAperto(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleInput(val) {
    setInput(val);
    if (val.length < 1) { setSuggerimenti([]); setAperto(false); return; }
    const matches = tuttiTag
      .filter(t => t.toLowerCase().includes(val.toLowerCase()) && !valore.includes(t))
      .slice(0, 8);
    setSuggerimenti(matches);
    setAperto(matches.length > 0);
  }

  function aggiungi(tag) {
    if (!valore.includes(tag)) onChange([...valore, tag]);
    setInput(""); setSuggerimenti([]); setAperto(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && input.trim()) {
      aggiungi(input.trim().toLowerCase().replace(/\s+/g, "-"));
    }
    if (e.key === "Backspace" && input === "" && valore.length > 0) {
      onChange(valore.slice(0, -1));
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => document.getElementById("arg-input")?.focus()}
        style={{
          minHeight: 44, padding: "6px 10px", borderRadius: T.radiusSm,
          border: `1px solid ${T.border}`, background: "#FAFBFC",
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, cursor: "text",
        }}
      >
        {valore.map(t => (
          <TagChip key={t} label={t} onRemove={() => onChange(valore.filter(x => x !== t))} />
        ))}
        <input
          id="arg-input"
          value={input}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input && setAperto(suggerimenti.length > 0)}
          placeholder={valore.length === 0 ? "Scrivi un argomento o scegli dalla KB…" : ""}
          style={{
            border: "none", outline: "none", background: "transparent",
            fontSize: 13, color: T.text, flex: 1, minWidth: 140, fontFamily: T.font,
          }}
        />
      </div>
      {aperto && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: T.white, border: `1px solid ${T.border}`,
          borderRadius: T.radiusSm, boxShadow: T.shadowMd,
          zIndex: 100, marginTop: 4, maxHeight: 220, overflowY: "auto",
        }}>
          <div style={{ padding: "6px 12px", fontSize: 10, color: T.textMuted, borderBottom: `1px solid ${T.borderLight}` }}>
            Tag presenti in KB
          </div>
          {suggerimenti.map(t => (
            <div key={t} onClick={() => aggiungi(t)} style={{
              padding: "9px 14px", fontSize: 13, cursor: "pointer", color: T.text, fontFamily: T.font,
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >{t}</div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5 }}>
        Invio per aggiungere · Backspace per rimuovere l'ultimo
      </div>
    </div>
  );
}

function GapRow({ tag, stato, chunkCount, overlapMax, overlapCon, risolto, onToggleSalta }) {
  const [showMsg, setShowMsg] = useState(false);
  const cfg = {
    coperto: { label: "Coperto",      bg: T.greenSoft,  text: T.green,  border: T.greenBorder,  icon: "✓" },
    warning: { label: "Overlap alto", bg: T.amberSoft,  text: T.amber,  border: T.amberBorder,  icon: "⚠" },
    gap:     { label: "Gap",          bg: T.redSoft,    text: T.red,    border: T.redBorder,    icon: "✕" },
  };
  const c = cfg[stato] || cfg.gap;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "180px 110px 1fr auto",
      gap: 10, alignItems: "center",
      padding: "11px 16px", borderBottom: `1px solid ${T.borderLight}`,
      background: risolto ? "#FAFFFE" : stato === "gap" ? T.redSoft + "44" : T.white,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
        {tag}
        {risolto && <span style={{ fontSize: 11, color: T.green, marginLeft: 6 }}>→ saltato</span>}
      </div>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: c.bg, color: c.text, border: `1px solid ${c.border}`, width: "fit-content",
      }}>
        {c.icon} {c.label}
      </span>
      <div style={{ fontSize: 12, color: T.textSub }}>
        {stato === "coperto" && `${chunkCount} chunk usabili`}
        {stato === "warning" && <span>{chunkCount} chunk · overlap max <b style={{ color: T.amber }}>{overlapMax}%</b>{overlapCon && <span style={{ color: T.textMuted }}> con {overlapCon}</span>}</span>}
        {stato === "gap" && "Nessun chunk in KB"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
        {stato === "gap" && !risolto && (
          <div style={{ display: "flex", gap: 5 }}>
            <Btn variant="ghostBlue" onClick={() => setShowMsg(v => !v)} style={{ padding: "4px 10px", fontSize: 11 }}>
              + Carica materiale
            </Btn>
            <Btn variant="ghost" onClick={onToggleSalta} style={{ padding: "4px 10px", fontSize: 11 }}>
              Salta
            </Btn>
          </div>
        )}
        {stato === "gap" && risolto && (
          <Btn variant="ghostRed" onClick={onToggleSalta} style={{ padding: "4px 10px", fontSize: 11 }}>Annulla</Btn>
        )}
        {showMsg && (
          <div style={{
            fontSize: 11, color: T.blue, background: T.blueSoft, padding: "5px 8px",
            borderRadius: T.radiusSm, border: `1px solid ${T.blueBorder}`, maxWidth: 200, textAlign: "right",
          }}>
            Vai alla sezione KB, carica il materiale, poi torna e riverifica.
          </div>
        )}
      </div>
    </div>
  );
}

// FIX #11: caricaTag usa una sola fonte (argomenti_tag dai documenti approvati)
// per evitare duplicazioni e tag non significativi derivati da split di titoli
async function caricaTagKB() {
  const docs = await sbFetch("documenti?select=argomenti_tag&approvato=eq.true");
  const tagSet = new Set();
  (docs || []).forEach(d => {
    const tags = Array.isArray(d.argomenti_tag)
      ? d.argomenti_tag
      : typeof d.argomenti_tag === "string"
        ? d.argomenti_tag.replace(/[{}"]/g, "").split(",")
        : [];
    tags.forEach(t => { if (t.trim().length > 0) tagSet.add(t.trim().toLowerCase()); });
  });
  return [...tagSet].sort();
}

function CorsoSection({ onProcedi }) {
  const [titolo, setTitolo] = useState("");
  const [destinatari, setDestinatari] = useState("");
  const [nLezioni, setNLezioni] = useState(16);
  const [argomenti, setArgomenti] = useState([]);
  const [tuttiTag, setTuttiTag] = useState([]);
  const [loadingTag, setLoadingTag] = useState(true);
  const [gapResults, setGapResults] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [saltati, setSaltati] = useState({});
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    caricaTagKB()
      .then(setTuttiTag)
      .catch(e => setErrore("Errore tag KB: " + e.message))
      .finally(() => setLoadingTag(false));
  }, []);

  function resetGap() { setGapResults(null); setSaltati({}); }

  async function verificaGap() {
    if (argomenti.length === 0) { setErrore("Aggiungi almeno un argomento."); return; }
    setVerificando(true); setGapResults(null); setSaltati({}); setErrore(null);
    try {
      const risultati = await Promise.all(argomenti.map(cercaChunkPerTag));
      setGapResults(risultati);
    } catch (e) {
      setErrore("Errore verifica: " + e.message);
    } finally {
      setVerificando(false);
    }
  }

  const gapIrrisolti = gapResults?.filter(r => r.stato === "gap" && !saltati[r.tag]) || [];
  const coperti = gapResults?.filter(r => r.stato === "coperto").length || 0;
  const warnings = gapResults?.filter(r => r.stato === "warning").length || 0;
  const gaps = gapResults?.filter(r => r.stato === "gap").length || 0;

  const puoProcedere = titolo.trim() && destinatari.trim() && argomenti.length > 0
    && gapResults !== null && gapIrrisolti.length === 0;

  // FIX #8: onProcedi passa config alla sezione generazione
  function handleProcedi() {
    if (puoProcedere) {
      onProcedi({ titolo, destinatari, nLezioni, argomenti });
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 24px 80px" }}>
      {errore && <Alert type="error" onClose={() => setErrore(null)}>⚠ {errore}</Alert>}

      <Card>
        <SectionTitle>Configurazione corso</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div>
            <Label>Titolo corso</Label>
            <Input placeholder="es. Aggiornamento RLS 2026" value={titolo} onChange={e => setTitolo(e.target.value)} />
          </div>
          <div>
            <Label>Destinatari</Label>
            <Input placeholder="es. Rappresentanti dei Lavoratori" value={destinatari} onChange={e => setDestinatari(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label>Numero di lezioni</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input type="range" min={4} max={32} value={nLezioni}
              onChange={e => setNLezioni(Number(e.target.value))} style={{ flex: 1 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: T.blue, minWidth: 36, textAlign: "center" }}>{nLezioni}</div>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
            Costo stimato: ~${(nLezioni * 0.04).toFixed(2)} · Tempo: ~{nLezioni * 2} min
          </div>
        </div>
        <div>
          <Label>
            Argomenti obbligatori{loadingTag && <span style={{ fontWeight: 400, color: T.textMuted }}> — caricamento…</span>}
          </Label>
          <ArgomentiInput
            valore={argomenti}
            onChange={val => { setArgomenti(val); resetGap(); }}
            tuttiTag={tuttiTag}
          />
        </div>
      </Card>

      {argomenti.length > 0 && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Btn variant="primary" onClick={verificaGap} disabled={verificando} style={{ padding: "11px 30px" }}>
            {verificando ? "Verifica in corso…" : "🔍 Verifica gap"}
          </Btn>
        </div>
      )}

      {gapResults && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <SectionTitle style={{ margin: 0 }}>Gap analysis</SectionTitle>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "Coperti", value: coperti, color: T.green, bg: T.greenSoft },
                { label: "Warning", value: warnings, color: T.amber, bg: T.amberSoft },
                { label: "Gap",     value: gaps,    color: T.red,   bg: T.redSoft },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "5px 12px", borderRadius: T.radiusSm, background: s.bg }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "180px 110px 1fr auto",
            gap: 10, padding: "5px 16px",
            background: "#F5F5F7", borderRadius: `${T.radiusSm} ${T.radiusSm} 0 0`,
            fontSize: 10, fontWeight: 700, color: T.textSub,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <div>Argomento</div><div>Stato</div><div>Dettaglio</div><div>Azione</div>
          </div>
          <div style={{ border: `1px solid ${T.borderLight}`, borderRadius: `0 0 ${T.radiusSm} ${T.radiusSm}`, overflow: "hidden" }}>
            {gapResults.map(r => (
              <GapRow key={r.tag} {...r} risolto={!!saltati[r.tag]}
                onToggleSalta={() => setSaltati(prev => ({ ...prev, [r.tag]: !prev[r.tag] }))} />
            ))}
          </div>
          {gapIrrisolti.length > 0 && (
            <Alert type="warn" style={{ marginTop: 12, marginBottom: 0 }}>
              ⚠ {gapIrrisolti.length} gap irrisolti — carica il materiale mancante o salta gli argomenti per procedere.
            </Alert>
          )}
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="success" disabled={!puoProcedere} onClick={handleProcedi} style={{ padding: "12px 32px" }}>
          Procedi alla generazione →
        </Btn>
      </div>
      {!puoProcedere && (
        <div style={{ fontSize: 11, color: T.textMuted, textAlign: "right", marginTop: 6 }}>
          {!titolo && "· inserisci il titolo "}
          {!destinatari && "· inserisci i destinatari "}
          {argomenti.length === 0 && "· aggiungi almeno un argomento "}
          {argomenti.length > 0 && !gapResults && "· verifica i gap "}
          {gapResults && gapIrrisolti.length > 0 && `· risolvi ${gapIrrisolti.length} gap `}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SEZIONE 3 — GENERAZIONE CORSO
// ════════════════════════════════════════════════════════════════════

function LezioneRow({ numero, titolo, stato, parole, errore }) {
  const cfg = {
    attesa:     { bg: "#F5F5F7",  text: T.textMuted, border: T.border,      icon: "○", label: "In attesa" },
    corso:      { bg: T.blueSoft, text: T.blue,       border: T.blueBorder,  icon: "◌", label: "In corso…" },
    completata: { bg: T.greenSoft, text: T.green,     border: T.greenBorder, icon: "●", label: "Completata" },
    errore:     { bg: T.redSoft,  text: T.red,        border: T.redBorder,   icon: "✕", label: "Errore" },
  };
  const c = cfg[stato] || cfg.attesa;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "44px 1fr 120px 70px",
      gap: 10, alignItems: "center",
      padding: "10px 16px", borderBottom: `1px solid ${T.borderLight}`,
      background: stato === "corso" ? "#FAFEFF" : T.white,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: c.bg, border: `1px solid ${c.border}`,
        fontSize: 12, fontWeight: 800, color: c.text,
        animation: stato === "corso" ? "pulse 1.5s infinite" : "none",
      }}>{numero}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{titolo || `Lezione ${numero}`}</div>
        {errore && <div style={{ fontSize: 11, color: T.red, marginTop: 2 }}>{errore}</div>}
      </div>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: c.bg, color: c.text, border: `1px solid ${c.border}`, width: "fit-content",
      }}>
        {c.icon} {c.label}
      </span>
      <div style={{ fontSize: 12, color: T.textMuted, textAlign: "right" }}>
        {parole ? `${parole}p` : "—"}
      </div>
    </div>
  );
}

function ModaleVersioni({ versioni, onSovrascivi, onNuovaVersione, onAnnulla }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: T.white, borderRadius: 14, padding: 28, width: 480, boxShadow: T.shadowMd }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Corso già esistente</div>
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 18 }}>
          Esistono già {versioni.length} versioni. Cosa vuoi fare?
        </div>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, overflow: "hidden", marginBottom: 20 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 120px 90px",
            padding: "6px 12px", background: T.bg,
            fontSize: 10, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            <div>Versione</div><div>Data</div><div>Lezioni</div>
          </div>
          {versioni.map((v, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 120px 90px",
              padding: "10px 12px", borderTop: `1px solid ${T.borderLight}`, fontSize: 13, color: T.text,
            }}>
              <div style={{ fontWeight: 600 }}>v{v.versione}</div>
              <div style={{ color: T.textMuted }}>{new Date(v.created_at).toLocaleDateString("it-IT")}</div>
              <div style={{ color: T.textMuted }}>{v.n_lezioni} lez.</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onAnnulla}>Annulla</Btn>
          <Btn variant="ghostRed" onClick={onSovrascivi}>Sovrascrivi ultima</Btn>
          <Btn variant="primary" onClick={onNuovaVersione}>Salva come nuova versione</Btn>
        </div>
      </div>
    </div>
  );
}

function GeneraSection({ config }) {
  // FIX #3: nLezioni dal config aggiornato, non solo al mount
  const [prompt, setPrompt] = useState(PROMPT_DEFAULT);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // FIX #3: useEffect che si resetta quando config cambia
  const [lezioni, setLezioni] = useState([]);
  useEffect(() => {
    setLezioni(
      Array.from({ length: config.nLezioni }, (_, i) => ({
        numero: i + 1,
        titolo: `Lezione ${i + 1}`,
        stato: "attesa",
        contenuto: null,
        parole: null,
        errore: null,
      }))
    );
    setDocxPronto(false);
    setDocxBlob(null);
    setErroreGlobale(null);
  }, [config.titolo, config.nLezioni]);

  const [generando, setGenerando] = useState(false);
  const [versioni, setVersioni] = useState(null);
  const [showModaleVersioni, setShowModaleVersioni] = useState(false);
  const [versioneTarget, setVersioneTarget] = useState(1);
  const [erroreGlobale, setErroreGlobale] = useState(null);
  const [docxPronto, setDocxPronto] = useState(false);
  const [docxBlob, setDocxBlob] = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (config.titolo) caricaVersioni();
  }, [config.titolo]);

  async function caricaVersioni() {
    try {
      const data = await sbFetch(
        `corsi_generati?titolo=eq.${encodeURIComponent(config.titolo)}&order=versione.desc&select=id,versione,n_lezioni,created_at`
      );
      setVersioni(data || []);
    } catch {
      setVersioni([]);
    }
  }

  // FIX #6: fetchChunksPerArgomento cerca anche in testo_chunk
  async function fetchChunksPerArgomento(argomenti) {
    const chunks = [];
    for (const tag of argomenti) {
      try {
        const res = await sbFetch("rpc/cerca_materiale", {
          method: "POST",
          body: JSON.stringify({ termine: tag }),
        });
        if (res) chunks.push(...res);
      } catch (_) {}
    }
    const visti = new Set();
    return chunks.filter(c => {
      if (visti.has(c.id)) return false;
      visti.add(c.id);
      return true;
    });
  }

  async function fetchArticoliPerTag(argomenti) {
    const articoli = [];
    for (const tag of argomenti) {
      try {
        const data = await sbFetch(
          `articoli_dlgs?select=numero_articolo,titolo_articolo,testo_completo&corsi_tag=cs.{${tag}}&limit=5`
        );
        if (data?.length) articoli.push(...data);
      } catch {}
    }
    const visti = new Set();
    return articoli.filter(a => {
      if (visti.has(a.numero_articolo)) return false;
      visti.add(a.numero_articolo);
      return true;
    });
  }

  function buildPrompt(nLezione, titoloLezione, chunks, articoli) {
    const chunksText = chunks.length
      ? chunks.map(c => `[${c.titolo}]\n${c.testo_chunk}`).join("\n\n")
      : "Nessun materiale specifico in KB per questa lezione.";
    const articoliText = articoli.length
      ? articoli.map(a => `Art. ${a.numero_articolo} — ${a.titolo_articolo}\n${a.testo_completo}`).join("\n\n")
      : "Nessun articolo specifico trovato.";
    return prompt
      .replace("{{NUMERO_LEZIONE}}", nLezione)
      .replace("{{TITOLO_LEZIONE}}", titoloLezione)
      .replace("{{TITOLO_CORSO}}", config.titolo)
      .replace("{{DESTINATARI}}", config.destinatari)
      .replace("{{CHUNKS_KB}}", chunksText)
      .replace("{{ARTICOLI_DLGS}}", articoliText);
  }

  async function generaLezione(lezioneObj, chunks, articoli) {
    const promptBuilt = buildPrompt(lezioneObj.numero, lezioneObj.titolo, chunks, articoli);
    const res = await fetch(GENERA_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${AUTH_TOKEN || SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        prompt: promptBuilt,
        model: "claude-sonnet-4-20250514",
        max_tokens: 4500,
        meta: {
          titolo_corso: config.titolo,
          numero_lezione: lezioneObj.numero,
          titolo_lezione: lezioneObj.titolo,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
    if (data.troncato) console.warn(`Lez. ${lezioneObj.numero}: testo troncato (max_tokens)`);
    // troncato e costo_usd ora disponibili (UI/retry mirato per il troncamento: fase 5)
    return { testo: data.testo, parole: data.parole, stop_reason: data.stop_reason, troncato: data.troncato, costo_usd: data.costo_usd };
  }

  function aggiornaLezione(numero, patch) {
    setLezioni(prev => prev.map(l => l.numero === numero ? { ...l, ...patch } : l));
  }

  async function avviaGenerazione(versioneMode = "nuova") {
    setGenerando(true);
    setDocxPronto(false);
    setDocxBlob(null);
    setErroreGlobale(null);
    abortRef.current = false;

    // FIX #5: reset esplicito stati lezioni
    setLezioni(Array.from({ length: config.nLezioni }, (_, i) => ({
      numero: i + 1,
      titolo: `Lezione ${i + 1}`,
      stato: "attesa",
      contenuto: null,
      parole: null,
      errore: null,
    })));

    try {
      const chunks = await fetchChunksPerArgomento(config.argomenti);
      const articoli = await fetchArticoliPerTag(config.argomenti);
      const risultati = new Array(config.nLezioni).fill(null);
      const gruppoSize = 3;

      const lezCurrent = Array.from({ length: config.nLezioni }, (_, i) => ({
        numero: i + 1, titolo: `Lezione ${i + 1}`,
      }));

      for (let i = 0; i < config.nLezioni; i += gruppoSize) {
        if (abortRef.current) break;
        const gruppo = lezCurrent.slice(i, i + gruppoSize);
        gruppo.forEach(l => aggiornaLezione(l.numero, { stato: "corso" }));
        await Promise.all(
          gruppo.map(async l => {
            try {
              const { testo, parole } = await generaLezione(l, chunks, articoli);
              risultati[l.numero - 1] = { ...l, contenuto: testo, parole };
              aggiornaLezione(l.numero, { stato: "completata", contenuto: testo, parole });
            } catch (e) {
              risultati[l.numero - 1] = { ...l, contenuto: null, errore: e.message };
              aggiornaLezione(l.numero, { stato: "errore", errore: e.message });
            }
          })
        );
      }

      if (!abortRef.current) {
        const blob = assemblaDocx(risultati);
        setDocxBlob(blob);
        setDocxPronto(true);
        await salvaCorso(risultati, versioneMode, chunks);
      }
    } catch (e) {
      setErroreGlobale("Errore durante la generazione: " + e.message);
    } finally {
      setGenerando(false);
    }
  }

  function assemblaDocx(risultati) {
    const lines = [
      `CORSO: ${config.titolo}`,
      `Destinatari: ${config.destinatari}`,
      `Numero lezioni: ${config.nLezioni}`,
      `Generato il: ${new Date().toLocaleDateString("it-IT")}`,
      "", "═".repeat(60), "",
    ];
    risultati.forEach(l => {
      if (!l) return;
      lines.push(`LEZIONE ${l.numero} — ${l.titolo}`);
      lines.push("─".repeat(40));
      lines.push(l.contenuto || `[ERRORE: ${l.errore || "contenuto non generato"}]`);
      lines.push("", "═".repeat(60), "");
    });
    return new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  }

  function downloadDocx() {
    if (!docxBlob) return;
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement("a");
    a.href = url;
    // FIX #2: estensione .txt onesta — per .docx reale serve build Node
    a.download = `${config.titolo.replace(/\s+/g, "_")}_v${versioneTarget}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function salvaCorso(risultati, versioneMode, chunks = []) {
    try {
      const ultimaVersione = versioni?.length ? versioni[0].versione : 0;
      const nuovaVersione = versioneMode === "sovrascivi" ? ultimaVersione : ultimaVersione + 1;
      setVersioneTarget(nuovaVersione);

      const argomentoIds = [...new Set(chunks.map(c => c.id).filter(Boolean))];
      const documentoIds = [...new Set(chunks.map(c => c.documento_id).filter(Boolean))];

      const payload = {
        titolo: config.titolo,
        titolo_corso: config.titolo,
        destinatari: config.destinatari,
        n_lezioni: config.nLezioni,
        argomenti: config.argomenti,
        versione: nuovaVersione,
        argomento_ids: argomentoIds,
        documento_ids: documentoIds,
        modello_ai: "claude-sonnet-4-6",
        lezioni_json: risultati.map(l => ({
          numero: l?.numero, titolo: l?.titolo, parole: l?.parole,
          stato: l?.errore ? "errore" : "ok",
        })),
      };

      if (versioneMode === "sovrascivi" && versioni?.length) {
        await sbFetch(`corsi_generati?id=eq.${versioni[0].id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await sbFetch("corsi_generati", { method: "POST", body: JSON.stringify(payload) });
      }
      await caricaVersioni();
    } catch (e) {
      console.error("Errore salvataggio Supabase:", e.message);
    }
  }

  async function handleAvvia() {
    if (versioni && versioni.length > 0) {
      setShowModaleVersioni(true);
    } else {
      avviaGenerazione("nuova");
    }
  }

  // FIX #4: rimozione stato `completate` ridondante — calcolato da lezioni
  const completateCount = lezioni.filter(l => l.stato === "completata").length;
  const erroriCount = lezioni.filter(l => l.stato === "errore").length;
  const totaleParole = lezioni.reduce((s, l) => s + (l.parole || 0), 0);
  const progressoPct = Math.round((completateCount + erroriCount) / config.nLezioni * 100);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 24px 80px" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {erroreGlobale && <Alert type="error" onClose={() => setErroreGlobale(null)}>⚠ {erroreGlobale}</Alert>}

      {/* Riepilogo config */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <SectionTitle style={{ margin: 0 }}>Riepilogo configurazione</SectionTitle>
          {versioni && versioni.length > 0 && (
            <span style={{ fontSize: 12, color: T.textMuted, background: T.bg, padding: "5px 10px", borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}>
              {versioni.length} {versioni.length === 1 ? "versione" : "versioni"} · ultima v{versioni[0]?.versione}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
          {[
            { label: "Corso", value: config.titolo },
            { label: "Destinatari", value: config.destinatari },
            { label: "Lezioni", value: `${config.nLezioni} lezioni` },
            { label: "Argomenti", value: config.argomenti.join(", ") || "—" },
          ].map(r => (
            <div key={r.label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{r.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Editor prompt */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionTitle style={{ margin: 0 }}>Prompt di generazione</SectionTitle>
          <Btn variant="ghost" onClick={() => setShowPromptEditor(v => !v)} style={{ padding: "6px 14px", fontSize: 12 }}>
            {showPromptEditor ? "Chiudi editor" : "✏️ Modifica prompt"}
          </Btn>
        </div>
        {showPromptEditor && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>
              Variabili:{" "}
              {["NUMERO_LEZIONE","TITOLO_LEZIONE","TITOLO_CORSO","DESTINATARI","CHUNKS_KB","ARTICOLI_DLGS"].map(v => (
                <code key={v} style={{ background: T.bg, padding: "1px 6px", borderRadius: 4, fontSize: 11, marginRight: 4 }}>{`{{${v}}}`}</code>
              ))}
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={{
                width: "100%", height: 320, padding: "12px 14px",
                borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
                fontSize: 12, fontFamily: "'Fira Mono', monospace",
                lineHeight: 1.6, resize: "vertical", outline: "none",
                background: "#FAFBFC", color: T.text, boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setPrompt(PROMPT_DEFAULT)} style={{ fontSize: 12, padding: "6px 14px" }}>
                Ripristina default
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {/* Progress bar durante generazione */}
      {generando && (
        <Card style={{ padding: "14px 20px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.blue }}>Generazione in corso…</span>
            <span style={{ fontSize: 12, color: T.textMuted }}>{completateCount + erroriCount} / {config.nLezioni}</span>
          </div>
          <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: erroriCount > 0 ? `linear-gradient(90deg, ${T.green}, ${T.red})` : T.green,
              width: `${progressoPct}%`, transition: "width 0.4s ease",
            }} />
          </div>
        </Card>
      )}

      {/* Lista lezioni */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle style={{ margin: 0 }}>Lezioni — {config.titolo}</SectionTitle>
          {completateCount > 0 && (
            <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
              <span style={{ color: T.green }}>✓ {completateCount} completate</span>
              {erroriCount > 0 && <span style={{ color: T.red }}>✕ {erroriCount} errori</span>}
              {totaleParole > 0 && <span style={{ color: T.textMuted }}>{totaleParole.toLocaleString()} parole</span>}
            </div>
          )}
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "44px 1fr 120px 70px",
          gap: 10, padding: "5px 16px",
          background: "#F5F5F7", borderRadius: `${T.radiusSm} ${T.radiusSm} 0 0`,
          fontSize: 10, fontWeight: 700, color: T.textSub,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <div>#</div><div>Lezione</div><div>Stato</div><div style={{ textAlign: "right" }}>Parole</div>
        </div>
        <div style={{ border: `1px solid ${T.borderLight}`, borderRadius: `0 0 ${T.radiusSm} ${T.radiusSm}`, overflow: "hidden" }}>
          {lezioni.map(l => (
            <LezioneRow key={l.numero} {...l} />
          ))}
        </div>
      </Card>

      {/* Azioni */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        {docxPronto ? (
          <Btn variant="primary" onClick={downloadDocx} style={{ padding: "12px 26px" }}>
            ⬇ Scarica testo corso (.txt)
          </Btn>
        ) : <div />}
        <Btn
          variant={generando ? "danger" : "success"}
          onClick={generando ? () => { abortRef.current = true; setGenerando(false); } : handleAvvia}
          style={{ padding: "12px 32px" }}
        >
          {generando ? "⏹ Interrompi" : docxPronto ? "↺ Rigenera" : "▶ Genera corso"}
        </Btn>
      </div>

      {/* FIX #2: nota su formato .txt */}
      {docxPronto && (
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8, textAlign: "right" }}>
          Il download è in formato .txt. Per generare il .docx formattato usa il builder Node.js (<code>build_rls_v4.cjs</code>).
        </div>
      )}

      {showModaleVersioni && versioni && (
        <ModaleVersioni
          versioni={versioni}
          onSovrascivi={() => { setShowModaleVersioni(false); avviaGenerazione("sovrascivi"); }}
          onNuovaVersione={() => { setShowModaleVersioni(false); avviaGenerazione("nuova"); }}
          onAnnulla={() => setShowModaleVersioni(false)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LOGIN — autenticazione email + password (Fase 3)
// ════════════════════════════════════════════════════════════════════
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState(null);
  const [caricamento, setCaricamento] = useState(false);

  async function accedi() {
    setErrore(null);
    setCaricamento(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || "Credenziali non valide");

      const token = data.access_token;
      setAuthToken(token); // da ora sbFetch usa il token utente

      // Recupera il ruolo dal profilo
      let ruolo = "docente";
      try {
        const prof = await sbFetch(`profiles?id=eq.${data.user.id}&select=ruolo`);
        if (prof && prof[0]?.ruolo) ruolo = prof[0].ruolo;
      } catch (_) {}

      onLogin({ token, user: data.user, ruolo });
    } catch (e) {
      setAuthToken(null);
      setErrore(e.message);
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Card style={{ width: 380, maxWidth: "100%" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>AIFORMAZIONE</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 18 }}>Accedi</div>

        {errore && <Alert type="error" onClose={() => setErrore(null)}>{errore}</Alert>}

        <div style={{ marginBottom: 12 }}>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                 placeholder="tu@esempio.it" onKeyDown={e => e.key === "Enter" && accedi()} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                 placeholder="••••••••" onKeyDown={e => e.key === "Enter" && accedi()} />
        </div>

        <Btn variant="primary" onClick={accedi} disabled={caricamento || !email || !password} style={{ width: "100%" }}>
          {caricamento ? "Accesso…" : "Accedi"}
        </Btn>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// APP ROOT — router + stato globale
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [auth, setAuth] = useState(null); // { token, user, ruolo }
  const [sezione, setSezione] = useState("kb");
  const [config, setConfig] = useState(null);

  // FIX #12: quando l'utente configura il corso, naviga automaticamente a "genera"
  function handleProcedi(cfg) {
    setConfig(cfg);
    setSezione("genera");
  }

  function logout() {
    setAuthToken(null);
    setAuth(null);
    setSezione("kb");
    setConfig(null);
  }

  // Cancello di autenticazione: niente login, niente app
  if (!auth) return <Login onLogin={setAuth} />;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", color: T.text }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D1D6; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #A0A4AD; }
      `}</style>

      {/* Barra utente (Fase 3) */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, padding: "6px 24px", background: T.white, borderBottom: `1px solid ${T.borderLight}`, fontSize: 12, color: T.textSub }}>
        <span>{auth.user?.email} · <strong style={{ color: T.text }}>{auth.ruolo}</strong></span>
        <button onClick={logout} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "4px 12px", fontSize: 12, color: T.textSub, cursor: "pointer", fontFamily: T.font }}>Esci</button>
      </div>

      <NavBar sezione={sezione} onNav={setSezione} config={config} />

      {sezione === "kb"    && <KBSection />}
      {sezione === "corso" && <CorsoSection onProcedi={handleProcedi} />}
      {sezione === "genera" && config && <GeneraSection config={config} />}
      {sezione === "genera" && !config && (
        <div style={{ textAlign: "center", padding: 80, color: T.textMuted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Nessun corso configurato</div>
          <div style={{ fontSize: 13, marginTop: 6, marginBottom: 20 }}>Vai alla sezione "Nuovo corso" per configurare prima il corso.</div>
          <Btn variant="primary" onClick={() => setSezione("corso")}>Vai a Nuovo corso →</Btn>
        </div>
      )}
    </div>
  );
}
