import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";

const TABS = ["Edit Profile", "Preferences", "Security"] as const;

type Tab = typeof TABS[number];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("Edit Profile");

  return (
    <div className="h-full bg-white dark:bg-[#1F1D1D] text-[#1F1D1D] dark:text-white p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Settings</h1>

        <div className="rounded-2xl border border-black/10 dark:border-[#312F2F] bg-white dark:bg-[#1F1D1D]">
          {/* Tabs */}
          <div className="px-4 pt-4">
            <div className="flex gap-6 text-sm">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 border-b-2 -mb-px ${
                    tab === t ? "border-[#322F2F] text-[#322F2F] dark:text-white" : "border-transparent text-[#767876]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {tab === "Edit Profile" && <ProfileForm />}
            {tab === "Preferences" && <Preferences theme={theme} setTheme={setTheme} />}
            {tab === "Security" && <Security />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileForm() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left column with avatar */}
      <div className="md:col-span-2 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden">
          <img
            className="w-full h-full object-cover"
            src="https://api.builder.io/api/v1/image/assets/TEMP/dab374e7eb5132b235089f06e892c001ff4eb2d2?width=160"
            alt="Avatar"
          />
        </div>
        <div>
          <div className="text-sm text-[#767876]">Profile</div>
          <div className="text-lg font-semibold">Update your information</div>
        </div>
      </div>

      <div>
        <div className="text-xs text-[#767876] mb-1">Your Name</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="Jane Doe" />
      </div>
      <div>
        <div className="text-xs text-[#767876] mb-1">User Name</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="jane" />
      </div>

      <div>
        <div className="text-xs text-[#767876] mb-1">Email</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="jane@example.com" />
      </div>
      <div>
        <div className="text-xs text-[#767876] mb-1">Password</div>
        <input type="password" className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="********" />
      </div>

      <div>
        <div className="text-xs text-[#767876] mb-1">Date of Birth</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="25 January 1990" />
      </div>
      <div>
        <div className="text-xs text-[#767876] mb-1">Present Address</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="San Jose, California, USA" />
      </div>

      <div>
        <div className="text-xs text-[#767876] mb-1">Permanent Address</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="San Jose, California, USA" />
      </div>
      <div>
        <div className="text-xs text-[#767876] mb-1">City</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="San Jose" />
      </div>

      <div>
        <div className="text-xs text-[#767876] mb-1">Postal Code</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="45982" />
      </div>
      <div>
        <div className="text-xs text-[#767876] mb-1">Country</div>
        <input className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-[#312F2F] border border-black/10 dark:border-[#312F2F] text-sm" placeholder="USA" />
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button className="px-5 py-2 rounded-full bg-[#322F2F]/90 text-white text-sm">Save</button>
      </div>
    </div>
  );
}

function Preferences({ theme, setTheme }: { theme: "light" | "dark"; setTheme: (t: "light" | "dark") => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-[#767876]">Appearance</div>
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1.5 rounded-full border text-sm ${theme === "light" ? "bg-gray-100 dark:bg-[#312F2F]" : ""}`}
          onClick={() => setTheme("light")}
        >
          Light
        </button>
        <button
          className={`px-3 py-1.5 rounded-full border text-sm ${theme === "dark" ? "bg-gray-100 dark:bg-[#312F2F]" : ""}`}
          onClick={() => setTheme("dark")}
        >
          Dark
        </button>
      </div>
    </div>
  );
}

function Security() {
  return (
    <div className="space-y-4">
      <div className="text-sm text-[#767876]">Security Options</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked />
          Two-factor authentication
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" />
          Login alerts
        </label>
      </div>
    </div>
  );
}

export default SettingsPage;
