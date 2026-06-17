import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://zdvzxkzdkazewotiivxw.supabase.co";
// Fase 2: la generazione passa dalla Edge Function (la chiave Anthropic resta server-side)
const GENERA_FN_URL = `${SUPABASE_URL}/functions/v1/genera-lezione`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkdnp4a3pka2F6ZXdvdGlpdnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDI2NjgsImV4cCI6MjA5NDIxODY2OH0.VtYaMrGBD-zl7W5BCJ_a3U8mkxQQ9UJB_SBnRDJQOt8";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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

// ─── Stili ────────────────────────────────────────────────────────
const S = {
  card: {
    background: "#FFFFFF",
    borderRadius: 12,
    border: "1px solid #E0E0E0",
    padding: "24px",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#212121",
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#616161",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  },
};

// ─── Stato lezione chip ───────────────────────────────────────────
function LezioneRow({ numero, titolo, stato, parole, errore }) {
  const config = {
    attesa:     { bg: "#F5F5F5",  text: "#9E9E9E",  border: "#E0E0E0",  icon: "○",  label: "In attesa" },
    corso:      { bg: "#E3F2FD",  text: "#1565C0",  border: "#90CAF9",  icon: "◌",  label: "In corso..." },
    completata: { bg: "#E8F5E9",  text: "#2E7D32",  border: "#A5D6A7",  icon: "●",  label: "Completata" },
    errore:     { bg: "#FFEBEE",  text: "#C62828",  border: "#EF9A9A",  icon: "✕",  label: "Errore" },
  };
  const c = config[stato] || config.attesa;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "48px 1fr 130px 80px",
      gap: 12,
      alignItems: "center",
      padding: "10px 16px",
      borderBottom: "1px solid #F5F5F5",
      background: stato === "corso" ? "#FAFEFF" : "#FFFFFF",
      transition: "background 0.3s",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: c.bg, border: `1px solid ${c.border}`,
        fontSize: 13, fontWeight: 800, color: c.text,
        animation: stato === "corso" ? "pulse 1.5s infinite" : "none",
      }}>
        {numero}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#212121" }}>
          {titolo || `Lezione ${numero}`}
        </div>
        {errore && <div style={{ fontSize: 11, color: "#C62828", marginTop: 2 }}>{errore}</div>}
      </div>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20,
        fontSize: 11, fontWeight: 700,
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        width: "fit-content",
      }}>
        <span style={{ fontSize: 9 }}>{c.icon}</span>
        {c.label}
      </span>
      <div style={{ fontSize: 12, color: "#9E9E9E", textAlign: "right" }}>
        {parole ? `${parole} p.` : "—"}
      </div>
    </div>
  );
}

