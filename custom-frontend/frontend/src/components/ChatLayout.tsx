import { Sidebar } from "./Sidebar";
import { ChatList } from "./ChatList";
import { ChatArea } from "./ChatArea";

export function ChatLayout() {
  return (
    <div className="h-screen bg-[#1F1D1D] flex overflow-hidden">
      {/* Left Sidebar Navigation - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Chat List Panel - Hidden on small screens when chat is open */}
      <div className="hidden sm:block lg:block">
        <ChatList />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        <ChatArea />
      </div>
    </div>
  );
}
