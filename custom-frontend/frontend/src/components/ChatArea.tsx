import { Video, Phone, Smile, Paperclip, DollarSign, Camera, Mic } from "lucide-react";
import { useState } from "react";
import {
  useChatInteract,
  useChatMessages,
  IStep,
} from "@chainlit/react-client";
import { useMemo } from "react";

function flattenMessages(
  messages: IStep[], 
  condition: (node: IStep) => boolean
): IStep[] {
  return messages.reduce((acc: IStep[], node) => {
    if (condition(node)) {
      acc.push(node);
    }
    
    if (node.steps?.length) {
      acc.push(...flattenMessages(node.steps, condition));
    }
    
    return acc;
  }, []);
}

export function ChatArea() {
  const [inputValue, setInputValue] = useState("");
  const { sendMessage } = useChatInteract();
  const { messages } = useChatMessages();

  const flatMessages = useMemo(() => {
    return flattenMessages(messages, (m) => m.type.includes("message"))
  }, [messages])

  const handleSendMessage = () => {
    const content = inputValue.trim();
    if (content) {
      const message = {
        name: "user",
        type: "user_message" as const,
        output: content,
      };
      sendMessage(message, []);
      setInputValue("");
    }
  };

  const chatMessages = [
    { id: 1, sender: "other", content: "Hello, Darshan", time: "9:30 am" },
    { id: 2, sender: "user", content: "Hello", time: "9:31 am" },
    { id: 3, sender: "other", content: "How are you", time: "9:32 am" },
    { id: 4, sender: "user", content: "I am good", time: "9:33 am" },
    { id: 5, sender: "user", content: "What about You", time: "9:33 am" },
    { id: 6, sender: "other", content: "Same for this side", time: "9:34 am" },
    { id: 7, sender: "user", content: "Good", time: "9:35 am" },
  ];

  const renderMessage = (message: IStep) => {
    const dateOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const date = new Date(message.createdAt).toLocaleTimeString(
      undefined,
      dateOptions
    );
    
    const isUser = message.name === "user";
    
    return (
      <div key={message.id} className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-xs lg:max-w-md px-6 py-2 rounded-3xl ${
          isUser
            ? "bg-gray-200 text-black dark:bg-[#312F2F] dark:text-white ml-auto"
            : "bg-gray-200 text-black dark:bg-[#312F2F] dark:text-white mr-auto"
        }`}>
          <p className="text-lg font-semibold">{message.output}</p>
        </div>
      </div>
    );
  };

  const renderStaticMessage = (message: any) => {
    const isUser = message.sender === "user";
    
    return (
      <div key={message.id} className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-xs lg:max-w-md px-6 py-2 rounded-3xl ${
          isUser 
            ? "bg-[#312F2F] text-white ml-auto" 
            : "bg-[#312F2F] text-white mr-auto"
        }`}>
          <p className="text-lg font-semibold">{message.content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-transparent">
      {/* Chat Header */}
      <div className="h-16 md:h-24 bg-white dark:bg-[#1F1D1D] border-b border-black/10 dark:border-[#312F2F] px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/f4a9ea3781c159d469853a087aef78fe4a5379f9?width=114"
            alt="Darshan Zalavadiya"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
          />
          <div className="ml-3 md:ml-4 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-white truncate">Darshan Zalavadiya</h1>
            <p className="text-sm md:text-lg font-semibold text-[#21FF5F]/99">Online</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          <p className="hidden md:block text-lg font-semibold text-white/80">Today, 9:30 am</p>
          <button className="text-white hover:text-gray-300">
            <Video size={20} className="md:w-6 md:h-6" />
          </button>
          <button className="text-white hover:text-gray-300">
            <Phone size={20} className="md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-6 bg-white dark:bg-transparent"
           style={{
             backgroundImage: `url('https://api.builder.io/api/v1/image/assets/TEMP/d79401804ab20eac9fe139fc7f3803d02ac978cd?width=2730')`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
           }}>
        <div className="bg-white/80 dark:bg-black/67 min-h-full p-6 rounded-lg">
          <div className="space-y-4">
            {/* Static demo messages */}
            {chatMessages.map((message) => renderStaticMessage(message))}

            {/* Dynamic chat messages */}
            {flatMessages.map((message) => renderMessage(message))}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 md:p-6 bg-[#1F1D1D]">
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Message Input Container */}
          <div className="flex-1 relative">
            <div className="flex items-center bg-[#312F2F] rounded-3xl px-3 md:px-4 py-3">
              <button className="text-white hover:text-gray-300 mr-2 md:mr-3">
                <Smile size={20} className="md:w-6 md:h-6" />
              </button>

              <input
                type="text"
                placeholder="Message........."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-transparent text-white placeholder-white/40 text-base md:text-lg font-semibold outline-none"
              />

              <div className="hidden md:flex items-center space-x-3 ml-3">
                <button className="text-white hover:text-gray-300">
                  <Paperclip size={20} />
                </button>
                <button className="text-white hover:text-gray-300">
                  <DollarSign size={20} />
                </button>
                <button className="text-white hover:text-gray-300">
                  <Camera size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Voice Message Button */}
          <button
            onClick={handleSendMessage}
            className="w-12 h-12 md:w-15 md:h-15 bg-[#312F2F] rounded-full flex items-center justify-center text-white hover:bg-[#3a3737] transition-colors"
          >
            <Mic size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
