
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && (isLogin || name)) {
      // Use email as a base for ID simulation
      const userId = btoa(email).substring(0, 10);
      onLogin({ 
        id: userId,
        name: name || email.split('@')[0], 
        email 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-indigo-950">
      <div className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl space-y-8 border border-white/5">
        <div className="text-center">
          <div className="inline-block p-4 rounded-2xl bg-blue-600/10 mb-4">
             <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
            SuperAI
          </h1>
          <p className="mt-2 text-slate-400 font-medium">Haqiqiy sun'iy intellekt tajribasi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-1">To'liq ism</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition text-white"
                placeholder="Ivanov Ivan"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition text-white"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1 mb-1">Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl transform active:scale-[0.98] transition-all"
          >
            {isLogin ? 'KIRISH' : 'RO\'YXATDAN O\'TISH'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            {isLogin ? "Hisobingiz yo'qmi? Yarating" : "Hisobingiz bormi? Kiring"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
