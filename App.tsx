
import React, { useState, useEffect } from 'react';
import { AppView, User, ChatSession } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const initApp = async () => {
      await dbService.init();
      const savedUser = localStorage.getItem('superai_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const fullUser = await dbService.getUser(parsed.id);
        if (fullUser) {
          setUser(fullUser);
          setView(AppView.CHAT);
        }
      }
    };
    initApp();
  }, []);

  const handleLogin = async (userData: User) => {
    await dbService.saveUser(userData);
    setUser(userData);
    localStorage.setItem('superai_user', JSON.stringify(userData));
    setView(AppView.CHAT);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('superai_user');
    setView(AppView.AUTH);
  };

  const selectChat = (chatId: string | null) => {
    setCurrentChatId(chatId);
    setView(AppView.CHAT);
  };

  if (view === AppView.AUTH) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        onLogout={handleLogout} 
        user={user}
        currentChatId={currentChatId}
        onSelectChat={selectChat}
        refreshTrigger={refreshTrigger}
      />
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        <Dashboard 
          currentView={view} 
          setView={setView} 
          user={user}
          currentChatId={currentChatId}
          onNewMessage={() => setRefreshTrigger(t => t + 1)}
          onSelectChat={setCurrentChatId}
        />
      </main>
    </div>
  );
};

export default App;
