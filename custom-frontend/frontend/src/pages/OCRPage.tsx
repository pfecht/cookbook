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
  LayoutGrid,
  List as ListIcon,
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

const TYPE_LABELS: Record<FieldType, string> = {
  string: "Text",
  number: "Number",
  integer: "Whole number",
  boolean: "Yes/No",
};

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

type ViewMode = "cards" | "list";

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
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
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

  const [editorTypeId, setEditorTypeId] = useState<string | null>(null);

  const selectedType = useMemo(
    () => docTypes.find((t) => t.id === selectedTypeId) || docTypes[0],
    [docTypes, selectedTypeId]
  );

  const totalDocs = useMemo(() => docTypes.reduce((a, t) => a + t.items.length, 0), [docTypes]);
  const overallPercent = useMemo(() => {
    const all = docTypes.flatMap((t) => t.items);
    return percentForQuality(all);
  }, [docTypes]);

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

  const addNewType = () => {
    const id = `type-${Date.now()}`;
    const next: DocTypeDef = { id, name: "New type", prompt: "", fields: [], items: [] };
    setDocTypes((p) => [next, ...p]);
    setEditorTypeId(id);
  };

  const deleteDocType = (id: string) => {
    if (docTypes.length <= 1) return;
    setDocTypes((p) => p.filter((d) => d.id !== id));
    if (selectedTypeId === id && docTypes[0]) setSelectedTypeId(docTypes[0].id);
    if (editorTypeId === id) setEditorTypeId(null);
  };

  const openEditor = (id: string) => setEditorTypeId(id);
  const closeEditor = () => setEditorTypeId(null);

  const updateType = (id: string, patch: Partial<DocTypeDef>) => {
    setDocTypes((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const updateFieldAt = (id: string, index: number, patch: Partial<FieldDef>) => {
    setDocTypes((p) =>
      p.map((t) =>
        t.id === id
          ? { ...t, fields: t.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)) }
          : t
      )
    );
  };

  const addFieldToType = (id: string, draft: { name: string; type: FieldType; required: boolean; description: string; enumText: string }) => {
    const name = draft.name.trim();
    if (!name) return;
    setDocTypes((p) =>
      p.map((t) =>
        t.id === id && !t.fields.find((f) => f.name === name)
          ? {
              ...t,
              fields: [
                ...t.fields,
                {
                  name,
                  type: draft.type,
                  required: draft.required,
                  description: draft.description.trim() || undefined,
                  enum:
                    draft.type === "string"
                      ? draft.enumText.split(",").map((s) => s.trim()).filter(Boolean)
                      : undefined,
                },
              ],
            }
          : t
      )
    );
  };

  const removeFieldAt = (id: string, index: number) => {
    setDocTypes((p) => p.map((t) => (t.id === id ? { ...t, fields: t.fields.filter((_, i) => i !== index) } : t)));
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

  const [search, setSearch] = useState("");
  const [qualityFilter, setQualityFilter] = useState<DocQuality | "All">("All");

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
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-full bg-gray-100 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] flex items-center gap-2">
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
            className="px-3 py-2 rounded-full bg-gray-100 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center gap-2"
          >
            <Upload size={16} /> Upload
          </button>
          <button onClick={addNewType} className="px-3 py-2 text-xs rounded-full bg-gray-100 dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] flex items-center gap-2">
            <Plus size={16} />
            <span>New Type</span>
          </button>
        </div>
      </div>

      {/* Content area with optional split editor */}
      <div className="flex-1 min-h-0 flex">
        {/* Main content */}
        <div className={`flex-1 overflow-auto p-4 space-y-4 ${editorTypeId ? "hidden lg:block" : "block"}`}>
          {/* Top summary + filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F]">
              <div className="text-xs text-[#767876]">Total documents</div>
              <div className="text-xl font-semibold">{totalDocs}</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F]">
              <div className="text-xs text-[#767876]">Success rate</div>
              <div className="text-xl font-semibold">{overallPercent}%</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F]">
              <div className="text-xs text-[#767876]">Document types</div>
              <div className="text-xl font-semibold">{docTypes.length}</div>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-100 dark:bg-[#312F2F] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-black/10 dark:border-[#312F2F] bg-white dark:bg-[#1F1D1D] p-1 flex">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${viewMode === "cards" ? "bg-gray-100 dark:bg-[#312F2F]" : ""}`}
                >
                  <LayoutGrid size={16} /> Cards
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${viewMode === "list" ? "bg-gray-100 dark:bg-[#312F2F]" : ""}`}
                >
                  <ListIcon size={16} /> List
                </button>
              </div>
            </div>
          </div>

          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-[#312F2F] border border-dashed border-black/20 dark:border-black/40 flex items-center justify-center">
                <div className="text-center">
                  <button onClick={addNewType} className="px-4 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm flex items-center gap-2">
                    <Plus size={16} /> Add document type
                  </button>
                </div>
              </div>

              {docTypes.map((t) => {
                const items = filteredItems(t);
                const success = percentForQuality(items);
                return (
                  <div key={t.id} className="p-4 rounded-2xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F]">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{t.name}</h3>
                        <div className="text-xs text-[#767876]">{t.fields.length} fields • {t.items.length} docs</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button title="Delete type" className="text-red-400 hover:text-red-300" onClick={() => deleteDocType(t.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="px-2 py-1 rounded-full text-xs border border-[#00FF38] text-[#00FF38] font-semibold">{success}% OK</div>
                      <div className="px-2 py-1 rounded-full text-xs border border-yellow-400 text-yellow-400">{items.filter((i) => i.quality === "Good").length} good</div>
                      <div className="px-2 py-1 rounded-full text-xs border border-red-400 text-red-400">{items.filter((i) => i.quality === "Needs Review").length} review</div>
                    </div>

                    {items.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {items.slice(0, 3).map((it) => (
                          <div key={it.id} className="p-3 rounded-lg bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold">{it.id}</div>
                              <div className="text-[11px] text-[#767876]">{it.supplier || it.invoiceNo || it.date || it.amount || "—"}</div>
                            </div>
                            <span className={`text-[11px] px-2 py-1 rounded-full border ${
                              it.quality === "Excellent"
                                ? "border-[#00FF38] text-[#00FF38]"
                                : it.quality === "Good"
                                ? "border-yellow-400 text-yellow-400"
                                : "border-red-400 text-red-400"
                            }`}>
                              {it.quality}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button onClick={() => openEditor(t.id)} className="px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center justify-center gap-2">
                        <Edit size={16} /> Edit fields
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTypeId(t.id);
                          setStep("detail");
                        }}
                        className="px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center justify-center gap-2"
                      >
                        <Eye size={16} /> Details
                      </button>
                      <label className="px-3 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center justify-center gap-2 cursor-pointer">
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
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] divide-y divide-black/10 dark:divide-[#312F2F]">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-[#767876]">
                <div className="col-span-4">Type</div>
                <div className="col-span-2">Fields</div>
                <div className="col-span-2">Documents</div>
                <div className="col-span-2">Success</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {docTypes.map((t) => {
                const items = filteredItems(t);
                const success = percentForQuality(items);
                return (
                  <div key={t.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-4">
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-[11px] text-[#767876] line-clamp-1">{t.prompt || "No prompt"}</div>
                    </div>
                    <div className="col-span-2 text-sm">{t.fields.length}</div>
                    <div className="col-span-2 text-sm">{t.items.length}</div>
                    <div className="col-span-2 text-sm">
                      <span className="px-2 py-1 rounded-full border border-[#00FF38] text-[#00FF38] text-[11px]">{success}% OK</span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button onClick={() => openEditor(t.id)} className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-xs">Edit</button>
                      <button
                        onClick={() => {
                          setSelectedTypeId(t.id);
                          setStep("detail");
                        }}
                        className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-xs"
                      >
                        Details
                      </button>
                      <label className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-xs cursor-pointer">
                        Upload
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
                      <button title="Delete" className="text-red-400" onClick={() => deleteDocType(t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Split editor panel */}
        {editorTypeId && (
          <aside className="w-full lg:w-[420px] border-l border-black/10 dark:border-[#312F2F] flex flex-col">
            <div className="p-4 border-b border-black/10 dark:border-[#312F2F] flex items-center justify-between">
              <div className="font-semibold">Edit document type</div>
              <button className="text-[#767876]" onClick={closeEditor}><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {docTypes.filter((t) => t.id === editorTypeId).map((t) => (
                <TypeEditor
                  key={t.id}
                  typeDef={t}
                  onChangeName={(name) => updateType(t.id, { name })}
                  onChangePrompt={(prompt) => updateType(t.id, { prompt })}
                  onUpdateField={(idx, patch) => updateFieldAt(t.id, idx, patch)}
                  onAddField={(draft) => addFieldToType(t.id, draft)}
                  onRemoveField={(idx) => removeFieldAt(t.id, idx)}
                />
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Processing */}
      {step === "processing" && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-gray-100 dark:bg-[#312F2F] text-center border border-black/10 dark:border-[#312F2F]">
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
            <div className="p-4 rounded-2xl bg-gray-100 dark:bg-[#312F2F] min-h-[420px] flex items-center justify-center border border-black/10 dark:border-[#312F2F]">
              <div className="text-center">
                <div className="mb-2 text-sm text-[#767876]">Original document</div>
                <div className="w-72 h-96 bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] rounded-lg flex items-center justify-center">
                  <FileText className="text-[#767876]" />
                </div>
                <div className="mt-3 text-xs text-[#767876]">{fileName || "document.pdf"}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F]">
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
                <button onClick={saveReviewed} className="px-4 py-2 rounded-full bg-[#00FF38] text-black text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} /> Save & finish
                </button>
                <button onClick={() => setStep("dashboard")} className="px-4 py-2 rounded-full bg-gray-100 dark:bg-[#312F2F] text-sm">Cancel</button>
                <button
                  onClick={() => {
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
                  }}
                  className="px-4 py-2 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm flex items-center gap-2"
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TypeEditor({
  typeDef,
  onChangeName,
  onChangePrompt,
  onUpdateField,
  onAddField,
  onRemoveField,
}: {
  typeDef: DocTypeDef;
  onChangeName: (name: string) => void;
  onChangePrompt: (prompt: string) => void;
  onUpdateField: (index: number, patch: Partial<FieldDef>) => void;
  onAddField: (draft: { name: string; type: FieldType; required: boolean; description: string; enumText: string }) => void;
  onRemoveField: (index: number) => void;
}) {
  const [draft, setDraft] = useState<{ name: string; type: FieldType; required: boolean; description: string; enumText: string }>({
    name: "",
    type: "string",
    required: true,
    description: "",
    enumText: "",
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-[#767876] mb-1">Name</div>
        <input
          value={typeDef.name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Type name"
          className="w-full px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
        />
      </div>
      <div>
        <div className="text-xs text-[#767876] mb-1">Prompt</div>
        <textarea
          value={typeDef.prompt}
          onChange={(e) => onChangePrompt(e.target.value)}
          placeholder="Describe how the AI should extract the fields..."
          className="w-full min-h-40 px-3 py-2 rounded-md bg-gray-200 dark:bg-[#312F2F] text-sm"
        />
      </div>

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
                <option value="string">{TYPE_LABELS.string}</option>
                <option value="number">{TYPE_LABELS.number}</option>
                <option value="integer">{TYPE_LABELS.integer}</option>
                <option value="boolean">{TYPE_LABELS.boolean}</option>
              </select>
              <input
                value={f.description || ""}
                onChange={(e) => onUpdateField(i, { description: e.target.value })}
                placeholder="Description"
                className="md:col-span-2 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
              />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={f.required} onChange={(e) => onUpdateField(i, { required: e.target.checked })} />
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
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Field name"
            className="md:col-span-2 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
          />
          <select
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as FieldType })}
            className="px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
          >
            <option value="string">{TYPE_LABELS.string}</option>
            <option value="number">{TYPE_LABELS.number}</option>
            <option value="integer">{TYPE_LABELS.integer}</option>
            <option value="boolean">{TYPE_LABELS.boolean}</option>
          </select>
          <input
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Description"
            className="md:col-span-2 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
          />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={draft.required} onChange={(e) => setDraft({ ...draft, required: e.target.checked })} />
            Required
          </label>
          <input
            value={draft.enumText}
            onChange={(e) => setDraft({ ...draft, enumText: e.target.value })}
            placeholder="Enum (comma-separated)"
            className="md:col-span-3 px-3 py-2 rounded-md bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-sm"
          />
          <div className="md:col-span-1 flex justify-end">
            <button onClick={() => onAddField(draft)} className="px-3 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm flex items-center gap-2">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 text-[11px] text-[#767876]">Note: Field types are stored for structured extraction.</div>
    </div>
  );
}

export default OCRPage;
