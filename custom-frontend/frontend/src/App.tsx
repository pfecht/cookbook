import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { sessionState, useChatSession } from "@chainlit/react-client";

import { MainShell, Page } from "./components/MainShell";
import { ChatList } from "./components/ChatList";
import { ChatArea } from "./components/ChatArea";
import { SettingsPage } from "./pages/SettingsPage";
import { RadarPage } from "./pages/RadarPage";
import { OCRPage } from "./pages/OCRPage";

const userEnv = {};

function App() {
  const [page, setPage] = useState<Page>("chat");

  const { connect } = useChatSession();
  const session = useRecoilValue(sessionState);

  useEffect(() => {
    if (session?.socket.connected) return;
    fetch("http://localhost:80/custom-auth", { credentials: "include" })
      .catch(() => undefined)
      .finally(() => {
        connect({ userEnv });
      });
  }, [connect, session?.socket.connected]);

  if (page === "chat") {
    return (
      <MainShell activePage={page} onNavigate={setPage} leftPanel={<ChatList />}>
        <ChatArea />
      </MainShell>
    );
  }

  if (page === "documents") {
    return (
      <MainShell activePage={page} onNavigate={setPage}>
        <OCRPage />
      </MainShell>
    );
  }

  if (page === "radar") {
    return (
      <MainShell activePage={page} onNavigate={setPage}>
        <RadarPage />
      </MainShell>
    );
  }

  return (
    <MainShell activePage={page} onNavigate={setPage}>
      <SettingsPage />
    </MainShell>
  );
}

export default App;