// ─── Modale versioni ──────────────────────────────────────────────
function ModaleVersioni({ versioni, onSovrascivi, onNuovaVersione, onAnnulla }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 14, padding: 28,
        width: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#212121", marginBottom: 6 }}>
          Corso già esistente
        </div>
        <div style={{ fontSize: 13, color: "#757575", marginBottom: 18 }}>
          Esistono già {versioni.length} versioni di questo corso. Cosa vuoi fare?
        </div>

        {/* Lista versioni */}
        <div style={{ border: "1px solid #E0E0E0", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 120px 100px",
            padding: "6px 12px", background: "#F5F5F5",
            fontSize: 11, fontWeight: 700, color: "#9E9E9E",
            letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            <div>Versione</div>
            <div>Data</div>
            <div>Lezioni</div>
          </div>
          {versioni.map((v, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 120px 100px",
              padding: "10px 12px", borderTop: "1px solid #F0F0F0",
              fontSize: 13, color: "#212121",
            }}>
              <div style={{ fontWeight: 600 }}>v{v.versione}</div>
              <div style={{ color: "#9E9E9E" }}>
                {new Date(v.created_at).toLocaleDateString("it-IT")}
              </div>
              <div style={{ color: "#9E9E9E" }}>{v.n_lezioni} lez.</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onAnnulla} style={{
            padding: "9px 18px", borderRadius: 8, border: "1px solid #E0E0E0",
            background: "#FFFFFF", color: "#616161", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Annulla</button>
          <button onClick={onSovrascivi} style={{
            padding: "9px 18px", borderRadius: 8, border: "1px solid #EF9A9A",
            background: "#FFEBEE", color: "#C62828", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Sovrascrivi ultima versione</button>
          <button onClick={onNuovaVersione} style={{
            padding: "9px 18px", borderRadius: 8, border: "none",
            background: "#1565C0", color: "#FFFFFF", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Salva come nuova versione</button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────
export default function GeneraSection({ config }) {
  // config = { titolo, destinatari, nLezioni, argomenti } — passa da CorsoSection

  // Dati mock per sviluppo standalone (quando non arriva config)
  const cfg = config || {
    titolo: "Aggiornamento RLS 2026",
    destinatari: "Rappresentanti dei Lavoratori per la Sicurezza",
    nLezioni: 4,
    argomenti: ["rls", "dvr", "dpi", "normativa"],
  };

  // ── State ──
  const [prompt, setPrompt] = useState(PROMPT_DEFAULT);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [lezioni, setLezioni] = useState(
    Array.from({ length: cfg.nLezioni }, (_, i) => ({
      numero: i + 1,
      titolo: `Lezione ${i + 1}`,
      stato: "attesa",
      contenuto: null,
      parole: null,
      errore: null,
    }))
  );
  const [generando, setGenerando] = useState(false);
  const [completate, setCompletate] = useState(0);
  const [versioni, setVersioni] = useState(null);
  const [showModaleVersioni, setShowModaleVersioni] = useState(false);
  const [versioneTarget, setVersioneTarget] = useState(null);
  const [erroreGlobale, setErroreGlobale] = useState(null);
  const [docxPronto, setDocxPronto] = useState(false);
  const [docxBlob, setDocxBlob] = useState(null);
  const abortRef = useRef(false);

  // ── Carica versioni esistenti ──
  useEffect(() => {
    if (cfg.titolo) caricaVersioni();
  }, [cfg.titolo]);

  async function caricaVersioni() {
    try {
      const data = await sbFetch(
        `corsi_generati?titolo=eq.${encodeURIComponent(cfg.titolo)}&order=versione.desc&select=id,versione,n_lezioni,created_at`
      );
      setVersioni(data || []);
    } catch (e) {
      setVersioni([]);
    }
  }

  // ── Recupera chunks KB per argomenti ──
  async function fetchChunksPerArgomento(argomenti) {
    const chunks = [];
    for (const tag of argomenti) {
      try {
        const data = await sbFetch(
          `argomenti?select=id,titolo,testo_chunk,documento_id&usabile=eq.true&titolo=ilike.*${encodeURIComponent(tag)}*`
        );
        if (data?.length) chunks.push(...data);
      } catch (_) {}
    }
    // deduplica per titolo
    const visti = new Set();
    return chunks.filter(c => {
      if (visti.has(c.titolo)) return false;
      visti.add(c.titolo);
      return true;
    });
  }

  // ── Recupera articoli D.Lgs. per tag ──
  async function fetchArticoliPerTag(argomenti) {
    const articoli = [];
    for (const tag of argomenti) {
      try {
        const data = await sbFetch(
          `articoli_dlgs?select=numero_articolo,titolo_articolo,testo_completo&corsi_tag=cs.{${tag}}&limit=5`
        );
        if (data?.length) articoli.push(...data);
      } catch (_) {}
    }
    const visti = new Set();
    return articoli.filter(a => {
      if (visti.has(a.numero_articolo)) return false;
      visti.add(a.numero_articolo);
      return true;
    });
  }

  // ── Costruisce prompt per singola lezione ──
  function buildPrompt(numeroLezione, titoloLezione, chunks, articoli) {
    const chunksText = chunks.length
      ? chunks.map(c => `[${c.titolo}]\n${c.testo_chunk}`).join("\n\n")
      : "Nessun materiale specifico disponibile in KB per questa lezione.";

    const articoliText = articoli.length
      ? articoli.map(a => `Art. ${a.numero_articolo} — ${a.titolo_articolo}\n${a.testo_completo}`).join("\n\n")
      : "Nessun articolo specifico trovato.";

    return prompt
      .replace("{{NUMERO_LEZIONE}}", numeroLezione)
      .replace("{{TITOLO_LEZIONE}}", titoloLezione)
      .replace("{{TITOLO_CORSO}}", cfg.titolo)
      .replace("{{DESTINATARI}}", cfg.destinatari)
      .replace("{{CHUNKS_KB}}", chunksText)
      .replace("{{ARTICOLI_DLGS}}", articoliText);
  }

  // ── Genera singola lezione via API Claude ──
  async function generaLezione(lezioneObj, chunks, articoli) {
    const promptBuilt = buildPrompt(lezioneObj.numero, lezioneObj.titolo, chunks, articoli);

    const res = await fetch(GENERA_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        prompt: promptBuilt,
        model: "claude-sonnet-4-20250514",
        max_tokens: 4500,
        meta: {
          titolo_corso: cfg.titolo,
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

  // ── Aggiorna stato di una lezione ──
  function aggiornaLezione(numero, patch) {
    setLezioni(prev => prev.map(l => l.numero === numero ? { ...l, ...patch } : l));
  }

  // ── Avvia generazione ──
  async function avviaGenerazione(versioneMode = null) {
    setGenerando(true);
    setDocxPronto(false);
    setDocxBlob(null);
    setErroreGlobale(null);
    abortRef.current = false;
    setCompletate(0);

    // Reset stati lezioni
    setLezioni(prev => prev.map(l => ({ ...l, stato: "attesa", contenuto: null, parole: null, errore: null })));

    try {
      // Carica materiale KB
      const chunks = await fetchChunksPerArgomento(cfg.argomenti);
      const articoli = await fetchArticoliPerTag(cfg.argomenti);

      const risultati = new Array(cfg.nLezioni).fill(null);
      const gruppoSize = 3;

      for (let i = 0; i < cfg.nLezioni; i += gruppoSize) {
        if (abortRef.current) break;

        const gruppo = lezioni.slice(i, i + gruppoSize);

        // Metti tutto il gruppo "in corso"
        gruppo.forEach(l => aggiornaLezione(l.numero, { stato: "corso" }));

        // Genera in parallelo
        const promises = gruppo.map(async (l) => {
          try {
            const { testo, parole } = await generaLezione(l, chunks, articoli);
            risultati[l.numero - 1] = { ...l, contenuto: testo, parole };
            aggiornaLezione(l.numero, { stato: "completata", contenuto: testo, parole });
            setCompletate(c => c + 1);
          } catch (e) {
            risultati[l.numero - 1] = { ...l, contenuto: null, errore: e.message };
            aggiornaLezione(l.numero, { stato: "errore", errore: e.message });
            setCompletate(c => c + 1);
          }
        });

        await Promise.all(promises);
      }

      if (!abortRef.current) {
        // Assembla DOCX
        const blob = assemblaDocx(risultati, cfg);
        setDocxBlob(blob);
        setDocxPronto(true);

        // Salva su Supabase
        await salvaCorso(risultati, versioneMode, chunks);
      }
    } catch (e) {
      setErroreGlobale("Errore durante la generazione: " + e.message);
    } finally {
      setGenerando(false);
    }
  }

  // ── Assembla DOCX (testo formattato come blob) ──
  // Nota: assembla un file .txt formattato per ora;
  // per il DOCX reale serve la libreria docx installata (da usare in ambiente Node/Vite)
  function assemblaDocx(risultati, cfg) {
    const lines = [];
    lines.push(`CORSO: ${cfg.titolo}`);
    lines.push(`Destinatari: ${cfg.destinatari}`);
    lines.push(`Numero lezioni: ${cfg.nLezioni}`);
    lines.push(`Generato il: ${new Date().toLocaleDateString("it-IT")}`);
    lines.push("");
    lines.push("═".repeat(60));
    lines.push("");

    risultati.forEach((l, i) => {
      if (!l) return;
      lines.push(`LEZIONE ${l.numero} — ${l.titolo}`);
      lines.push("─".repeat(40));
      if (l.contenuto) {
        lines.push(l.contenuto);
      } else {
        lines.push(`[ERRORE: ${l.errore || "contenuto non generato"}]`);
      }
      lines.push("");
      lines.push("═".repeat(60));
      lines.push("");
    });

    const testo = lines.join("\n");
    return new Blob([testo], { type: "text/plain;charset=utf-8" });
  }

  // ── Download file ──
  function downloadDocx() {
    if (!docxBlob) return;
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cfg.titolo.replace(/\s+/g, "_")}_v${(versioneTarget || 1)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Salva su Supabase ──
  async function salvaCorso(risultati, versioneMode, chunks = []) {
    try {
      const ultimaVersione = versioni?.length ? versioni[0].versione : 0;
      const nuovaVersione = versioneMode === "sovrascivi"
        ? ultimaVersione
        : ultimaVersione + 1;

      setVersioneTarget(nuovaVersione);

      // Estrai id univoci di chunk e documenti usati
      const argomentoIds = [...new Set(chunks.map(c => c.id).filter(Boolean))];
      const documentoIds = [...new Set(chunks.map(c => c.documento_id).filter(Boolean))];

      const payload = {
        titolo: cfg.titolo,               // campo NOT NULL originale
        titolo_corso: cfg.titolo,
        destinatari: cfg.destinatari,
        n_lezioni: cfg.nLezioni,
        argomenti: cfg.argomenti,
        versione: nuovaVersione,
        argomento_ids: argomentoIds,      // campo NOT NULL originale
        documento_ids: documentoIds,      // campo NOT NULL originale
        modello_ai: "claude-sonnet-4-6",
        lezioni_json: risultati.map(l => ({
          numero: l?.numero,
          titolo: l?.titolo,
          parole: l?.parole,
          stato: l?.errore ? "errore" : "ok",
        })),
      };

      if (versioneMode === "sovrascivi" && versioni?.length) {
        await sbFetch(`corsi_generati?id=eq.${versioni[0].id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await sbFetch("corsi_generati", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await caricaVersioni();
    } catch (e) {
      console.error("Errore salvataggio Supabase:", e);
    }
  }

  // ── Click "Genera corso" ──
  async function handleAvvia() {
    if (versioni && versioni.length > 0) {
      setShowModaleVersioni(true);
    } else {
      avviaGenerazione("nuova");
    }
  }

  const completateCount = lezioni.filter(l => l.stato === "completata").length;
  const erroriCount = lezioni.filter(l => l.stato === "errore").length;
  const totaleParole = lezioni.reduce((s, l) => s + (l.parole || 0), 0);
  const progressoPct = Math.round((completateCount + erroriCount) / cfg.nLezioni * 100);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#F7F8FA", color: "#212121" }}>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E0E0E0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#9E9E9E", textTransform: "uppercase", marginBottom: 2 }}>AIFORMAZIONE</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#212121" }}>Generazione corso</div>
        </div>
        {versioni && versioni.length > 0 && (
          <div style={{ fontSize: 12, color: "#9E9E9E", background: "#F5F5F5", padding: "6px 12px", borderRadius: 8, border: "1px solid #E0E0E0" }}>
            {versioni.length} {versioni.length === 1 ? "versione esistente" : "versioni esistenti"} · ultima: v{versioni[0]?.versione}
          </div>
        )}
      </div>

      {erroreGlobale && (
        <div style={{ margin: "12px 24px", padding: "10px 14px", background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 8, color: "#C62828", fontSize: 13 }}>
          ⚠ {erroreGlobale}
          <button onClick={() => setErroreGlobale(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#C62828" }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* ── RIEPILOGO PARAMETRI ── */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Riepilogo configurazione</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Corso", value: cfg.titolo },
              { label: "Destinatari", value: cfg.destinatari },
              { label: "Lezioni", value: `${cfg.nLezioni} lezioni` },
              { label: "Argomenti", value: cfg.argomenti.join(", ") || "—" },
            ].map(r => (
              <div key={r.label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9E9E", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: "#212121", fontWeight: 500 }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── EDITOR PROMPT ── */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPromptEditor ? 16 : 0 }}>
            <div style={S.sectionTitle} style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#212121" }}>
              Prompt di generazione
            </div>
            <button
              onClick={() => setShowPromptEditor(v => !v)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: "1px solid #E0E0E0", background: showPromptEditor ? "#F5F5F5" : "#FFFFFF",
                color: "#616161", cursor: "pointer",
              }}>
              {showPromptEditor ? "Chiudi editor" : "✏️ Modifica prompt"}
            </button>
          </div>

          {showPromptEditor && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 8 }}>
                Variabili disponibili: <code style={{ background: "#F5F5F5", padding: "1px 5px", borderRadius: 4 }}>{"{{NUMERO_LEZIONE}}"}</code>{" "}
                <code style={{ background: "#F5F5F5", padding: "1px 5px", borderRadius: 4 }}>{"{{TITOLO_LEZIONE}}"}</code>{" "}
                <code style={{ background: "#F5F5F5", padding: "1px 5px", borderRadius: 4 }}>{"{{TITOLO_CORSO}}"}</code>{" "}
                <code style={{ background: "#F5F5F5", padding: "1px 5px", borderRadius: 4 }}>{"{{DESTINATARI}}"}</code>{" "}
                <code style={{ background: "#F5F5F5", padding: "1px 5px", borderRadius: 4 }}>{"{{CHUNKS_KB}}"}</code>{" "}
                <code style={{ background: "#F5F5F5", padding: "1px 5px", borderRadius: 4 }}>{"{{ARTICOLI_DLGS}}"}</code>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                style={{
                  width: "100%", height: 340, padding: "12px 14px",
                  borderRadius: 8, border: "1px solid #E0E0E0",
                  fontSize: 12, fontFamily: "'Fira Mono', monospace",
                  lineHeight: 1.6, resize: "vertical", outline: "none",
                  background: "#FAFAFA", color: "#212121", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setPrompt(PROMPT_DEFAULT)}
                  style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: "1px solid #E0E0E0", background: "#FFFFFF",
                    color: "#616161", cursor: "pointer",
                  }}>
                  Ripristina default
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── PROGRESS BAR (visibile durante generazione) ── */}
        {generando && (
          <div style={{ ...S.card, padding: "16px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1565C0" }}>
                Generazione in corso...
              </span>
              <span style={{ fontSize: 13, color: "#9E9E9E" }}>
                {completateCount + erroriCount} / {cfg.nLezioni} lezioni
              </span>
            </div>
            <div style={{ height: 6, background: "#E0E0E0", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: erroriCount > 0
                  ? "linear-gradient(90deg, #43A047, #E53935)"
                  : "#43A047",
                width: `${progressoPct}%`,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        )}

        {/* ── LISTA LEZIONI ── */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#212121" }}>
              Lezioni — {cfg.titolo}
            </div>
            {completateCount > 0 && (
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#2E7D32" }}>✓ {completateCount} completate</span>
                {erroriCount > 0 && <span style={{ fontSize: 12, color: "#C62828" }}>✕ {erroriCount} errori</span>}
                {totaleParole > 0 && <span style={{ fontSize: 12, color: "#9E9E9E" }}>{totaleParole.toLocaleString()} parole totali</span>}
              </div>
            )}
          </div>

          {/* Header colonne */}
          <div style={{
            display: "grid", gridTemplateColumns: "48px 1fr 130px 80px",
            gap: 12, padding: "6px 16px",
            background: "#F5F5F5", borderRadius: "6px 6px 0 0",
            fontSize: 11, fontWeight: 700, color: "#9E9E9E",
            letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            <div>#</div>
            <div>Lezione</div>
            <div>Stato</div>
            <div style={{ textAlign: "right" }}>Parole</div>
          </div>

          <div style={{ border: "1px solid #F0F0F0", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
            {lezioni.map(l => (
              <LezioneRow
                key={l.numero}
                numero={l.numero}
                titolo={l.titolo}
                stato={l.stato}
                parole={l.parole}
                errore={l.errore}
              />
            ))}
          </div>
        </div>

        {/* ── AZIONI ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>

          {/* Download DOCX */}
          {docxPronto && (
            <button
              onClick={downloadDocx}
              style={{
                padding: "13px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                background: "#1565C0", color: "#FFFFFF", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
              ⬇ Scarica DOCX
            </button>
          )}
          {!docxPronto && <div />}

          {/* Genera / Stop */}
          <button
            onClick={generando ? () => { abortRef.current = true; setGenerando(false); } : handleAvvia}
            style={{
              padding: "13px 36px", borderRadius: 8, fontSize: 14, fontWeight: 700,
              background: generando ? "#E53935" : "#2E7D32",
              color: "#FFFFFF", border: "none", cursor: "pointer",
              transition: "background 0.2s",
            }}>
            {generando ? "⏹ Interrompi" : docxPronto ? "↺ Rigenera" : "▶ Genera corso"}
          </button>
        </div>

      </div>

      {/* ── MODALE VERSIONI ── */}
      {showModaleVersioni && versioni && (
        <ModaleVersioni
          versioni={versioni}
          onSovrascivi={() => {
            setShowModaleVersioni(false);
            avviaGenerazione("sovrascivi");
          }}
          onNuovaVersione={() => {
            setShowModaleVersioni(false);
            avviaGenerazione("nuova");
          }}
          onAnnulla={() => setShowModaleVersioni(false)}
        />
      )}
    </div>
  );
}
