import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, Download, FileText, Filter, History, Loader2, Plus, Search, Trash2 } from "lucide-react";

type DocType = "Invoice" | "Contract" | "Delivery Note" | "Custom";

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

  const [docType, setDocType] = useState<DocType>("Invoice");
  const [fields, setFields] = useState<string[]>([
    "Invoice number",
    "Amount",
    "Date",
    "Supplier",
  ]);
  const [newField, setNewField] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const [extracted, setExtracted] = useState<ExtractedField[]>([
    { key: "Invoice number", value: "RE-2024-001", confidence: 95 },
    { key: "Amount", value: "1.247,50 €", confidence: 92 },
    { key: "Date", value: "15.03.2024", confidence: 78 },
    { key: "Supplier", value: "Müller & Co", confidence: 45 },
  ]);

  const [learningNote, setLearningNote] = useState<string | null>(null);

  const [archive, setArchive] = useState<ArchiveItem[]>([
    {
      id: "DOC-2001",
      type: "Invoice",
      supplier: "Müller & Partner GmbH",
      invoiceNo: "RE-2024-001",
      date: "15.03.2024",
      amount: "1.247,50 €",
      quality: "Excellent",
    },
    {
      id: "DOC-2002",
      type: "Contract",
      supplier: "Alpha Consulting",
      date: "01.02.2024",
      quality: "Good",
    },
    {
      id: "DOC-2003",
      type: "Delivery Note",
      supplier: "Beta Supplies",
      date: "28.02.2024",
      quality: "Needs Review",
    },
  ]);

  const [archiveFilter, setArchiveFilter] = useState<string>("");
  const [qualityFilter, setQualityFilter] = useState<ArchiveItem["quality"] | "All">("All");

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
      prev.map((f) => (f.key === key ? { ...f, value, confidence: Math.min(100, Math.max(85, f.confidence + 5)) } : f))
    );
    setLearningNote("Thanks! The system learns from your correction");
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
    const header = ["Field", "Value", "Confidence"]; 
    const rows = extracted.map((f) => [f.key, f.value, `${f.confidence}%`]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${fileName || "document"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filteredArchive = archive.filter((it) => {
    const matchesText = archiveFilter
      ? [it.id, it.supplier, it.invoiceNo, it.date, it.amount].filter(Boolean).join(" ").toLowerCase().includes(archiveFilter.toLowerCase())
      : true;
    const matchesQuality = qualityFilter === "All" ? true : it.quality === qualityFilter;
    return matchesText && matchesQuality;
  });

  return (
    <div className="h-full bg-white dark:bg-[#1F1D1D] text-[#1F1D1D] dark:text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-[#312F2F] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gray-200 dark:bg-[#312F2F]"><FileText size={20} className="text-[#1F1D1D] dark:text-white" /></div>
          <div>
            <h1 className="text-xl font-semibold">Process Documents</h1>
            <p className="text-xs text-[#767876]">Upload documents and automatically extract structured data</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setStep("archive")} className="px-3 py-2 text-xs rounded-full bg-gray-200 dark:bg-[#312F2F] flex items-center space-x-2">
            <History size={16} />
            <span>Archive</span>
          </button>
          <button onClick={() => setStep("analytics")} className="px-3 py-2 text-xs rounded-full bg-gray-200 dark:bg-[#312F2F]">
            Overview
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {step === "intro" && (
          <div className="max-w-5xl mx-auto">
            {/* Quick start */}
            <div className="text-center mb-6">
              <div className="mb-3">
                <h2 className="text-2xl font-semibold mb-2">Quick Start</h2>
                <p className="text-sm text-[#767876]">Supported types: Invoices, Contracts, Delivery notes</p>
              </div>
              <div className="p-6 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
                <p className="text-sm mb-4">Start with your first document.</p>
                <button onClick={() => setStep("setup")} className="px-6 py-3 rounded-full bg-[#322F2F]/90 text-white font-semibold">Upload first document</button>
              </div>
            </div>

            {/* Archive preview on entry screen */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Archive</h3>
              </div>

              {/* Filters */}
              <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-white/60" />
                    </div>
                    <input value={archiveFilter} onChange={(e) => setArchiveFilter(e.target.value)} placeholder="Search supplier, number, date..." className="w-full pl-10 pr-4 py-2.5 bg-gray-200 dark:bg-[#543639]/48 rounded-full border-none outline-none text-[#1F1D1D]/60 dark:text-white/60 text-xs placeholder-black/60 dark:placeholder-white/60" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter size={18} />
                    <select value={qualityFilter} onChange={(e) => setQualityFilter(e.target.value as any)} className="px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm">
                      <option>All</option>
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
                      <div>Type: {it.type}</div>
                      {it.invoiceNo && <div>Invoice no.: {it.invoiceNo}</div>}
                      {it.supplier && <div>Supplier: {it.supplier}</div>}
                      {it.amount && <div>Amount: {it.amount}</div>}
                      {it.date && <div>Date: {it.date}</div>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button className="px-3 py-1 rounded-full bg-[#322F2F]/90 text-white text-xs" onClick={() => setStep("review")}>View</button>
                      <button className="text-red-400" onClick={() => setArchive((p) => p.filter((x) => x.id !== it.id))}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Doc type */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <h3 className="font-semibold mb-3">Choose document type</h3>
              <div className="space-y-2">
                {(["Invoice", "Contract", "Delivery Note", "Custom"] as DocType[]).map((t) => (
                  <label key={t} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${docType === t ? "bg-black/10 dark:bg-black/40" : ""}`}>
                    <span className="text-sm">{t}</span>
                    <input type="radio" name="doctype" checked={docType === t} onChange={() => setDocType(t)} />
                  </label>
                ))}
              </div>
            </div>
            {/* Fields */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] lg:col-span-2">
              <h3 className="font-semibold mb-3">Define fields</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {fields.map((f) => (
                  <span key={f} className="px-3 py-1 rounded-full bg-black/10 dark:bg-black/40 text-xs">{f}</span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input value={newField} onChange={(e) => setNewField(e.target.value)} placeholder="Add another field" className="flex-1 px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm" />
                <button onClick={addField} className="px-3 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm flex items-center space-x-1"><Plus size={16} /><span>Add</span></button>
              </div>
            </div>
            {/* Upload */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] lg:col-span-3">
              <h3 className="font-semibold mb-3">First document</h3>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F]">
                <div className="flex items-center space-x-3">
                  <FileText />
                  <span className="text-sm">{fileName || "No file selected"}</span>
                </div>
                <label className="px-4 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm cursor-pointer">
                  Choose file
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
            <p className="text-sm">Analyzing document...</p>
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
                <div className="mb-2 text-sm text-[#767876]">Original document</div>
                <div className="w-72 h-96 bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] rounded-lg flex items-center justify-center">
                  <FileText className="text-[#767876]" />
                </div>
                <div className="mt-3 text-xs text-[#767876]">{fileName || "document.pdf"}</div>
              </div>
            </div>

            {/* Extracted fields */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Extracted data</h3>
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
                  <span>Export to CSV</span>
                </button>
                <button onClick={() => setStep("archive")} className="px-4 py-2 rounded-full bg-gray-200 dark:bg-[#312F2F] text-sm">Go to archive</button>
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
                  <input value={archiveFilter} onChange={(e) => setArchiveFilter(e.target.value)} placeholder="Search supplier, number, date..." className="w-full pl-10 pr-4 py-2.5 bg-gray-200 dark:bg-[#543639]/48 rounded-full border-none outline-none text-[#1F1D1D]/60 dark:text-white/60 text-xs placeholder-black/60 dark:placeholder-white/60" />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter size={18} />
                  <select value={qualityFilter} onChange={(e) => setQualityFilter(e.target.value as any)} className="px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm">
                    <option>All</option>
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
                    <div>Type: {it.type}</div>
                    {it.invoiceNo && <div>Invoice no.: {it.invoiceNo}</div>}
                    {it.supplier && <div>Supplier: {it.supplier}</div>}
                    {it.amount && <div>Amount: {it.amount}</div>}
                    {it.date && <div>Date: {it.date}</div>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button className="px-3 py-1 rounded-full bg-[#322F2F]/90 text-white text-xs" onClick={() => setStep("review")}>View</button>
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
              <div className="text-xs text-[#767876] mb-1">Your success rate</div>
              <div className="text-2xl font-semibold">94%</div>
              <div className="text-xs text-[#767876]">improved from 87%</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="text-xs text-[#767876] mb-1">Processed documents</div>
              <div className="text-2xl font-semibold">200</div>
              <div className="text-xs text-[#767876]">+24% vs previous month</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="text-xs text-[#767876] mb-1">Problematic fields</div>
              <div className="text-sm">Supplier addresses <span className="text-[#767876]">(68% accuracy)</span></div>
            </div>

            {/* Suggestion */}
            <div className="md:col-span-3 p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] flex items-start justify-between">
              <div>
                <div className="font-semibold mb-1">Suggestion</div>
                <div className="text-sm text-[#767876]">Would you like to improve supplier recognition?</div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 rounded-full bg-[#00FF38] text-black text-sm font-semibold flex items-center space-x-2">
                  <CheckCircle2 size={16} />
                  <span>Start optimization</span>
                </button>
                <button className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm">Later</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-black/10 dark:border-[#312F2F] p-3 flex items-center justify-between">
        <div className="text-xs text-[#767876] flex items-center space-x-2">
          <CircleDashed size={14} />
          <span>Step: {step}</span>
        </div>
        <div className="flex items-center space-x-2">
          {step !== "intro" && step !== "processing" && (
            <button onClick={() => setStep("intro")} className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#312F2F] text-sm">Back to start</button>
          )}
          {step === "review" && (
            <button onClick={() => setStep("archive")} className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#312F2F] text-sm">Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OCRPage;
