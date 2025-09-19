import { useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  Filter,
} from "lucide-react";

type DocQuality = "Excellent" | "Good" | "Needs Review";

type ArchiveItem = {
  id: string;
  supplier?: string;
  invoiceNo?: string;
  date?: string;
  amount?: string;
  quality: DocQuality;
};

type FieldType = "string" | "number" | "integer" | "boolean";

type FieldDef = {
  name: string;
  type: FieldType;
  description?: string;
  required: boolean;
  enum?: string[];
};

type DocTypeDef = {
  id: string;
  name: string;
  prompt: string;
  fields: FieldDef[];
  items: ArchiveItem[];
};

type ExtractedField = { key: string; value: string; confidence: number };

type Step = "dashboard" | "processing" | "review" | "detail";

function percentForQuality(items: ArchiveItem[]): number {
  if (!items.length) return 0;
  const good = items.filter((i) => i.quality !== "Needs Review").length;
  return Math.round((good / items.length) * 100);
}

function schemaFromFields(fields: FieldDef[]) {
  const required = fields.filter((f) => f.required).map((f) => f.name);
  const properties: Record<string, any> = {};
  for (const f of fields) {
    const base: any = { type: f.type };
    if (f.description) base.description = f.description;
    if (f.enum && f.enum.length && f.type === "string") base.enum = f.enum;
    properties[f.name] = base;
  }
  return {
    type: "object",
    properties,
    ...(required.length ? { required } : {}),
    additionalProperties: false,
  };
}

