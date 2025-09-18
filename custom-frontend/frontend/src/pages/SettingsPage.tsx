import { useTheme } from "@/hooks/useTheme";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-full bg-white dark:bg-[#1F1D1D] text-[#1F1D1D] dark:text-white p-6 overflow-auto">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Appearance</h2>
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-100 dark:bg-[#312F2F]">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Switch between light and dark mode</p>
          </div>
          <div className="space-x-2">
            <button
              className={`px-3 py-1 rounded-full border ${
                theme === "light" ? "bg-black/5 dark:bg-white/10" : ""
              }`}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              className={`px-3 py-1 rounded-full border ${
                theme === "dark" ? "bg-black/5 dark:bg-white/10" : ""
              }`}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">About</h2>
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-[#312F2F]">
          <p className="text-sm">Configure your preferences for the chat and radar experience.</p>
        </div>
      </section>
    </div>
  );
}
