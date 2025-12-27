
export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  VOICE = 'VOICE',
  IMAGE_GEN = 'IMAGE_GEN',
  CHAT = 'CHAT'
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'image';
  imageUrl?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  lastMessage: string;
  timestamp: number;
}

export interface VoiceState {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcription: string;
}
