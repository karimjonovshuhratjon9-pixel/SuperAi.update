
import React, { useState, useRef, useEffect } from 'react';
import { Message, User, ChatSession } from '../types';
import { streamChat } from '../services/geminiService';
import { dbService } from '../services/dbService';

interface ChatViewProps {
  user: User | null;
  chatId: string | null;
  onNewMessage: () => void;
  onChatCreated: (id: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ user, chatId, onNewMessage, onChatCreated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatId) {
      dbService.getMessagesByChatId(chatId).then(setMessages);
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading || !user) return;

    let activeChatId = chatId;

    // Create new chat session if it doesn't exist
    if (!activeChatId) {
      activeChatId = Date.now().toString();
      const newChat: ChatSession = {
        id: activeChatId,
        userId: user.id,
        title: input.substring(0, 30) || 'Rasm bilan suhbat',
        lastMessage: input || 'Rasm yuklandi',
        timestamp: Date.now()
      };
      await dbService.createChat(newChat);
      onChatCreated(activeChatId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      chatId: activeChatId,
      role: 'user',
      content: input,
      timestamp: Date.now(),
      type: 'text',
      imageUrl: selectedImage || undefined
    };

    await dbService.saveMessage(userMsg);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    onNewMessage();

    const assistantMsgId = (Date.now() + 1).toString();
    let assistantContent = '';

    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      chatId: activeChatId,
      role: 'assistant',
      content: 'Thinking...',
      timestamp: Date.now(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      let prompt = input;
      if (userMsg.imageUrl) prompt = `Analyze this image and ${input || 'tell me what you see'}. Respond fast.`;
      
      await streamChat(prompt, async (chunk) => {
        assistantContent += chunk;
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId ? { ...m, content: assistantContent } : m
        ));
      });

      // Save final assistant message to DB
      const finalAssistantMsg: Message = {
        ...assistantPlaceholder,
        content: assistantContent
      };
      await dbService.saveMessage(finalAssistantMsg);
      await dbService.updateChatLastMessage(activeChatId, assistantContent.substring(0, 50));
      onNewMessage();

    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { ...m, content: 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.' } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 pb-32 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl">
               <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white">SuperAI Xizmatida</h3>
              <p className="max-w-md text-slate-400 font-medium">Chatgpt va Deepseekdan kuchliroq mantiq. Istagan savolingizni bering, barcha yozishmalar xavfsiz saqlanadi.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm pt-4">
               {['O\'zbek tilida she\'r yoz', 'Murakkab kodni tushuntir', 'Rasm tahlil qil', 'Deep thinking rejim'].map(hint => (
                 <button key={hint} onClick={() => setInput(hint)} className="p-3 text-xs font-bold text-slate-400 bg-slate-800/40 border border-white/5 rounded-xl hover:bg-slate-800 hover:text-white transition">
                   {hint}
                 </button>
               ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col space-y-2 max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-3xl p-5 shadow-2xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none' 
                  : 'glass text-slate-100 rounded-tl-none border-white/10'
              }`}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-2xl mb-4 border border-white/20 shadow-lg" />
                )}
                <div className="whitespace-pre-wrap text-sm md:text-[15px] leading-relaxed font-medium">
                  {msg.content}
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-bold px-2 uppercase tracking-widest">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
           <div className="flex justify-start animate-pulse">
              <div className="glass p-5 rounded-3xl rounded-tl-none border-white/10">
                 <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-6 left-4 right-4 md:left-10 md:right-10">
        <div className="glass p-3 rounded-[2.5rem] shadow-2xl border-white/10">
          <form onSubmit={handleSendMessage} className="flex flex-col space-y-2">
            {selectedImage && (
              <div className="relative inline-block w-24 h-24 ml-4 mt-2">
                <img src={selectedImage} className="w-full h-full object-cover rounded-2xl border-2 border-blue-500 shadow-xl" />
                <button 
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg border-2 border-[#0f172a]"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3 px-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 text-slate-400 hover:text-blue-400 hover:bg-blue-600/10 rounded-full transition-all"
                title="Rasm yuklash"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg>
              </button>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Savol bering yoki rasm yuklang..."
                className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 py-4 resize-none max-h-32 text-[15px] font-medium"
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={`p-4 rounded-full transition-all transform active:scale-90 ${
                  isLoading || (!input.trim() && !selectedImage)
                    ? 'bg-slate-800 text-slate-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-900/40'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
