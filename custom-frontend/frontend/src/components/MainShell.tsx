import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export type Page = "chat" | "radar" | "settings";

export function MainShell({
  activePage,
  onNavigate,
  leftPanel,
  children,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  leftPanel?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-screen bg-white dark:bg-[#1F1D1D] text-black dark:text-white flex overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      {leftPanel && (
        <div className="hidden sm:block border-r border-[#312F2F]">
          {leftPanel}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
