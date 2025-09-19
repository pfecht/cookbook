import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { sessionState, useChatSession } from "@chainlit/react-client";

import { MainShell, Page } from "./components/MainShell";
import { ChatList } from "./components/ChatList";
import { ChatArea } from "./components/ChatArea";
import { SettingsPage } from "./pages/SettingsPage";
import { RadarPage } from "./pages/RadarPage";
import { OCRPage, DocTypeDef } from "./pages/OCRPage";
import { OCRDetailPage } from "./pages/OCRDetailPage";

const userEnv = {};

function App() {
  const [page, setPage] = useState<Page>("documents");
  const [docDetail, setDocDetail] = useState<DocTypeDef | null>(null);
  const [detailEditTypeId, setDetailEditTypeId] = useState<string | null>(null);

  const { connect } = useChatSession();
  const session = useRecoilValue(sessionState);

  useEffect(() => {
    if (session?.socket.connected) return;
    connect({ userEnv });
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
        {docDetail ? (
          <OCRDetailPage
            typeDef={docDetail}
            onBack={() => setDocDetail(null)}
            onEdit={(id) => {
              setDocDetail(null);
              setDetailEditTypeId(id);
            }}
          />
        ) : (
          <OCRPage
            onOpenDetail={(t) => setDocDetail(t)}
            openEditorForTypeId={detailEditTypeId}
            onEditorOpenHandled={() => setDetailEditTypeId(null)}
          />
        )}
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
