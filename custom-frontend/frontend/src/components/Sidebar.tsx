import { MessageSquare, Settings, Moon, Sun, Radar, FileText } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { Page } from "./MainShell";

export function Sidebar({
  activePage,
  onNavigate,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
}) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // noop to ensure theme hook runs once in sidebar mount
  }, []);

  const navItems: { icon: any; label: string; key: Page }[] = [
    { icon: MessageSquare, label: "Chat", key: "chat" },
    { icon: FileText, label: "Documents", key: "documents" },
    { icon: Radar, label: "Radar", key: "radar" },
    { icon: Settings, label: "Settings", key: "settings" },
  ];

  return (
    <div className="w-[75px] bg-white dark:bg-[#1F1D1D] border-r border-black/20 dark:border-black flex flex-col items-center py-6">
      {/* Logo */}
      <div className="w-11 h-11 mb-16 flex items-center justify-center">
        <div className="text-2xl font-bold text-[#1F1D1D] dark:text-white">D</div>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col space-y-8">
        {navItems.map((item) => {
          const active = activePage === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="flex flex-col items-center space-y-1"
            >
              <div
                className={`p-2 rounded-lg transition-colors ${
                  active
                    ? "text-[#48736F]"
                    : "text-[#1F1D1D] dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon size={24} />
              </div>
              <span
                className={`text-xs font-inter ${
                  active ? "text-[#48736F] font-bold" : "text-[#1F1D1D] dark:text-white"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="mt-auto mb-8">
        <div className="relative w-11 h-20 bg-black/10 dark:bg-black/90 rounded-full">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="absolute inset-0 flex flex-col items-center justify-center"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <div
              className={`w-10 h-11 rounded-full transition-all duration-300 bg-[#322F2F]/20 dark:bg-[#322F2F]/90 ${
                theme === "dark" ? "translate-y-4" : "-translate-y-4"
              } flex items-center justify-center`}
            >
              {theme === "dark" ? (
                <Moon size={16} className="text-white" />
              ) : (
                <Sun size={16} className="text-[#1F1D1D]" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* User Avatar */}
      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-400 overflow-hidden">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/dab374e7eb5132b235089f06e892c001ff4eb2d2?width=112"
          alt="User avatar"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
