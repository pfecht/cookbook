import { Search, Plus, Video, Phone, Pin } from "lucide-react";

export function ChatList() {
  const chatTabs = ["All Chats", "Groups", "Contacts"];
  const activeTab = "All Chats";

  const conversations = [
    {
      id: 1,
      name: "Figma Teams",
      message: "Typing.......",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/99e7286b2e8b1fb2b52bd1c893feaac24179e26b?width=126",
      isOnline: true,
      isTyping: true,
      unreadCount: 2,
      isPinned: true,
    },
    {
      id: 2,
      name: "Darshan Zalavadiya",
      message: "Good",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/f4a9ea3781c159d469853a087aef78fe4a5379f9?width=114",
      isOnline: true,
      isTyping: false,
    },
    {
      id: 3,
      name: "School App Client",
      message: "Good Work",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/2775e09af92e0636f28536a5c2dcbf1f279406df?width=86",
      isOnline: false,
      isTyping: false,
    },
    {
      id: 4,
      name: "Ui/UX Teams",
      message: "I have done my work 👍",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/61b25cc6fb61ebce3939c5bc8a41a3c521a43ca4?width=174",
      isOnline: false,
      isTyping: false,
    },
  ];

  const callsList = [
    {
      id: 1,
      name: "Friends",
      status: "Joni is Talking....",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/93be73181aa870e3f124691af7b4a8261ba5da2d?width=127",
      isOngoing: true,
    },
    {
      id: 2,
      name: "Darshan Zalavadiya",
      status: "30 min ago",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/f4a9ea3781c159d469853a087aef78fe4a5379f9?width=114",
      isOngoing: false,
    },
    {
      id: 3,
      name: "School App Client",
      status: "Yesterday",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/2775e09af92e0636f28536a5c2dcbf1f279406df?width=86",
      isOngoing: false,
    },
    {
      id: 4,
      name: "Ui/UX Teams",
      status: "Last Week",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/61b25cc6fb61ebce3939c5bc8a41a3c521a43ca4?width=174",
      isOngoing: false,
    },
  ];

  return (
    <div className="w-80 md:w-80 lg:w-96 bg-white dark:bg-[#1F1D1D] flex flex-col border-r border-black/10 dark:border-[#312F2F]">
      {/* Top Section - Messages */}
      <div className="flex-1">
        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/60" />
            </div>
            <input
              type="text"
              placeholder="Search......."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-200 dark:bg-[#543639]/48 rounded-full border-none outline-none text-[#1F1D1D]/60 dark:text-white/60 text-xs placeholder-black/60 dark:placeholder-white/60"
            />
          </div>
        </div>

        {/* Messages Header */}
        <div className="px-4 mb-4">
          <h2 className="text-xl font-semibold text-[#1F1D1D] dark:text-white mb-2">Message</h2>
          
          {/* Chat Tabs */}
          <div className="relative">
            <div className="bg-black/90 rounded-full p-1 flex">
              {chatTabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors ${
                    tab === activeTab
                      ? "bg-[#322F2F]/90 text-white"
                      : "text-white hover:text-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="px-2 space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-center p-3 bg-gray-200 dark:bg-[#312F2F] rounded-lg hover:bg-gray-300 dark:hover:bg-[#3a3737] transition-colors cursor-pointer relative"
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {conversation.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#00FF38] rounded-full border-2 border-[#312F2F]"></div>
                )}
              </div>

              {/* Content */}
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#1F1D1D] dark:text-white text-xs font-semibold">{conversation.name}</h3>
                  {conversation.isPinned && (
                    <Pin size={16} className="text-white" />
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  conversation.isTyping ? "text-[#21FF5F]/93" : "text-[#767876]"
                }`}>
                  {conversation.message}
                </p>
              </div>

              {/* Unread Badge */}
              {conversation.unreadCount && (
                <div className="w-6 h-6 bg-[#00FF38] rounded-full flex items-center justify-center">
                  <span className="text-black text-xs font-semibold">{conversation.unreadCount}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section - Calls */}
      <div className="border-t border-[#312F2F] pt-4">
        {/* Calls Header */}
        <div className="px-4 mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Calls</h2>
          <div className="flex items-center space-x-2">
            <button className="text-white hover:text-gray-300">
              <Plus size={20} />
            </button>
            <span className="text-xl font-semibold text-white">New Meet</span>
          </div>
        </div>

        {/* Calls List */}
        <div className="px-2 space-y-2 pb-4">
          {callsList.map((call) => (
            <div
              key={call.id}
              className="flex items-center p-3 bg-[#312F2F] rounded-lg hover:bg-[#3a3737] transition-colors cursor-pointer"
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={call.avatar}
                  alt={call.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#00FF38] rounded-full border-2 border-[#312F2F]"></div>
              </div>

              {/* Content */}
              <div className="ml-3 flex-1">
                <h3 className="text-white text-xs font-semibold">{call.name}</h3>
                <p className={`text-xs mt-1 ${
                  call.isOngoing ? "text-[#21FF5F]/93" : "text-[#767876]"
                }`}>
                  {call.status}
                </p>
              </div>

              {/* Call Actions */}
              <div className="flex space-x-2">
                <button className="text-white hover:text-gray-300">
                  <Video size={20} />
                </button>
                <button className="text-white hover:text-gray-300">
                  <Phone size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
