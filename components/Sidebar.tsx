
import React, { useState, useEffect } from 'react';
import { AppView, User, ChatSession } from '../types';
import { dbService } from '../services/dbService';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
  user: User | null;
  currentChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  refreshTrigger: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, onLogout, user, currentChatId, onSelectChat, refreshTrigger 
}) => {
  const [history, setHistory] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (user) {
      dbService.getChatsByUserId(user.id).then(setHistory);
    }
  }, [user, refreshTrigger, currentChatId]);

  const menuItems = [
    { view: AppView.CHAT, label: 'Yangi Chat', icon: 'M12 4v16m8-8H4' },
    { view: AppView.VOICE, label: 'Ovozli Muloqot', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
    { view: AppView.IMAGE_GEN, label: 'Image Studio', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  return (
    <aside className="w-72 glass hidden md:flex flex-col h-full z-20 border-r border-white/5">
      <div className="p-6">
        <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          SuperAI
        </h2>
      </div>

      <nav className="px-4 space-y-1 mb-6">
        {menuItems.map((item) => (
          <button
            key={item.view}
            onClick={() => {
              if (item.view === AppView.CHAT) onSelectChat(null);
              setView(item.view);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              currentView === item.view && (item.view !== AppView.CHAT || !currentChatId)
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="font-bold text-sm uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 mb-3">Tarix / History</p>
        <div className="space-y-1">
          {history.length === 0 ? (
            <p className="px-4 text-xs text-slate-500 italic">Hali chatlar yo'q</p>
          ) : (
            history.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  setView(AppView.CHAT);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all group ${
                  currentChatId === chat.id 
                    ? 'bg-slate-800 border border-slate-700' 
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <p className={`text-sm font-semibold truncate ${currentChatId === chat.id ? 'text-blue-400' : 'text-slate-300'}`}>
                  {chat.title || 'Yangi suhbat'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 truncate">{chat.lastMessage}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-900/30">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate font-medium">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-slate-500 hover:text-red-400 transition font-bold text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
