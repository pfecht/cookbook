import { Sidebar } from "./Sidebar";
import { ChatList } from "./ChatList";
import { ChatArea } from "./ChatArea";

export function ChatLayout() {
  return (
    <div className="h-screen bg-[#1F1D1D] flex">
      {/* Left Sidebar Navigation */}
      <Sidebar />
      
      {/* Chat List Panel */}
      <ChatList />
      
      {/* Main Chat Area */}
      <ChatArea />
    </div>
  );
}