export function OCRPage() {
  const [step, setStep] = useState<Step>("dashboard");
  const [docTypes, setDocTypes] = useState<DocTypeDef[]>([
    {
      id: "invoice",
      name: "Invoice",
      prompt:
        "Extract invoice data with high accuracy. Return invoice_number, amount, date, supplier as defined in the schema.",
      fields: [
        { name: "Invoice number", type: "string", required: true, description: "Invoice identifier" },
        { name: "Amount", type: "string", required: true, description: "Gross amount with currency" },
        { name: "Date", type: "string", required: true, description: "Invoice date as DD.MM.YYYY" },
        { name: "Supplier", type: "string", required: true, description: "Supplier name" },
      ],
      items: [
        {
          id: "DOC-2001",
          supplier: "Müller & Partner GmbH",
          invoiceNo: "RE-2024-001",
          date: "15.03.2024",
          amount: "1.247,50 €",
          quality: "Excellent",
        },
      ],
    },
    {
      id: "contract",
      name: "Contract",
      prompt: "Extract core contract metadata per schema.",
      fields: [
        { name: "Counterparty", type: "string", required: true },
        { name: "Start date", type: "string", required: false },
        { name: "End date", type: "string", required: false },
      ],
      items: [
        {
          id: "DOC-2002",
          supplier: "Alpha Consulting",
          date: "01.02.2024",
          quality: "Good",
        },
      ],
    },
    {
      id: "delivery",
      name: "Delivery Note",
      prompt: "Extract delivery slip details per schema.",
      fields: [
        { name: "Delivery no.", type: "string", required: true },
        { name: "Date", type: "string", required: true },
        { name: "Supplier", type: "string", required: false },
      ],
      items: [
        {
          id: "DOC-2003",
          supplier: "Beta Supplies",
          date: "28.02.2024",
          quality: "Needs Review",
        },
      ],
    },
  ]);

  const [selectedTypeId, setSelectedTypeId] = useState<string>("invoice");
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedField[]>([]);

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [modalTypeId, setModalTypeId] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypePrompt, setNewTypePrompt] = useState("");
  const [fieldDraft, setFieldDraft] = useState<{ name: string; type: FieldType; required: boolean; description: string; enumText: string }>({ name: "", type: "string", required: true, description: "", enumText: "" });
  const [search, setSearch] = useState("");
  const [qualityFilter, setQualityFilter] = useState<DocQuality | "All">("All");

  const selectedType = useMemo(
    () => docTypes.find((t) => t.id === selectedTypeId) || docTypes[0],
    [docTypes, selectedTypeId]
  );

  useEffect(() => {
    if (step === "processing") {
      const t = setTimeout(() => setStep("review"), 1200);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleStartUpload = (file: File, typeId?: string) => {
    const tId = typeId || selectedTypeId;
    const t = docTypes.find((d) => d.id === tId);
    if (!t) return;
    setSelectedTypeId(tId);
    setFileName(file.name);
    setExtracted(t.fields.map((f) => ({ key: f.name, value: "", confidence: 65 })));
    setStep("processing");
  };

  const updateField = (key: string, value: string) => {
    setExtracted((prev) =>
      prev.map((f) =>
        f.key === key
          ? {
              ...f,
              value,
              confidence: Math.min(100, Math.max(85, f.confidence + 5)),
            }
          : f
      )
    );
  };

  const overallQuality = useMemo(() => {
    if (!extracted.length) return { label: "Needs Review" as DocQuality, cls: "bg-red-400 text-white" };
    const avg = extracted.reduce((a, f) => a + f.confidence, 0) / extracted.length;
    if (avg >= 90) return { label: "Excellent" as DocQuality, cls: "bg-[#00FF38] text-black" };
    if (avg >= 75) return { label: "Good" as DocQuality, cls: "bg-yellow-400 text-black" };
    return { label: "Needs Review" as DocQuality, cls: "bg-red-400 text-white" };
  }, [extracted]);

  const saveReviewed = () => {
    const quality: DocQuality = overallQuality.label;
    setDocTypes((prev) =>
      prev.map((t) =>
        t.id === selectedTypeId
          ? {
              ...t,
              items: [
                {
                  id: `DOC-${Math.floor(Math.random() * 9000) + 1000}`,
                  supplier: extracted.find((e) => e.key.toLowerCase().includes("supplier"))?.value,
                  invoiceNo: extracted.find((e) => e.key.toLowerCase().includes("invoice"))?.value,
                  date: extracted.find((e) => e.key.toLowerCase().includes("date"))?.value,
                  amount: extracted.find((e) => e.key.toLowerCase().includes("amount"))?.value,
                  quality,
                },
                ...t.items,
              ],
            }
          : t
      )
    );
    setStep("dashboard");
    setFileName(null);
    setExtracted([]);
  };

  const addDocType = () => {
    const name = newTypeName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, "-");
    if (docTypes.some((d) => d.id === id)) return;
    setDocTypes((p) => [{ id, name, prompt: newTypePrompt.trim(), fields: [], items: [] }, ...p]);
    setNewTypeName("");
    setNewTypePrompt("");
    setModalTypeId(id);
  };

  const deleteDocType = (id: string) => {
    if (docTypes.length <= 1) return;
    setDocTypes((p) => p.filter((d) => d.id !== id));
    if (selectedTypeId === id && docTypes[0]) setSelectedTypeId(docTypes[0].id);
  };

  const openEditFields = (id: string) => {
    setModalTypeId(id);
    setShowTypeModal(true);
  };

  const addFieldToType = () => {
    if (!modalTypeId) return;
    const name = fieldDraft.name.trim();
    if (!name) return;
    setDocTypes((p) =>
      p.map((t) =>
        t.id === modalTypeId && !t.fields.find((f) => f.name === name)
          ? {
              ...t,
              fields: [
                ...t.fields,
                {
                  name,
                  type: fieldDraft.type,
                  required: fieldDraft.required,
                  description: fieldDraft.description.trim() || undefined,
                  enum: fieldDraft.enumText
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              ],
            }
          : t
      )
    );
    setFieldDraft({ name: "", type: "string", required: true, description: "", enumText: "" });
  };

  const updateFieldAt = (index: number, patch: Partial<FieldDef>) => {
    if (!modalTypeId) return;
    setDocTypes((p) =>
      p.map((t) =>
        t.id === modalTypeId
          ? {
              ...t,
              fields: t.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
            }
          : t
      )
    );
  };

  const removeFieldAt = (index: number) => {
    if (!modalTypeId) return;
    setDocTypes((p) =>
      p.map((t) => (t.id === modalTypeId ? { ...t, fields: t.fields.filter((_, i) => i !== index) } : t))
    );
  };

  const updatePrompt = (id: string, prompt: string) => {
    setDocTypes((p) => p.map((t) => (t.id === id ? { ...t, prompt } : t)));
  };

  const filteredItems = (t: DocTypeDef) =>
    t.items.filter((it) => {
      const textMatch = search
        ? [it.id, it.supplier, it.invoiceNo, it.date, it.amount]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
        : true;
      const qMatch = qualityFilter === "All" ? true : it.quality === qualityFilter;
      return textMatch && qMatch;
    });

  return (
    <div className="h-full bg-white dark:bg-[#1F1D1D] text-[#1F1D1D] dark:text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-[#312F2F] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gray-200 dark:bg-[#312F2F]">
            <FileText size={20} className="text-[#1F1D1D] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Smart OCR</h1>
            <p className="text-xs text-[#767876]">Upload, extract and continuously improve structured data</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setNewTypeName("");
              setNewTypePrompt("");
              setModalTypeId(null);
              setShowTypeModal(true);
            }}
            className="px-3 py-2 text-xs rounded-full bg-gray-200 dark:bg-[#312F2F] flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>New Type</span>
          </button>
        </div>
      </div>

      {/* Prominent Upload Bar */}
      <div className="p-4 border-b border-black/10 dark:border-[#312F2F]">
        <div className="rounded-2xl bg-gray-200 dark:bg-[#312F2F] p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] flex items-center gap-2">
              <FileText size={16} />
              <select
                className="bg-transparent outline-none text-sm"
                value={selectedType?.id}
                onChange={(e) => setSelectedTypeId(e.target.value)}
              >
                {docTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => {
              const el = document.createElement("input");
              el.type = "file";
              el.accept = "application/pdf,image/*";
              el.onchange = (ev: any) => {
                const file = ev.target.files?.[0];
                if (file) handleStartUpload(file);
              };
              el.click();
            }}
            className="w-full md:w-auto px-5 py-3 rounded-full bg-[#00FF38] text-black font-semibold flex items-center justify-center gap-2"
          >
            <Upload size={16} /> Upload document
          </button>
        </div>
      </div>

      {/* Dashboard: cards per document type (Overview + Archive merged) */}
      {step === "dashboard" && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Filters for recent items */}
          <div className="rounded-2xl bg-gray-200 dark:bg-[#312F2F] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-white/60" />
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search supplier, number, date..."
                  className="w-72 pl-10 pr-4 py-2.5 bg-gray-200 dark:bg-[#201d1d] rounded-full border-none outline-none text-[#1F1D1D]/60 dark:text-white/60 text-xs placeholder-black/60 dark:placeholder-white/60"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={18} />
                <select
                  value={qualityFilter}
                  onChange={(e) => setQualityFilter(e.target.value as DocQuality | "All")}
                  className="px-3 pr-8 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
                >
                  <option>All</option>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Needs Review</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#767876]">
              <BarChart2 size={16} /> Overall health across types
            </div>
          </div>

          {/* Grid of doc type cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Add card */}
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] border border-dashed border-black/20 dark:border-black/40 flex items-center justify-center">
              <div className="text-center">
                <button
                  onClick={() => {
                    setNewTypeName("");
                    setNewTypePrompt("");
                    setModalTypeId(null);
                    setShowTypeModal(true);
                  }}
                  className="px-4 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm flex items-center gap-2"
                >
                  <Plus size={16} /> Add document type
                </button>
              </div>
            </div>

            {docTypes.map((t) => {
              const items = filteredItems(t);
              const success = percentForQuality(items);
              const schemaPreview = JSON.stringify(schemaFromFields(t.fields), null, 2);
              return (
                <div key={t.id} className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t.name}</h3>
                      <div className="text-xs text-[#767876]">{t.fields.length} fields • {t.items.length} docs</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        title="Delete type"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => deleteDocType(t.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="px-2 py-1 rounded-full text-xs bg-[#00FF38] text-black font-semibold">{success}% OK</div>
                    <div className="px-2 py-1 rounded-full text-xs bg-yellow-400 text-black">{items.filter((i) => i.quality === "Good").length} good</div>
                    <div className="px-2 py-1 rounded-full text-xs bg-red-400 text-white">{items.filter((i) => i.quality === "Needs Review").length} review</div>
                  </div>

                  {t.prompt ? (
                    <div className="mt-3 text-xs text-[#767876] line-clamp-2">{t.prompt}</div>
                  ) : (
                    <div className="mt-3 text-xs text-[#767876] italic">No prompt yet</div>
                  )}

                  {/* Schema preview */}
                  <div className="mt-3 rounded-lg bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] p-2">
                    <div className="text-[11px] text-[#767876] mb-1">Schema</div>
                    <pre className="text-[11px] overflow-auto max-h-24">
{schemaPreview}
</pre>
                  </div>

                  {/* Recent items */}
                  {items.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {items.slice(0, 3).map((it) => (
                        <div key={it.id} className="p-3 rounded-lg bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold">{it.id}</div>
                            <div className="text-[11px] text-[#767876]">
                              {it.supplier || it.invoiceNo || it.date || it.amount || "—"}
                            </div>
                          </div>
                          <span
                            className={`text-[11px] px-2 py-1 rounded-full ${
                              it.quality === "Excellent"
                                ? "bg-[#00FF38] text-black"
                                : it.quality === "Good"
                                ? "bg-yellow-400 text-black"
                                : "bg-red-400 text-white"
                            }`}
                          >
                            {it.quality}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openEditFields(t.id)}
                      className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center justify-center gap-2"
                    >
                      <Edit size={16} /> Edit fields
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTypeId(t.id);
                        setStep("detail");
                      }}
                      className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center justify-center gap-2"
                    >
                      <Eye size={16} /> Details
                    </button>
                    <label className="px-3 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm flex items-center justify-center gap-2 cursor-pointer">
                      <Upload size={16} /> Upload
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleStartUpload(f, t.id);
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail view per document type */}
      {step === "detail" && selectedType && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{selectedType.name}</h2>
              <div className="text-xs text-[#767876]">{selectedType.fields.length} fields • {selectedType.items.length} documents</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setStep("dashboard")} className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#312F2F] text-sm">Back</button>
              <button onClick={() => openEditFields(selectedType.id)} className="px-3 py-2 rounded-full bg-gray-200 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center gap-2"><Edit size={16} /> Edit fields</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="text-xs text-[#767876] mb-1">Success rate</div>
              <div className="text-2xl font-semibold">{percentForQuality(filteredItems(selectedType))}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="text-xs text-[#767876] mb-1">Processed</div>
              <div className="text-2xl font-semibold">{filteredItems(selectedType).length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="text-xs text-[#767876] mb-1">Fields</div>
              <div className="text-2xl font-semibold">{selectedType.fields.length}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl bg-gray-200 dark:bg-[#312F2F] p-4 flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search supplier, number, date..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-200 dark:bg-[#201d1d] rounded-full border-none outline-none text-[#1F1D1D]/60 dark:text-white/60 text-xs placeholder-black/60 dark:placeholder-white/60"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={18} />
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value as DocQuality | "All")}
                className="px-3 pr-8 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
              >
                <option>All</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Needs Review</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredItems(selectedType).map((it) => (
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
                  {it.invoiceNo && <div>Invoice no.: {it.invoiceNo}</div>}
                  {it.supplier && <div>Supplier: {it.supplier}</div>}
                  {it.amount && <div>Amount: {it.amount}</div>}
                  {it.date && <div>Date: {it.date}</div>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button className="px-3 py-1 rounded-full bg-[#322F2F]/90 text-white text-xs">View</button>
                  <button className="text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing */}
      {step === "processing" && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-gray-200 dark:bg-[#312F2F] text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="animate-spin" />
            </div>
            <p className="text-sm">Analyzing {fileName} as {selectedType?.name}...</p>
            <div className="h-2 mt-4 rounded-full bg-black/10 dark:bg-black/40 overflow-hidden">
              <div className="h-full w-1/2 bg-[#00FF38] animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Review */}
      {step === "review" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F] min-h-[420px] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-sm text-[#767876]">Original document</div>
                <div className="w-72 h-96 bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] rounded-lg flex items-center justify-center">
                  <FileText className="text-[#767876]" />
                </div>
                <div className="mt-3 text-xs text-[#767876]">{fileName || "document.pdf"}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-200 dark:bg-[#312F2F]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Extracted data • {selectedType?.name}</h3>
                <div className={`px-3 py-1 rounded-full text-xs ${overallQuality.cls}`}>{overallQuality.label}</div>
              </div>
              <div className="space-y-3">
                {extracted.map((f) => (
                  <div key={f.key} className="p-3 rounded-lg bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold">{f.key}</div>
                      <div className={`text-xs font-semibold ${
                        f.confidence >= 90
                          ? "text-[#21FF5F]"
                          : f.confidence >= 70
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}>{f.confidence}%</div>
                    </div>
                    <input
                      value={f.value}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-[#312F2F] text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={saveReviewed}
                  className="px-4 py-2 rounded-full bg-[#00FF38] text-black text-sm font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Save & finish
                </button>
                <button onClick={() => setStep("dashboard")} className="px-4 py-2 rounded-full bg-gray-200 dark:bg-[#312F2F] text-sm">
                  Cancel
                </button>
                <button onClick={() => {
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
                }} className="px-4 py-2 rounded-full bg-gray-200 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center gap-2">
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fields & Prompt modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F]">
            <div className="p-4 border-b border-black/10 dark:border-[#312F2F] flex items-center justify-between">
              <div className="font-semibold text-lg">{modalTypeId ? "Edit document type" : "Add document type"}</div>
              <button className="text-[#767876]" onClick={() => setShowTypeModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-5">
              {!modalTypeId && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#767876]">Name</label>
                    <input
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="e.g. Purchase Order"
                      className="mt-1 w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-[#312F2F] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#767876]">Prompt</label>
                    <textarea
                      value={newTypePrompt}
                      onChange={(e) => setNewTypePrompt(e.target.value)}
                      placeholder="Describe how the AI should extract the fields defined in the schema..."
                      className="mt-1 w-full min-h-40 px-3 py-2 rounded-md bg-gray-200 dark:bg-[#312F2F] text-sm"
                    />
                  </div>
                  <div className="pt-1">
                    <button onClick={addDocType} className="px-4 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm flex items-center gap-2">
                      <Plus size={16} /> Create type
                    </button>
                  </div>
                </div>
              )}

              {modalTypeId && (
                <TypeEditor
                  typeDef={docTypes.find((t) => t.id === modalTypeId)!}
                  onPromptChange={(p) => updatePrompt(modalTypeId!, p)}
                  fieldDraft={fieldDraft}
                  setFieldDraft={setFieldDraft}
                  onAddField={addFieldToType}
                  onUpdateField={updateFieldAt}
                  onRemoveField={removeFieldAt}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TypeEditor({
  typeDef,
  onPromptChange,
  fieldDraft,
  setFieldDraft,
  onAddField,
  onUpdateField,
  onRemoveField,
}: {
  typeDef: DocTypeDef;
  onPromptChange: (p: string) => void;
  fieldDraft: { name: string; type: FieldType; required: boolean; description: string; enumText: string };
  setFieldDraft: (v: { name: string; type: FieldType; required: boolean; description: string; enumText: string }) => void;
  onAddField: () => void;
  onUpdateField: (index: number, patch: Partial<FieldDef>) => void;
  onRemoveField: (index: number) => void;
}) {
  const schemaPreview = JSON.stringify(schemaFromFields(typeDef.fields), null, 2);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-[#767876] mb-1">Prompt</div>
        <textarea
          value={typeDef.prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe how the AI should extract the fields defined in the schema..."
          className="w-full min-h-40 px-3 py-2 rounded-md bg-gray-200 dark:bg-[#312F2F] text-sm"
        />
      </div>

      {/* Fields table */}
      <div>
        <div className="text-xs text-[#767876] mb-2">Fields</div>
        <div className="space-y-2">
          {typeDef.fields.map((f, i) => (
            <div key={`${f.name}-${i}`} className="p-3 rounded-lg bg-gray-200 dark:bg-[#312F2F] grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
              <input
                value={f.name}
                onChange={(e) => onUpdateField(i, { name: e.target.value })}
                placeholder="Field name"
                className="md:col-span-2 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
              />
              <select
                value={f.type}
                onChange={(e) => onUpdateField(i, { type: e.target.value as FieldType })}
                className="px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="integer">integer</option>
                <option value="boolean">boolean</option>
              </select>
              <input
                value={f.description || ""}
                onChange={(e) => onUpdateField(i, { description: e.target.value })}
                placeholder="Description"
                className="md:col-span-2 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) => onUpdateField(i, { required: e.target.checked })}
                />
                Required
              </label>
              {f.type === "string" && (
                <input
                  value={(f.enum || []).join(", ")}
                  onChange={(e) => onUpdateField(i, { enum: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="Enum (comma-separated)"
                  className="md:col-span-3 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
                />
              )}
              <div className="md:col-span-1 flex justify-end">
                <button className="text-red-400" onClick={() => onRemoveField(i)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add field row */}
        <div className="mt-3 p-3 rounded-lg bg-gray-200 dark:bg-[#312F2F] grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
          <input
            value={fieldDraft.name}
            onChange={(e) => setFieldDraft({ ...fieldDraft, name: e.target.value })}
            placeholder="Field name"
            className="md:col-span-2 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
          />
          <select
            value={fieldDraft.type}
            onChange={(e) => setFieldDraft({ ...fieldDraft, type: e.target.value as FieldType })}
            className="px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="integer">integer</option>
            <option value="boolean">boolean</option>
          </select>
          <input
            value={fieldDraft.description}
            onChange={(e) => setFieldDraft({ ...fieldDraft, description: e.target.value })}
            placeholder="Description"
            className="md:col-span-2 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={fieldDraft.required}
              onChange={(e) => setFieldDraft({ ...fieldDraft, required: e.target.checked })}
            />
            Required
          </label>
          <input
            value={fieldDraft.enumText}
            onChange={(e) => setFieldDraft({ ...fieldDraft, enumText: e.target.value })}
            placeholder="Enum (comma-separated)"
            className="md:col-span-3 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
          />
          <div className="md:col-span-1 flex justify-end">
            <button onClick={onAddField} className="px-3 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm flex items-center gap-2">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Schema preview */}
      <div>
        <div className="text-xs text-[#767876] mb-1">JSON Schema (for OpenAI structured outputs)</div>
        <div className="rounded-lg bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] p-2">
          <pre className="text-[11px] overflow-auto max-h-48">
{schemaPreview}
</pre>
        </div>
      </div>
    </div>
  );
}

export default OCRPage;
