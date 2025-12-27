
import React from 'react';
import { AppView, User } from '../types';
import ChatView from './ChatView';
import VoiceView from './VoiceView';
import ImageGenView from './ImageGenView';

interface DashboardProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  user: User | null;
  currentChatId: string | null;
  onNewMessage: () => void;
  onSelectChat: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  currentView, setView, user, currentChatId, onNewMessage, onSelectChat 
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a]">
      {currentView === AppView.CHAT && (
        <ChatView 
          user={user} 
          chatId={currentChatId} 
          onNewMessage={onNewMessage}
          onChatCreated={onSelectChat}
        />
      )}
      {currentView === AppView.VOICE && <VoiceView />}
      {currentView === AppView.IMAGE_GEN && <ImageGenView />}
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden glass fixed bottom-0 left-0 right-0 flex justify-around p-4 z-50 border-t border-white/5">
        <button onClick={() => setView(AppView.CHAT)} className={`p-2 transition-transform active:scale-90 ${currentView === AppView.CHAT ? 'text-blue-500' : 'text-slate-500'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2"/></svg>
        </button>
        <button onClick={() => setView(AppView.VOICE)} className={`p-2 transition-transform active:scale-90 ${currentView === AppView.VOICE ? 'text-blue-500' : 'text-slate-500'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeWidth="2"/></svg>
        </button>
        <button onClick={() => setView(AppView.IMAGE_GEN)} className={`p-2 transition-transform active:scale-90 ${currentView === AppView.IMAGE_GEN ? 'text-blue-500' : 'text-slate-500'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
