import { MemoryItem } from "../types";
import { dbService } from "./dbService";

const MEMORY_KEY = "superai_user_memory_v1";
const MEMORY_ENABLED_KEY = "superai_memory_enabled";

// ================= LEGACY SUPPORT (backward compatibility) =================
export const getUserMemory = (): string => {
  try {
    return localStorage.getItem(MEMORY_KEY) || "";
  } catch {
    return "";
  }
};

export const setUserMemory = (value: string): void => {
  try {
    const trimmed = value.trim().slice(0, 4000);
    if (trimmed) localStorage.setItem(MEMORY_KEY, trimmed);
    else localStorage.removeItem(MEMORY_KEY);
  } catch {
    /* localStorage mavjud emas */
  }
};

export const clearUserMemory = (): void => {
  try {
    localStorage.removeItem(MEMORY_KEY);
  } catch {
    /* localStorage mavjud emas */
  }
};

// ================= SUPERAI 2.0 PERSISTENT MEMORY =================

export const isMemoryEnabled = (): boolean => {
  try {
    return localStorage.getItem(MEMORY_ENABLED_KEY) !== "false";
  } catch {
    return true;
  }
};

export const setMemoryEnabled = (enabled: boolean): void => {
  localStorage.setItem(MEMORY_ENABLED_KEY, String(enabled));
};

export const saveMemoryItem = async (
  userId: string,
  content: string,
  type: MemoryItem["type"] = "fact",
  importance = 1,
  source?: string,
): Promise<MemoryItem> => {
  const item: MemoryItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    userId,
    type,
    content: content.trim().slice(0, 2000),
    importance,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source,
  };
  await dbService.saveMemory(item);
  return item;
};

export const getMemories = async (userId: string): Promise<MemoryItem[]> => {
  return dbService.getMemoriesByUserId(userId);
};

export const updateMemoryItem = async (
  id: string,
  updates: Partial<MemoryItem>,
): Promise<void> => {
  const memories = await dbService.getMemoriesByUserId(updates.userId || "");
  const item = memories.find((m) => m.id === id);
  if (item) {
    await dbService.saveMemory({ ...item, ...updates, updatedAt: Date.now() });
  }
};

export const deleteMemoryItem = async (id: string): Promise<void> => {
  await dbService.deleteMemory(id);
};

export const clearAllMemories = async (userId: string): Promise<void> => {
  await dbService.clearAllMemories(userId);
};

// ================= AI MEMORY EXTRACTION =================
// Chat xabarlaridan muhim ma'lumotlarni avtomatik ajratib olish
export const extractMemoriesFromMessage = async (
  userId: string,
  content: string,
): Promise<MemoryItem[]> => {
  const memories: MemoryItem[] = [];
  const lower = content.toLowerCase();

  // Preferences detection
  const prefPatterns = [
    /men\s+(\w+)\s+o'?rganyapman/i,
    /men\s+(\w+)\s+ishlataman/i,
    /men\s+(\w+)\s+yoqtiraman/i,
    /men\s+(\w+)\s+ustida\s+ishlayapman/i,
    /my\s+favorite\s+is\s+(.+)/i,
    /i\s+prefer\s+(.+)/i,
    /i\s+like\s+(.+)/i,
    /i\s+am\s+learning\s+(.+)/i,
    /i\s+work\s+with\s+(.+)/i,
  ];

  for (const pattern of prefPatterns) {
    const match = content.match(pattern);
    if (match) {
      const pref = match[1] || match[0];
      memories.push(
        await saveMemoryItem(userId, pref, "preference", 2, "chat"),
      );
    }
  }

  // Facts detection
  const factPatterns = [
    /men\s+(\w+)\s+shahrida\s+yashayman/i,
    /men\s+(\w+)\s+da\s+ishlayman/i,
    /i\s+live\s+in\s+(.+)/i,
    /i\s+work\s+at\s+(.+)/i,
    /i\s+study\s+at\s+(.+)/i,
    /my\s+name\s+is\s+(.+)/i,
  ];

  for (const pattern of factPatterns) {
    const match = content.match(pattern);
    if (match) {
      const fact = match[1] || match[0];
      memories.push(await saveMemoryItem(userId, fact, "fact", 1, "chat"));
    }
  }

  return memories;
};

// ================= MEMORY CONTEXT BUILDER =================
// AI chat uchun xotira kontekstini qurish
export const buildMemoryContext = async (userId: string): Promise<string> => {
  if (!isMemoryEnabled()) return "";

  const memories = await getMemories(userId);
  if (memories.length === 0) return "";

  const sections: string[] = [];

  const prefs = memories.filter((m) => m.type === "preference");
  if (prefs.length > 0) {
    sections.push(
      "Foydalanuvchi afzalliklari:\n" +
        prefs.map((m) => `- ${m.content}`).join("\n"),
    );
  }

  const facts = memories.filter((m) => m.type === "fact");
  if (facts.length > 0) {
    sections.push(
      "Foydalanuvchi haqida faktlar:\n" +
        facts.map((m) => `- ${m.content}`).join("\n"),
    );
  }

  const projects = memories.filter((m) => m.type === "project");
  if (projects.length > 0) {
    sections.push(
      "Foydalanuvchi loyihalari:\n" +
        projects.map((m) => `- ${m.content}`).join("\n"),
    );
  }

  const longTerm = memories.filter((m) => m.type === "long_term");
  if (longTerm.length > 0) {
    sections.push(
      "Uzoq muddatli kontekst:\n" +
        longTerm.map((m) => `- ${m.content}`).join("\n"),
    );
  }

  return sections.join("\n\n");
};
