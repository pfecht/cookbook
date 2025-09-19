import { Upload } from "lucide-react";
import type { DocTypeDef } from "./OCRPage";

export function OCRDetailPage({ typeDef, onBack }: { typeDef: DocTypeDef; onBack: () => void }) {
  const items = typeDef.items;
  const weeks = (typeDef.weeklySuccess || []).concat((typeDef.weeklySuccess || []).slice(0, 4)).slice(0, 12);

  return (
    <div className="h-full bg-white dark:bg-[#1F1D1D] text-[#1F1D1D] dark:text-white flex flex-col">
      <div className="border-b border-black/10 dark:border-[#312F2F] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-xs">Back</button>
          <h2 className="text-xl font-semibold">{typeDef.name}</h2>
        </div>
        <label className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-xs cursor-pointer">
          <Upload size={14} /> Upload
          <input type="file" accept="application/pdf,image/*" className="hidden" />
        </label>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] shadow-sm">
              <div className="text-xs text-[#767876]">Documents</div>
              <div className="text-xl font-semibold">{items.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] shadow-sm">
              <div className="text-xs text-[#767876]">Avg success</div>
              <div className="text-xl font-semibold">{Math.round((weeks.reduce((a, b) => a + b, 0) / (weeks.length || 1)))}%</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] shadow-sm">
              <div className="text-xs text-[#767876]">Fields</div>
              <div className="text-xl font-semibold">{typeDef.fields.length}</div>
            </div>
          </div>

          {/* Success over time */}
          <div className="p-4 rounded-2xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">Success over time</div>
              <div className="text-xs text-[#767876]">Last 12 weeks</div>
            </div>
            <div className="h-28 flex items-end gap-2">
              {weeks.map((v, i) => (
                <div key={i} className="flex-1 bg-[#00FF38]" style={{ height: `${Math.max(8, Math.min(100, v))}%`, opacity: 0.25 + v/200 }} />
              ))}
            </div>
          </div>

          {/* Prompt and fields */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F]">
            <div className="text-sm font-semibold mb-2">Prompt</div>
            <div className="text-sm text-[#767876] whitespace-pre-wrap">{typeDef.prompt || "No prompt provided."}</div>
            <div className="mt-4 text-sm font-semibold">Fields</div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {typeDef.fields.map((f, i) => (
                <div key={`${f.name}-${i}`} className="p-3 rounded-lg bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F]">
                  <div className="font-medium text-sm">{f.name}</div>
                  <div className="text-[11px] text-[#767876]">{f.type}{f.required ? " • Required" : ""}</div>
                  {f.description && <div className="text-[11px] text-[#767876] mt-1">{f.description}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Items table */}
          <div className="rounded-2xl bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F]">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-[#767876]">
              <div className="col-span-3">ID</div>
              <div className="col-span-3">Main field</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2 text-right">Quality</div>
            </div>
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-t border-black/5 dark:border-[#312F2F]">
                <div className="col-span-3 text-sm font-medium">{it.id}</div>
                <div className="col-span-3 text-sm">{it.supplier || it.invoiceNo || "—"}</div>
                <div className="col-span-2 text-sm">{it.date || "—"}</div>
                <div className="col-span-2 text-sm">{it.amount || "—"}</div>
                <div className="col-span-2 text-right">
                  <span className={`text-[11px] px-2 py-1 rounded-full border ${
                    it.quality === "Excellent" ? "border-[#00FF38] text-[#00FF38]" : it.quality === "Good" ? "border-yellow-400 text-yellow-400" : "border-red-400 text-red-400"
                  }`}>{it.quality}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OCRDetailPage;
