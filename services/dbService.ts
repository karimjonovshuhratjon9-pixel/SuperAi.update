
import { User, Message, ChatSession } from '../types';

const DB_NAME = 'SuperAIDB';
const DB_VERSION = 1;

class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chats')) {
          db.createObjectStore('chats', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('chatId', 'chatId', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  // User methods
  async saveUser(user: User): Promise<void> {
    return this.perform('users', 'readwrite', (store) => store.put(user));
  }

  async getUser(id: string): Promise<User | null> {
    return this.perform('users', 'readonly', (store) => store.get(id));
  }

  // Chat methods
  async createChat(chat: ChatSession): Promise<void> {
    return this.perform('chats', 'readwrite', (store) => store.add(chat));
  }

  async getChatsByUserId(userId: string): Promise<ChatSession[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('chats', 'readonly');
      const store = transaction.objectStore('chats');
      const request = store.getAll();
      request.onsuccess = () => {
        const chats = (request.result as ChatSession[]).filter(c => c.userId === userId);
        resolve(chats.sort((a, b) => b.timestamp - a.timestamp));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateChatLastMessage(chatId: string, text: string): Promise<void> {
    const chat = await this.perform('chats', 'readonly', (store) => store.get(chatId));
    if (chat) {
      chat.lastMessage = text;
      chat.timestamp = Date.now();
      await this.perform('chats', 'readwrite', (store) => store.put(chat));
    }
  }

  // Message methods
  async saveMessage(message: Message): Promise<void> {
    return this.perform('messages', 'readwrite', (store) => store.add(message));
  }

  async getMessagesByChatId(chatId: string): Promise<Message[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('messages', 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('chatId');
      const request = index.getAll(chatId);
      request.onsuccess = () => resolve((request.result as Message[]).sort((a, b) => a.timestamp - b.timestamp));
      request.onerror = () => reject(request.error);
    });
  }

  private async perform(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new DatabaseService();
