import { Home, Search, Save, Share, Settings, Moon, Sun } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const [darkMode, setDarkMode] = useState(true);
  
  const navItems = [
    { icon: Home, label: "Home", active: true },
    { icon: Search, label: "Search" },
    { icon: Save, label: "Save" },
    { icon: Share, label: "Share" },
    { icon: Settings, label: "Setting" },
  ];

  return (
    <div className="w-[75px] bg-[#1F1D1D] border-r border-black flex flex-col items-center py-6">
      {/* Logo */}
      <div className="w-11 h-11 mb-16 flex items-center justify-center">
        <div className="text-2xl font-bold text-white">D</div>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col space-y-8">
        {navItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-1">
            <div className={`p-2 rounded-lg transition-colors ${
              item.active ? "text-[#48736F]" : "text-white hover:text-gray-300"
            }`}>
              <item.icon size={24} />
            </div>
            <span className={`text-xs font-inter ${
              item.active ? "text-[#48736F] font-bold" : "text-white"
            }`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="mt-auto mb-8">
        <div className="relative w-11 h-20 bg-black/90 rounded-full">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className={`w-10 h-11 rounded-full transition-all duration-300 ${
              darkMode ? "bg-[#322F2F]/90 translate-y-4" : "bg-[#322F2F]/90 -translate-y-4"
            } flex items-center justify-center`}>
              {darkMode ? (
                <Moon size={16} className="text-white" />
              ) : (
                <Sun size={16} className="text-white" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* User Avatar */}
      <div className="w-12 h-12 rounded-full bg-gray-400 overflow-hidden">
        <img 
          src="https://api.builder.io/api/v1/image/assets/TEMP/dab374e7eb5132b235089f06e892c001ff4eb2d2?width=112" 
          alt="User avatar" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
