import { useMemo, useState } from "react";
import { Edit, Upload } from "lucide-react";
import type { DocTypeDef } from "./OCRPage";

function LineChart({ data, height = 140 }: { data: number[]; height?: number }) {
  const width = 520;
  const pad = 12;
  const points = useMemo(() => {
    const n = data.length;
    if (!n) return [] as { x: number; y: number }[];
    const stepX = n > 1 ? (width - pad * 2) / (n - 1) : 0;
    return data.map((v, i) => {
      const clamped = Math.max(0, Math.min(100, v));
      const x = pad + i * stepX;
      const y = pad + (height - pad * 2) * (1 - clamped / 100);
      return { x, y };
    });
  }, [data, height]);

  const pathD = useMemo(() => {
    if (!points.length) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  }, [points]);

  const areaD = useMemo(() => {
    if (!points.length) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return [
      `M${first.x},${height - pad}`,
      ...points.map((p) => `L${p.x},${p.y}`),
      `L${last.x},${height - pad}`,
      "Z",
    ].join(" ");
  }, [points, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[140px]">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00FF38" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00FF38" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g>
        <rect x={pad} y={pad} width={width - pad * 2} height={height - pad * 2} fill="none" />
        {/* horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((t) => (
          <line key={t} x1={pad} x2={width - pad} y1={pad + (height - pad * 2) * (1 - t / 100)} y2={pad + (height - pad * 2) * (1 - t / 100)} stroke="currentColor" opacity={0.1} />
        ))}
        {/* area */}
        {areaD && <path d={areaD} fill="url(#grad)" />}
        {/* line */}
        {pathD && <path d={pathD} stroke="#00FF38" strokeWidth={2} fill="none" />}
        {/* points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill="#00FF38" />
        ))}
      </g>
    </svg>
  );
}

export function OCRDetailPage({ typeDef, onBack, onEdit }: { typeDef: DocTypeDef; onBack: () => void; onEdit: (id: string) => void }) {
  const items = typeDef.items;
  const series = useMemo(() => (typeDef.weeklySuccess || []).slice(-12), [typeDef.weeklySuccess]);
  const avg = useMemo(() => (series.length ? Math.round(series.reduce((a, b) => a + b, 0) / series.length) : 0), [series]);
  const [view, setView] = useState<"overview" | "schema">("overview");

  return (
    <div className="h-full bg-white dark:bg-[#1F1D1D] text-[#1F1D1D] dark:text-white flex flex-col">
      <div className="border-b border-black/10 dark:border-[#312F2F] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-xs">Back</button>
          <h2 className="text-xl font-semibold">{typeDef.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(typeDef.id)} className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-xs flex items-center gap-2">
            <Edit size={14} /> Edit
          </button>
          <label className="px-3 py-1.5 rounded-full bg-white dark:bg-[#1F1D1D] border border-black/10 dark:border-[#312F2F] text-xs cursor-pointer flex items-center gap-2">
            <Upload size={14} /> Upload
            <input type="file" accept="application/pdf,image/*" className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div className="rounded-full border border-black/10 dark:border-[#312F2F] bg-white dark:bg-[#1F1D1D] p-1 flex">
              <button
                onClick={() => setView("overview")}
                className={`px-3 py-1.5 rounded-full text-sm ${view === "overview" ? "bg-gray-100 dark:bg-[#312F2F]" : ""}`}
              >
                Overview
              </button>
              <button
                onClick={() => setView("schema")}
                className={`px-3 py-1.5 rounded-full text-sm ${view === "schema" ? "bg-gray-100 dark:bg-[#312F2F]" : ""}`}
              >
                Schema
              </button>
            </div>
          </div>

          {view === "overview" ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] shadow-sm">
                  <div className="text-xs text-[#767876]">Documents</div>
                  <div className="text-xl font-semibold">{items.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] shadow-sm">
                  <div className="text-xs text-[#767876]">Avg completion</div>
                  <div className="text-xl font-semibold">{avg}%</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] shadow-sm">
                  <div className="text-xs text-[#767876]">Fields</div>
                  <div className="text-xl font-semibold">{typeDef.fields.length}</div>
                </div>
              </div>

              {/* Completion line chart */}
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">Completion rate</div>
                  <div className="text-xs text-[#767876]">Last {series.length || 0} weeks</div>
                </div>
                <LineChart data={series} />
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OCRDetailPage;
