import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, CircleDashed, Download, FileText, Filter, History, Loader2, Plus, Search, Trash2 } from "lucide-react";

type DocType = "Rechnung" | "Vertrag" | "Lieferschein" | "Benutzerdefiniert";

type ExtractedField = {
  key: string;
  value: string;
  confidence: number; // 0..100
};

type ArchiveItem = {
  id: string;
  type: DocType;
  supplier?: string;
  invoiceNo?: string;
  date?: string;
  amount?: string;
  quality: "Excellent" | "Good" | "Needs Review";
};

export function OCRPage() {
  const [step, setStep] = useState<
    | "intro"
    | "setup"
    | "processing"
    | "review"
    | "archive"
    | "analytics"
  >("intro");

  const [docType, setDocType] = useState<DocType>("Rechnung");
  const [fields, setFields] = useState<string[]>([
    "Rechnungsnummer",
    "Betrag",
    "Datum",
    "Lieferant",
  ]);
  const [newField, setNewField] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const [extracted, setExtracted] = useState<ExtractedField[]>([
    { key: "Rechnungsnummer", value: "RE-2024-001", confidence: 95 },
    { key: "Betrag", value: "1.247,50 €", confidence: 92 },
    { key: "Datum", value: "15.03.2024", confidence: 78 },
    { key: "Lieferant", value: "Müller & Co", confidence: 45 },
  ]);

  const [learningNote, setLearningNote] = useState<string | null>(null);

  const [archive, setArchive] = useState<ArchiveItem[]>([
    {
      id: "DOC-2001",
      type: "Rechnung",
      supplier: "Müller & Partner GmbH",
      invoiceNo: "RE-2024-001",
      date: "15.03.2024",
      amount: "1.247,50 €",
      quality: "Excellent",
    },
    {
      id: "DOC-2002",
      type: "Vertrag",
      supplier: "Alpha Consulting",
      date: "01.02.2024",
      quality: "Good",
    },
    {
      id: "DOC-2003",
      type: "Lieferschein",
      supplier: "Beta Supplies",
      date: "28.02.2024",
      quality: "Needs Review",
    },
  ]);

  const [archiveFilter, setArchiveFilter] = useState<string>("");
  const [qualityFilter, setQualityFilter] = useState<ArchiveItem["quality"] | "Alle">("Alle");

  useEffect(() => {
    if (step === "processing") {
      const t = setTimeout(() => setStep("review"), 1500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const qualityBadge = (confidence: number) => {
    if (confidence >= 90) return { label: "✅", color: "text-[#21FF5F]" };
    if (confidence >= 70) return { label: "⚠️", color: "text-yellow-400" };
    return { label: "❌", color: "text-red-400" };
  };

  const overallQuality = useMemo(() => {
    const avg = extracted.reduce((a, f) => a + f.confidence, 0) / extracted.length;
    if (avg >= 90) return { label: "Excellent", cls: "bg-[#00FF38] text-black" };
    if (avg >= 75) return { label: "Good", cls: "bg-yellow-400 text-black" };
    return { label: "Needs Review", cls: "bg-red-400 text-white" };
  }, [extracted]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setStep("processing");
  };

  const updateField = (key: string, value: string) => {
    setExtracted((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value, confidence: Math.min(100, Math.max(85, f.confidence + 5))) : f))
    );
    setLearningNote("Danke! Das System lernt aus Ihrer Korrektur");
    const t = setTimeout(() => setLearningNote(null), 2000);
    return () => clearTimeout(t);
  };

  const addField = () => {
    const f = newField.trim();
    if (!f || fields.includes(f)) return;
    setFields((p) => [...p, f]);
    setExtracted((p) => [...p, { key: f, value: "", confidence: 50 }]);
    setNewField("");
  };

  const downloadCSV = () => {
    const header = ["Feld", "Wert", "Konfidenz"]; 
    const rows = extracted.map((f) => [f.key, f.value, `${f.confidence}%`]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${fileName || "dokument"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filteredArchive = archive.filter((it) => {
    const matchesText = archiveFilter
      ? [it.id, it.supplier, it.invoiceNo, it.date, it.amount].filter(Boolean).join(" ").toLowerCase().includes(archiveFilter.toLowerCase())
      : true;
    const matchesQuality = qualityFilter === "Alle" ? true : it.quality === qualityFilter;
    return matchesText && matchesQuality;
  });

  return (
    <div className="h-full bg-white dark:bg-[#1F1D1D] text-[#1F1D1D] dark:text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-[#312F2F] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gray-200 dark:bg-[#312F2F]"><FileText size={20} className="text-[#1F1D1D] dark:text-white" /></div>
          <div>
            <h1 className="text-xl font-semibold">Dokumente verarbeiten</h1>
            <p className="text-xs text-[#767876]">Laden Sie Dokumente hoch und extrahieren Sie automatisch strukturierte Daten</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setStep("archive")} className="px-3 py-2 text-xs rounded-full bg-gray-200 dark:bg-[#312F2F] flex items-center space-x-2">
            <History size={16} />
            <span>Archiv</span>
          </button>
          <button onClick={() => setStep("analytics")} className="px-3 py-2 text-xs rounded-full bg-gray-200 dark:bg-[#312F2F]">
            Überblick
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {step === "intro" && (
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2">Schnellstart</h2>
              <p className="text-sm text-[#767876]">Unterstützte Typen: Rechnungen, Verträge, Lieferscheine</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <p className="text-sm mb-4">Starten Sie mit Ihrem ersten Dokument.</p>
              <button onClick={() => setStep("setup")} className="px-6 py-3 rounded-full bg-[#322F2F]/90 text-white font-semibold">Erstes Dokument hochladen</button>
            </div>
          </div>
        )}

        {step === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Doc type */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <h3 className="font-semibold mb-3">Dokumenttyp wählen</h3>
              <div className="space-y-2">
                {(["Rechnung", "Vertrag", "Lieferschein", "Benutzerdefiniert"] as DocType[]).map((t) => (
                  <label key={t} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${docType === t ? "bg-black/10 dark:bg-black/40" : ""}`}>
                    <span className="text-sm">{t}</span>
                    <input type="radio" name="doctype" checked={docType === t} onChange={() => setDocType(t)} />
                  </label>
                ))}
              </div>
            </div>
            {/* Fields */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] lg:col-span-2">
              <h3 className="font-semibold mb-3">Felder definieren</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {fields.map((f) => (
                  <span key={f} className="px-3 py-1 rounded-full bg-black/10 dark:bg-black/40 text-xs">{f}</span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input value={newField} onChange={(e) => setNewField(e.target.value)} placeholder="Weiteres Feld hinzufügen" className="flex-1 px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm" />
                <button onClick={addField} className="px-3 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm flex items-center space-x-1"><Plus size={16} /><span>Hinzufügen</span></button>
              </div>
            </div>
            {/* Upload */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] lg:col-span-3">
              <h3 className="font-semibold mb-3">Erstes Dokument</h3>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F]">
                <div className="flex items-center space-x-3">
                  <FileText />
                  <span className="text-sm">{fileName || "Keine Datei ausgewählt"}</span>
                </div>
                <label className="px-4 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm cursor-pointer">
                  Datei wählen
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }} />
                </label>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-gray-200 dark:bg-[#312F2F] text-center">
            <div className="flex items-center justify-center mb-4"><Loader2 className="animate-spin" /></div>
            <p className="text-sm">Dokument wird analysiert...</p>
            <div className="h-2 mt-4 rounded-full bg-black/10 dark:bg-black/40 overflow-hidden">
              <div className="h-full w-1/2 bg-[#00FF38] animate-pulse" />
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PDF preview placeholder */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] min-h-[420px] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-sm text-[#767876]">Originaldokument</div>
                <div className="w-72 h-96 bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] rounded-lg flex items-center justify-center">
                  <FileText className="text-[#767876]" />
                </div>
                <div className="mt-3 text-xs text-[#767876]">{fileName || "Dokument.pdf"}</div>
              </div>
            </div>

            {/* Extracted fields */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Extrahierte Daten</h3>
                <div className={`px-3 py-1 rounded-full text-xs ${overallQuality.cls}`}>{overallQuality.label}</div>
              </div>
              <div className="space-y-3">
                {extracted.map((f) => {
                  const badge = qualityBadge(f.confidence);
                  return (
                    <div key={f.key} className="p-3 rounded-lg bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold">{f.key}</div>
                        <div className={`text-xs font-semibold ${badge.color}`}>{badge.label} {f.confidence}%</div>
                      </div>
                      <input
                        value={f.value}
                        onChange={(e) => updateField(f.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-[#312F2F] text-sm"
                      />
                    </div>
                  );
                })}
              </div>
              {learningNote && (
                <div className="mt-3 text-xs text-[#21FF5F]/93 flex items-center space-x-2">
                  <CheckCircle2 size={16} />
                  <span>{learningNote}</span>
                </div>
              )}

              <div className="mt-4 flex items-center space-x-2">
                <button onClick={downloadCSV} className="px-4 py-2 rounded-full bg-[#00FF38] text-black text-sm font-semibold flex items-center space-x-2">
                  <Download size={16} />
                  <span>Nach CSV exportieren</span>
                </button>
                <button onClick={() => setStep("archive")} className="px-4 py-2 rounded-full bg-gray-200 dark:bg-[#312F2F] text-sm">Zum Archiv</button>
              </div>
            </div>
          </div>
        )}

        {step === "archive" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-white/60" />
                  </div>
                  <input value={archiveFilter} onChange={(e) => setArchiveFilter(e.target.value)} placeholder="Suchen nach Lieferant, Nr., Datum..." className="w-full pl-10 pr-4 py-2.5 bg-gray-200 dark:bg-[#543639]/48 rounded-full border-none outline-none text-[#1F1D1D]/60 dark:text-white/60 text-xs placeholder-black/60 dark:placeholder-white/60" />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter size={18} />
                  <select value={qualityFilter} onChange={(e) => setQualityFilter(e.target.value as any)} className="px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm">
                    <option>Alle</option>
                    <option>Excellent</option>
                    <option>Good</option>
                    <option>Needs Review</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredArchive.map((it) => (
                <div key={it.id} className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">{it.id}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      it.quality === "Excellent"
                        ? "bg-[#00FF38] text-black"
                        : it.quality === "Good"
                        ? "bg-yellow-400 text-black"
                        : "bg-red-400 text-white"
                    }`}>{it.quality}</span>
                  </div>
                  <div className="text-xs text-[#767876] space-y-1">
                    <div>Typ: {it.type}</div>
                    {it.invoiceNo && <div>Rechnungsnummer: {it.invoiceNo}</div>}
                    {it.supplier && <div>Lieferant: {it.supplier}</div>}
                    {it.amount && <div>Betrag: {it.amount}</div>}
                    {it.date && <div>Datum: {it.date}</div>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button className="px-3 py-1 rounded-full bg-[#322F2F]/90 text-white text-xs" onClick={() => setStep("review")}>Ansehen</button>
                    <button className="text-red-400" onClick={() => setArchive((p) => p.filter((x) => x.id !== it.id))}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPIs */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="text-xs text-[#767876] mb-1">Ihre Erfolgsrate</div>
              <div className="text-2xl font-semibold">94%</div>
              <div className="text-xs text-[#767876]">verbessert von 87%</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="text-xs text-[#767876] mb-1">Verarbeitete Dokumente</div>
              <div className="text-2xl font-semibold">200</div>
              <div className="text-xs text-[#767876]">+24% im Vergleich zum Vormonat</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="text-xs text-[#767876] mb-1">Problematische Felder</div>
              <div className="text-sm">Lieferantenadressen <span className="text-[#767876]">(68% Genauigkeit)</span></div>
            </div>

            {/* Suggestion */}
            <div className="md:col-span-3 p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] flex items-start justify-between">
              <div>
                <div className="font-semibold mb-1">Vorschlag</div>
                <div className="text-sm text-[#767876]">Möchten Sie die Erkennung für Lieferanten verbessern?</div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 rounded-full bg-[#00FF38] text-black text-sm font-semibold flex items-center space-x-2">
                  <CheckCircle2 size={16} />
                  <span>Optimierung starten</span>
                </button>
                <button className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm">Später</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-black/10 dark:border-[#312F2F] p-3 flex items-center justify-between">
        <div className="text-xs text-[#767876] flex items-center space-x-2">
          <CircleDashed size={14} />
          <span>Schritt: {step}</span>
        </div>
        <div className="flex items-center space-x-2">
          {step !== "intro" && step !== "processing" && (
            <button onClick={() => setStep("intro")} className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#312F2F] text-sm">Zur Startseite</button>
          )}
          {step === "review" && (
            <button onClick={() => setStep("archive")} className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#312F2F] text-sm">Fertig</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OCRPage;