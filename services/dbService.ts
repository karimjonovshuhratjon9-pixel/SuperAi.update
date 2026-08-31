import {
  User,
  Message,
  ChatSession,
  Snippet,
  MemoryItem,
  FileItem,
  Project,
  AgentDefinition,
  Workflow,
  Automation,
  Notification,
  Task,
  AuditLogEntry,
  UsageRecord,
  Quiz,
  Flashcard,
  FlashcardDeck,
  SupportTicket,
  SharedItem,
  APIKey,
  Plugin,
  MarketplaceItem,
  ChatFolder,
  DataAnalysisResult,
  SecurityReport,
  KnowledgeBase,
  CreditTransaction,
  Subscription,
} from "../types";

const DB_NAME = "SuperAIDB";
const DB_VERSION = 2;

class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("chats")) {
          db.createObjectStore("chats", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("messages")) {
          const msgStore = db.createObjectStore("messages", { keyPath: "id" });
          msgStore.createIndex("chatId", "chatId", { unique: false });
        }
        if (!db.objectStoreNames.contains("snippets")) {
          const snipStore = db.createObjectStore("snippets", { keyPath: "id" });
          snipStore.createIndex("timestamp", "timestamp", { unique: false });
        }
        // ===== SUPERAI 2.0 NEW STORES =====
        if (!db.objectStoreNames.contains("memories")) {
          const memStore = db.createObjectStore("memories", { keyPath: "id" });
          memStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("files")) {
          const fileStore = db.createObjectStore("files", { keyPath: "id" });
          fileStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("projects")) {
          const projStore = db.createObjectStore("projects", { keyPath: "id" });
          projStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("agents")) {
          const agentStore = db.createObjectStore("agents", { keyPath: "id" });
          agentStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("workflows")) {
          db.createObjectStore("workflows", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("automations")) {
          db.createObjectStore("automations", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("notifications")) {
          const notifStore = db.createObjectStore("notifications", {
            keyPath: "id",
          });
          notifStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("tasks")) {
          const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
          taskStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("audit_logs")) {
          const auditStore = db.createObjectStore("audit_logs", {
            keyPath: "id",
          });
          auditStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("usage_records")) {
          const usageStore = db.createObjectStore("usage_records", {
            keyPath: "id",
          });
          usageStore.createIndex("userId", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains("quizzes")) {
          db.createObjectStore("quizzes", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("flashcards")) {
          db.createObjectStore("flashcards", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("flashcard_decks")) {
          db.createObjectStore("flashcard_decks", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("support_tickets")) {
          db.createObjectStore("support_tickets", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("shared_items")) {
          db.createObjectStore("shared_items", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("api_keys")) {
          db.createObjectStore("api_keys", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("plugins")) {
          db.createObjectStore("plugins", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("marketplace_items")) {
          db.createObjectStore("marketplace_items", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("chat_folders")) {
          db.createObjectStore("chat_folders", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("data_analysis")) {
          db.createObjectStore("data_analysis", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("security_reports")) {
          db.createObjectStore("security_reports", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("knowledge_bases")) {
          db.createObjectStore("knowledge_bases", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("credit_transactions")) {
          db.createObjectStore("credit_transactions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("subscriptions")) {
          db.createObjectStore("subscriptions", { keyPath: "id" });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  // ================= GENERIC =================
  private async perform(
    storeName: string,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest,
  ): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  private async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: string,
  ): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  // ================= USER METHODS =================
  async saveUser(user: User): Promise<void> {
    return this.perform("users", "readwrite", (store) => store.put(user));
  }

  async getUser(id: string): Promise<User | null> {
    return this.perform("users", "readonly", (store) => store.get(id));
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getAllFromStore<User>("users");
    return (
      users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
    );
  }

  async getAllUsers(): Promise<User[]> {
    return this.getAllFromStore<User>("users");
  }

  async deleteUser(id: string): Promise<void> {
    await this.perform("users", "readwrite", (store) => store.delete(id));
    // Clean up all user data
    const stores = [
      "chats",
      "messages",
      "memories",
      "files",
      "projects",
      "agents",
      "workflows",
      "automations",
      "notifications",
      "tasks",
      "audit_logs",
      "usage_records",
      "quizzes",
      "flashcards",
      "flashcard_decks",
      "support_tickets",
      "shared_items",
      "api_keys",
      "data_analysis",
      "security_reports",
      "knowledge_bases",
      "credit_transactions",
      "subscriptions",
    ];
    for (const storeName of stores) {
      try {
        const all = await this.getAllFromStore<any>(storeName);
        for (const item of all) {
          if (item.userId === id) {
            await this.perform(storeName, "readwrite", (store) =>
              store.delete(item.id),
            );
          }
        }
      } catch {
        /* store may not exist */
      }
    }
  }

  // ================= CHAT METHODS =================
  async createChat(chat: ChatSession): Promise<void> {
    return this.perform("chats", "readwrite", (store) => store.put(chat));
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.perform("chats", "readwrite", (store) => store.delete(chatId));
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("messages", "readwrite");
      const store = transaction.objectStore("messages");
      const index = store.index("chatId");
      const request = index.getAllKeys(chatId);
      request.onsuccess = () => {
        const keys = request.result;
        keys.forEach((key) => store.delete(key));
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getChatsByUserId(userId: string): Promise<ChatSession[]> {
    const chats = await this.getAllFromStore<ChatSession>("chats");
    return chats
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async updateChatLastMessage(chatId: string, text: string): Promise<void> {
    const chat = await this.perform("chats", "readonly", (store) =>
      store.get(chatId),
    );
    if (chat) {
      chat.lastMessage = text;
      chat.timestamp = Date.now();
      await this.perform("chats", "readwrite", (store) => store.put(chat));
    }
  }

  async updateChat(chat: ChatSession): Promise<void> {
    return this.perform("chats", "readwrite", (store) => store.put(chat));
  }

  async getChat(chatId: string): Promise<ChatSession | null> {
    return this.perform("chats", "readonly", (store) => store.get(chatId));
  }

  async searchMessages(userId: string, query: string): Promise<Message[]> {
    if (!this.db || !query.trim()) return [];
    const chats = await this.getChatsByUserId(userId);
    const chatIds = new Set(chats.map((c) => c.id));
    const lower = query.toLowerCase();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("messages", "readonly");
      const request = transaction.objectStore("messages").getAll();
      request.onsuccess = () => {
        const results = (request.result as Message[])
          .filter(
            (m) =>
              chatIds.has(m.chatId) && m.content.toLowerCase().includes(lower),
          )
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ================= CHAT FOLDERS =================
  async saveChatFolder(folder: ChatFolder): Promise<void> {
    return this.perform("chat_folders", "readwrite", (store) =>
      store.put(folder),
    );
  }

  async getChatFolders(userId: string): Promise<ChatFolder[]> {
    const folders = await this.getAllFromStore<ChatFolder>("chat_folders");
    return folders.filter((f) => f.userId === userId);
  }

  async deleteChatFolder(id: string): Promise<void> {
    return this.perform("chat_folders", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= SNIPPET METHODS =================
  async saveSnippet(snippet: Snippet): Promise<void> {
    return this.perform("snippets", "readwrite", (store) => store.put(snippet));
  }

  async deleteSnippet(id: string): Promise<void> {
    return this.perform("snippets", "readwrite", (store) => store.delete(id));
  }

  async getAllSnippets(): Promise<Snippet[]> {
    const snippets = await this.getAllFromStore<Snippet>("snippets");
    return snippets.sort((a, b) => b.timestamp - a.timestamp);
  }

  // ================= MESSAGE METHODS =================
  async saveMessage(message: Message): Promise<void> {
    return this.perform("messages", "readwrite", (store) => store.put(message));
  }

  async getMessagesByChatId(chatId: string): Promise<Message[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction("messages", "readonly");
      const store = transaction.objectStore("messages");
      const index = store.index("chatId");
      const request = index.getAll(chatId);
      request.onsuccess = () =>
        resolve(
          (request.result as Message[]).sort(
            (a, b) => a.timestamp - b.timestamp,
          ),
        );
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.perform("messages", "readwrite", (store) =>
      store.delete(messageId),
    );
  }

  // ================= MEMORY METHODS =================
  async saveMemory(memory: MemoryItem): Promise<void> {
    return this.perform("memories", "readwrite", (store) => store.put(memory));
  }

  async getMemoriesByUserId(userId: string): Promise<MemoryItem[]> {
    const memories = await this.getByIndex<MemoryItem>(
      "memories",
      "userId",
      userId,
    );
    return memories.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteMemory(id: string): Promise<void> {
    return this.perform("memories", "readwrite", (store) => store.delete(id));
  }

  async clearAllMemories(userId: string): Promise<void> {
    const memories = await this.getMemoriesByUserId(userId);
    for (const m of memories) {
      await this.deleteMemory(m.id);
    }
  }

  // ================= FILE METHODS =================
  async saveFile(file: FileItem): Promise<void> {
    return this.perform("files", "readwrite", (store) => store.put(file));
  }

  async getFilesByUserId(userId: string): Promise<FileItem[]> {
    const files = await this.getByIndex<FileItem>("files", "userId", userId);
    return files.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getFile(id: string): Promise<FileItem | null> {
    return this.perform("files", "readonly", (store) => store.get(id));
  }

  async deleteFile(id: string): Promise<void> {
    return this.perform("files", "readwrite", (store) => store.delete(id));
  }

  // ================= PROJECT METHODS =================
  async saveProject(project: Project): Promise<void> {
    return this.perform("projects", "readwrite", (store) => store.put(project));
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    const projects = await this.getByIndex<Project>(
      "projects",
      "userId",
      userId,
    );
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getProject(id: string): Promise<Project | null> {
    return this.perform("projects", "readonly", (store) => store.get(id));
  }

  async deleteProject(id: string): Promise<void> {
    return this.perform("projects", "readwrite", (store) => store.delete(id));
  }

  // ================= AGENT METHODS =================
  async saveAgent(agent: AgentDefinition): Promise<void> {
    return this.perform("agents", "readwrite", (store) => store.put(agent));
  }

  async getAgentsByUserId(userId: string): Promise<AgentDefinition[]> {
    const agents = await this.getByIndex<AgentDefinition>(
      "agents",
      "userId",
      userId,
    );
    return agents.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getAllAgents(): Promise<AgentDefinition[]> {
    return this.getAllFromStore<AgentDefinition>("agents");
  }

  async getAgent(id: string): Promise<AgentDefinition | null> {
    return this.perform("agents", "readonly", (store) => store.get(id));
  }

  async deleteAgent(id: string): Promise<void> {
    return this.perform("agents", "readwrite", (store) => store.delete(id));
  }

  // ================= WORKFLOW METHODS =================
  async saveWorkflow(workflow: Workflow): Promise<void> {
    return this.perform("workflows", "readwrite", (store) =>
      store.put(workflow),
    );
  }

  async getWorkflowsByUserId(userId: string): Promise<Workflow[]> {
    const workflows = await this.getAllFromStore<Workflow>("workflows");
    return workflows.filter((w) => w.userId === userId);
  }

  async deleteWorkflow(id: string): Promise<void> {
    return this.perform("workflows", "readwrite", (store) => store.delete(id));
  }

  // ================= AUTOMATION METHODS =================
  async saveAutomation(automation: Automation): Promise<void> {
    return this.perform("automations", "readwrite", (store) =>
      store.put(automation),
    );
  }

  async getAutomationsByUserId(userId: string): Promise<Automation[]> {
    const automations = await this.getAllFromStore<Automation>("automations");
    return automations.filter((a) => a.userId === userId);
  }

  async deleteAutomation(id: string): Promise<void> {
    return this.perform("automations", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= NOTIFICATION METHODS =================
  async saveNotification(notification: Notification): Promise<void> {
    return this.perform("notifications", "readwrite", (store) =>
      store.put(notification),
    );
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    const notifications = await this.getByIndex<Notification>(
      "notifications",
      "userId",
      userId,
    );
    return notifications.sort((a, b) => b.createdAt - a.createdAt);
  }

  async markNotificationRead(id: string): Promise<void> {
    const notif = await this.perform("notifications", "readonly", (store) =>
      store.get(id),
    );
    if (notif) {
      notif.isRead = true;
      await this.perform("notifications", "readwrite", (store) =>
        store.put(notif),
      );
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const notifications = await this.getNotificationsByUserId(userId);
    for (const n of notifications) {
      if (!n.isRead) {
        n.isRead = true;
        await this.perform("notifications", "readwrite", (store) =>
          store.put(n),
        );
      }
    }
  }

  async deleteNotification(id: string): Promise<void> {
    return this.perform("notifications", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= TASK METHODS =================
  async saveTask(task: Task): Promise<void> {
    return this.perform("tasks", "readwrite", (store) => store.put(task));
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    const tasks = await this.getByIndex<Task>("tasks", "userId", userId);
    return tasks.sort((a, b) => b.startedAt - a.startedAt);
  }

  async deleteTask(id: string): Promise<void> {
    return this.perform("tasks", "readwrite", (store) => store.delete(id));
  }

  // ================= AUDIT LOG METHODS =================
  async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    return this.perform("audit_logs", "readwrite", (store) => store.put(entry));
  }

  async getAuditLogsByUserId(userId: string): Promise<AuditLogEntry[]> {
    const logs = await this.getByIndex<AuditLogEntry>(
      "audit_logs",
      "userId",
      userId,
    );
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getAllAuditLogs(): Promise<AuditLogEntry[]> {
    const logs = await this.getAllFromStore<AuditLogEntry>("audit_logs");
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // ================= USAGE RECORD METHODS =================
  async saveUsageRecord(record: UsageRecord): Promise<void> {
    return this.perform("usage_records", "readwrite", (store) =>
      store.put(record),
    );
  }

  async getUsageRecordsByUserId(userId: string): Promise<UsageRecord[]> {
    const records = await this.getByIndex<UsageRecord>(
      "usage_records",
      "userId",
      userId,
    );
    return records.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getAllUsageRecords(): Promise<UsageRecord[]> {
    return this.getAllFromStore<UsageRecord>("usage_records");
  }

  // ================= QUIZ METHODS =================
  async saveQuiz(quiz: Quiz): Promise<void> {
    return this.perform("quizzes", "readwrite", (store) => store.put(quiz));
  }

  async getQuizzesByUserId(userId: string): Promise<Quiz[]> {
    const quizzes = await this.getAllFromStore<Quiz>("quizzes");
    return quizzes.filter((q) => q.userId === userId);
  }

  async deleteQuiz(id: string): Promise<void> {
    return this.perform("quizzes", "readwrite", (store) => store.delete(id));
  }

  // ================= FLASHCARD METHODS =================
  async saveFlashcard(card: Flashcard): Promise<void> {
    return this.perform("flashcards", "readwrite", (store) => store.put(card));
  }

  async getFlashcardsByUserId(userId: string): Promise<Flashcard[]> {
    const cards = await this.getAllFromStore<Flashcard>("flashcards");
    return cards.filter((c) => c.userId === userId);
  }

  async deleteFlashcard(id: string): Promise<void> {
    return this.perform("flashcards", "readwrite", (store) => store.delete(id));
  }

  async saveFlashcardDeck(deck: FlashcardDeck): Promise<void> {
    return this.perform("flashcard_decks", "readwrite", (store) =>
      store.put(deck),
    );
  }

  async getFlashcardDecksByUserId(userId: string): Promise<FlashcardDeck[]> {
    const decks = await this.getAllFromStore<FlashcardDeck>("flashcard_decks");
    return decks.filter((d) => d.userId === userId);
  }

  async deleteFlashcardDeck(id: string): Promise<void> {
    return this.perform("flashcard_decks", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= SUPPORT TICKET METHODS =================
  async saveSupportTicket(ticket: SupportTicket): Promise<void> {
    return this.perform("support_tickets", "readwrite", (store) =>
      store.put(ticket),
    );
  }

  async getSupportTicketsByUserId(userId: string): Promise<SupportTicket[]> {
    const tickets =
      await this.getAllFromStore<SupportTicket>("support_tickets");
    return tickets.filter((t) => t.userId === userId);
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return this.getAllFromStore<SupportTicket>("support_tickets");
  }

  async deleteSupportTicket(id: string): Promise<void> {
    return this.perform("support_tickets", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= SHARING METHODS =================
  async saveSharedItem(item: SharedItem): Promise<void> {
    return this.perform("shared_items", "readwrite", (store) =>
      store.put(item),
    );
  }

  async getSharedItemsByUserId(userId: string): Promise<SharedItem[]> {
    const items = await this.getAllFromStore<SharedItem>("shared_items");
    return items.filter((i) => i.userId === userId);
  }

  async getSharedItemByToken(token: string): Promise<SharedItem | null> {
    const items = await this.getAllFromStore<SharedItem>("shared_items");
    return items.find((i) => i.shareToken === token) || null;
  }

  async deleteSharedItem(id: string): Promise<void> {
    return this.perform("shared_items", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= API KEY METHODS =================
  async saveAPIKey(key: APIKey): Promise<void> {
    return this.perform("api_keys", "readwrite", (store) => store.put(key));
  }

  async getAPIKeysByUserId(userId: string): Promise<APIKey[]> {
    const keys = await this.getAllFromStore<APIKey>("api_keys");
    return keys.filter((k) => k.userId === userId);
  }

  async deleteAPIKey(id: string): Promise<void> {
    return this.perform("api_keys", "readwrite", (store) => store.delete(id));
  }

  // ================= PLUGIN METHODS =================
  async savePlugin(plugin: Plugin): Promise<void> {
    return this.perform("plugins", "readwrite", (store) => store.put(plugin));
  }

  async getAllPlugins(): Promise<Plugin[]> {
    return this.getAllFromStore<Plugin>("plugins");
  }

  async deletePlugin(id: string): Promise<void> {
    return this.perform("plugins", "readwrite", (store) => store.delete(id));
  }

  // ================= MARKETPLACE METHODS =================
  async saveMarketplaceItem(item: MarketplaceItem): Promise<void> {
    return this.perform("marketplace_items", "readwrite", (store) =>
      store.put(item),
    );
  }

  async getAllMarketplaceItems(): Promise<MarketplaceItem[]> {
    return this.getAllFromStore<MarketplaceItem>("marketplace_items");
  }

  async deleteMarketplaceItem(id: string): Promise<void> {
    return this.perform("marketplace_items", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= DATA ANALYSIS METHODS =================
  async saveDataAnalysis(result: DataAnalysisResult): Promise<void> {
    return this.perform("data_analysis", "readwrite", (store) =>
      store.put(result),
    );
  }

  async getDataAnalysisByUserId(userId: string): Promise<DataAnalysisResult[]> {
    const results =
      await this.getAllFromStore<DataAnalysisResult>("data_analysis");
    return results.filter((r) => r.userId === userId);
  }

  async deleteDataAnalysis(id: string): Promise<void> {
    return this.perform("data_analysis", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= SECURITY REPORT METHODS =================
  async saveSecurityReport(report: SecurityReport): Promise<void> {
    return this.perform("security_reports", "readwrite", (store) =>
      store.put(report),
    );
  }

  async getSecurityReportsByUserId(userId: string): Promise<SecurityReport[]> {
    const reports =
      await this.getAllFromStore<SecurityReport>("security_reports");
    return reports.filter((r) => r.userId === userId);
  }

  async deleteSecurityReport(id: string): Promise<void> {
    return this.perform("security_reports", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= KNOWLEDGE BASE METHODS =================
  async saveKnowledgeBase(kb: KnowledgeBase): Promise<void> {
    return this.perform("knowledge_bases", "readwrite", (store) =>
      store.put(kb),
    );
  }

  async getKnowledgeBasesByUserId(userId: string): Promise<KnowledgeBase[]> {
    const kbs = await this.getAllFromStore<KnowledgeBase>("knowledge_bases");
    return kbs.filter((k) => k.userId === userId);
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    return this.perform("knowledge_bases", "readwrite", (store) =>
      store.delete(id),
    );
  }

  // ================= CREDIT TRANSACTION METHODS =================
  async saveCreditTransaction(tx: CreditTransaction): Promise<void> {
    return this.perform("credit_transactions", "readwrite", (store) =>
      store.put(tx),
    );
  }

  async getCreditTransactionsByUserId(
    userId: string,
  ): Promise<CreditTransaction[]> {
    const txs = await this.getAllFromStore<CreditTransaction>(
      "credit_transactions",
    );
    return txs.filter((t) => t.userId === userId);
  }

  // ================= SUBSCRIPTION METHODS =================
  async saveSubscription(sub: Subscription): Promise<void> {
    return this.perform("subscriptions", "readwrite", (store) =>
      store.put(sub),
    );
  }

  async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    const subs = await this.getAllFromStore<Subscription>("subscriptions");
    return subs.filter((s) => s.userId === userId);
  }

  // ================= GLOBAL SEARCH =================
  async globalSearch(
    userId: string,
    query: string,
  ): Promise<{
    chats: ChatSession[];
    messages: Message[];
    files: FileItem[];
    projects: Project[];
    agents: AgentDefinition[];
    memories: MemoryItem[];
  }> {
    const lower = query.toLowerCase();
    const [chats, messages, files, projects, agents, memories] =
      await Promise.all([
        this.getChatsByUserId(userId),
        this.searchMessages(userId, query),
        this.getFilesByUserId(userId),
        this.getProjectsByUserId(userId),
        this.getAgentsByUserId(userId),
        this.getMemoriesByUserId(userId),
      ]);

    return {
      chats: chats.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          (c.lastMessage || "").toLowerCase().includes(lower),
      ),
      messages,
      files: files.filter(
        (f) =>
          f.name.toLowerCase().includes(lower) ||
          (f.summary || "").toLowerCase().includes(lower),
      ),
      projects: projects.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.description || "").toLowerCase().includes(lower),
      ),
      agents: agents.filter(
        (a) =>
          a.name.toLowerCase().includes(lower) ||
          a.description.toLowerCase().includes(lower),
      ),
      memories: memories.filter((m) => m.content.toLowerCase().includes(lower)),
    };
  }
}

export const dbService = new DatabaseService();
