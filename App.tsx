import React, { useState, useEffect } from "react";
import { AppView, User } from "./types";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import ApiKeyModal from "./components/ApiKeyModal";
import Onboarding from "./components/Onboarding";
import ErrorBoundary from "./components/ErrorBoundary";
import { CommandPalette } from "./components/CommandPalette";
import { dbService } from "./services/dbService";
import { hasApiKey } from "./services/geminiService";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      await dbService.init();
      const savedUser = localStorage.getItem("superai_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const fullUser = await dbService.getUser(parsed.id);
          if (fullUser) {
            setUser(fullUser);
            setView(AppView.DASHBOARD);
            setIsOnboardingOpen(
              localStorage.getItem("superai_onboarding_v1") !== "done",
            );
            if (!hasApiKey()) {
              setIsApiKeyModalOpen(true);
            }
          }
        } catch (e) {
          console.error("Failed to parse user session", e);
        }
      }
    };
    initApp();
  }, []);

  const handleLogin = async (userData: User) => {
    await dbService.saveUser(userData);
    setUser(userData);
    localStorage.setItem("superai_user", JSON.stringify(userData));
    setView(AppView.DASHBOARD);
    setIsOnboardingOpen(
      localStorage.getItem("superai_onboarding_v1") !== "done",
    );
    if (!hasApiKey()) {
      setIsApiKeyModalOpen(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("superai_user");
    setView(AppView.AUTH);
  };

  const selectChat = (chatId: string | null) => {
    setCurrentChatId(chatId);
    setView(AppView.CHAT);
  };

  // Tezkor tugmalar: Ctrl+K — Command Palette, Ctrl+N — yangi chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setCurrentChatId(null);
        setView(AppView.CHAT);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (view === AppView.AUTH) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden text-slate-100 font-sans">
        <Sidebar
          currentView={view}
          setView={setView}
          onLogout={handleLogout}
          user={user}
          currentChatId={currentChatId}
          onSelectChat={selectChat}
          refreshTrigger={refreshTrigger}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />
        <main className="flex-1 relative flex flex-col h-full overflow-hidden">
          <Dashboard
            currentView={view}
            setView={setView}
            user={user}
            currentChatId={currentChatId}
            onNewMessage={() => setRefreshTrigger((t) => t + 1)}
            onSelectChat={setCurrentChatId}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
          />
        </main>

        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSave={() => setRefreshTrigger((t) => t + 1)}
        />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(newView) => setView(newView)}
          onNewChat={() => selectChat(null)}
        />
        {user && isOnboardingOpen && (
          <Onboarding
            userName={user.name}
            onComplete={() => setIsOnboardingOpen(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
