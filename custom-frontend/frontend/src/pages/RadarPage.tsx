import { useMemo, useState } from "react";
import { Filter, Send, Tag } from "lucide-react";

type Category = "TVs" | "Smartphones" | "Laptops" | "Audio" | "Wearables" | "Components";

const CATEGORIES: Category[] = [
  "TVs",
  "Smartphones",
  "Laptops",
  "Audio",
  "Wearables",
  "Components",
];

const ITEMS: { id: number; title: string; category: Category; summary: string }[] = [
  { id: 1, title: "OLED Evo 2025", category: "TVs", summary: "LG's brighter OLED with MLA and 144Hz" },
  { id: 2, title: "QD-OLED Gen3", category: "TVs", summary: "Samsung's anti-glare coating update" },
  { id: 3, title: "MiniLED 3K", category: "Laptops", summary: "High brightness panels for pros" },
  { id: 4, title: "Snapdragon X2", category: "Laptops", summary: "Next-gen NPU powered PCs" },
  { id: 5, title: "MagSafe ANC Buds", category: "Audio", summary: "Lossless LE Audio-ready earbuds" },
  { id: 6, title: "UWB Ring", category: "Wearables", summary: "Low-power continuous sensing" },
  { id: 7, title: "8K MicroLED", category: "TVs", summary: "Modular premium displays" },
  { id: 8, title: "BOMS 3nm", category: "Components", summary: "3nm SoCs hit mainstream" },
  { id: 9, title: "Periscope 6x", category: "Smartphones", summary: "Better telephoto at compact sizes" },
];

export function RadarPage() {
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const [messages, setMessages] = useState<{ id: number; role: "user" | "assistant"; text: string }[]>([
    { id: 1, role: "assistant", text: "Hi! Ask me about the latest electronics trends or filter categories to explore." },
  ]);
  const [input, setInput] = useState("");

  const filtered = useMemo(() => {
    if (!selected.size) return ITEMS;
    return ITEMS.filter((i) => selected.has(i.category));
  }, [selected]);

  const toggle = (c: Category) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  };

  const send = () => {
    const content = input.trim();
    if (!content) return;
    const id = Date.now();
    const newMessages = [
      ...messages,
      { id, role: "user", text: content },
      {
        id: id + 1,
        role: "assistant",
        text:
          selected.size
            ? `Here are highlights in ${[...selected].join(", ")}. Try commands like: "top TVs under $1000" or "compare OLED vs MiniLED".`
            : "Tip: use the filters to narrow down categories, then ask me to find best picks or compare items.",
      },
    ];
    setMessages(newMessages);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col lg:flex-row bg-white dark:bg-[#1F1D1D] text-[#1F1D1D] dark:text-white">
      {/* Main content */}
      <div className="flex-1 min-w-0 p-4 md:p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Electronics Radar</h1>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-black/10 dark:border-[#312F2F] p-4">
          <div className="flex items-center mb-3">
            <Filter className="mr-2" size={18} />
            <span className="font-medium">Filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => toggle(c)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selected.has(c)
                    ? "bg-[#322F2F] text-white border-transparent"
                    : "bg-transparent text-[#1F1D1D] dark:text-white border-black/20 dark:border-[#312F2F]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-lg p-4 bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-transparent"
            >
              <div className="flex items-center mb-2">
                <Tag size={16} className="mr-2" />
                <span className="text-xs opacity-80">{item.category}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
              <p className="text-sm opacity-90">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-black/10 dark:border-[#312F2F] flex flex-col">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Radar Assistant</h2>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-[#312F2F] text-white"
                  : "bg-gray-100 dark:bg-[#312F2F]"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3">
          <div className="flex items-center bg-gray-100 dark:bg-[#312F2F] rounded-3xl px-3 py-2">
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Ask the radar..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={send}
              className="ml-2 px-3 py-1.5 rounded-full text-sm bg-[#312F2F] text-white hover:bg-[#3a3737]"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
