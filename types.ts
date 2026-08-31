export enum AppView {
  AUTH = "AUTH",
  DASHBOARD = "DASHBOARD",
  CHAT = "CHAT",
  VOICE = "VOICE",
  VIRTUAL_FRIEND = "VIRTUAL_FRIEND",
  HEYGEN_AVATAR = "HEYGEN_AVATAR",
  VIDEO_STUDIO = "VIDEO_STUDIO",
  IMAGE_GEN = "IMAGE_GEN",
  PLAYGROUND = "PLAYGROUND",
  TRANSLATOR = "TRANSLATOR",
  DOCS = "DOCS",
  DEEP_RESEARCH = "DEEP_RESEARCH",
  CODING_AGENT = "CODING_AGENT",
  AI_DEBUGGER = "AI_DEBUGGER",
  KNOWLEDGE_BASE = "KNOWLEDGE_BASE",
  MULTI_AGENTS = "MULTI_AGENTS",
  AUTOMATIONS = "AUTOMATIONS",
  SUPER_MODE = "SUPER_MODE",
  MODEL_HUB = "MODEL_HUB",
  ANALYTICS = "ANALYTICS",
  SETTINGS = "SETTINGS",
  // ===== SUPERAI 2.0 NEW VIEWS =====
  AI_MEMORY = "AI_MEMORY",
  AI_SEARCH = "AI_SEARCH",
  MUSIC_STUDIO = "MUSIC_STUDIO",
  VOICE_STUDIO = "VOICE_STUDIO",
  DOCUMENT_STUDIO = "DOCUMENT_STUDIO",
  FILE_LAB = "FILE_LAB",
  DATA_ANALYST = "DATA_ANALYST",
  AGENT_HUB = "AGENT_HUB",
  AGENT_BUILDER = "AGENT_BUILDER",
  WORKFLOWS = "WORKFLOWS",
  STUDY_MODE = "STUDY_MODE",
  AI_TUTOR = "AI_TUTOR",
  QUIZ = "QUIZ",
  FLASHCARDS = "FLASHCARDS",
  EXAM_SIMULATOR = "EXAM_SIMULATOR",
  VISION_AI = "VISION_AI",
  SECURITY_SCANNER = "SECURITY_SCANNER",
  PROFILE = "PROFILE",
  SUBSCRIPTION = "SUBSCRIPTION",
  API_PLATFORM = "API_PLATFORM",
  PROJECTS = "PROJECTS",
  MARKETPLACE = "MARKETPLACE",
  PLUGINS = "PLUGINS",
  ADMIN = "ADMIN",
  NOTIFICATIONS = "NOTIFICATIONS",
  TASK_CENTER = "TASK_CENTER",
  HELP_CENTER = "HELP_CENTER",
  SUPPORT = "SUPPORT",
  WRITING_STUDIO = "WRITING_STUDIO",
  SHARING = "SHARING",
  GAMIFICATION = "GAMIFICATION",
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  displayName?: string;
  bio?: string;
  language?: string;
  theme?: "dark" | "light" | "system";
  accentColor?: string;
  compactMode?: boolean;
  aiPreferences?: {
    defaultModel?: string;
    temperature?: number;
    responseLength?: "short" | "medium" | "long";
    memoryEnabled?: boolean;
    webSearchEnabled?: boolean;
    autoTools?: boolean;
  };
  notificationPreferences?: {
    email?: boolean;
    browser?: boolean;
    system?: boolean;
  };
  privacySettings?: {
    chatHistory?: boolean;
    memory?: boolean;
    dataControls?: boolean;
  };
  role?: "user" | "admin";
  plan?: "FREE" | "PRO" | "VIP" | "ENTERPRISE";
  xp?: number;
  level?: number;
  streak?: number;
  createdAt?: number;
  lastLoginAt?: number;
  emailVerified?: boolean;
  isSuspended?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  type: "text" | "image";
  imageUrl?: string;
  fileName?: string;
  pinned?: boolean;
  favorite?: boolean;
  reactions?: Record<string, string[]>;
  branchParentId?: string;
  model?: string;
  sources?: SearchSource[];
  toolCalls?: AgentActionCall[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  pinned?: boolean;
  systemPrompt?: string;
  folderId?: string;
  tags?: string[];
  model?: string;
  branchRootId?: string;
}

export interface ChatFolder {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
}

export interface Snippet {
  id: string;
  code: string;
  lang: string;
  title: string;
  timestamp: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  text: string;
  icon?: string;
}

export interface VoiceState {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcription: string;
}

export interface ApiKeyConfig {
  apiKey: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  instruction: string;
}

// ElevenLabs Types
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  gender?: "male" | "female" | "neutral";
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface ElevenLabsSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

// HeyGen Types
export interface HeyGenAvatar {
  id: string;
  name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
  avatar_type?: string;
  default_voice_id?: string;
}

export interface HeyGenVoice {
  voice_id: string;
  name: string;
  language?: string;
  gender?: string;
  preview_audio?: string | null;
}

export interface HeyGenVideo {
  id: string;
  title?: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  gif_url?: string;
  duration?: number;
  created_at?: number;
  completed_at?: number;
  failure_code?: string;
  failure_message?: string;
}

export interface HeyGenUserInfo {
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  remaining_quota?: number;
  currency?: string;
  billing_type?: string;
}

// ================= AGENT TOOLS & SEARCH TYPES =================
export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export interface SearchResult {
  query: string;
  sources: SearchSource[];
  summary?: string;
}

export interface AgentActionCall {
  id: string;
  toolName:
    | "web_search"
    | "send_telegram"
    | "send_email"
    | "calculate"
    | "get_weather"
    | "execute_code";
  params: Record<string, any>;
  status: "pending" | "running" | "success" | "failed";
  result?: any;
  error?: string;
}

export interface RAGDocumentChunk {
  id: string;
  pageNumber?: number;
  content: string;
  embedding?: number[];
  similarity?: number;
}

// ================= VIDEO STUDIO TYPES =================
export interface VideoSceneItem {
  id: string;
  title: string;
  script: string;
  avatarId?: string;
  voiceId?: string;
  backgroundType: "color" | "gradient" | "image" | "video" | "ai_generated";
  backgroundValue: string;
  durationSeconds: number;
  subtitlesEnabled: boolean;
  avatarPosition?: "center" | "left" | "right" | "circle";
}

export interface VideoStudioProject {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scenes: VideoSceneItem[];
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  resolution: "720p" | "1080p" | "4k";
  status:
    | "draft"
    | "queued"
    | "processing"
    | "rendering"
    | "completed"
    | "failed";
  outputVideoUrl?: string;
  thumbnailUrl?: string;
  createdAt: number;
  updatedAt: number;
  estimatedCredits: number;
  errorMessage?: string;
}

export interface VideoTemplateItem {
  id: string;
  title: string;
  category:
    | "marketing"
    | "youtube"
    | "tiktok"
    | "education"
    | "news"
    | "presentation";
  description: string;
  previewUrl: string;
  aspectRatio: "16:9" | "9:16";
  scenes: Partial<VideoSceneItem>[];
}

// ================= SUPERAI 2.0 NEW TYPES =================

// AI Memory
export interface MemoryItem {
  id: string;
  userId: string;
  type: "preference" | "fact" | "project" | "long_term" | "conversation";
  content: string;
  importance: number;
  createdAt: number;
  updatedAt: number;
  source?: string;
}

// File Lab
export interface FileItem {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  dataUrl?: string;
  projectId?: string;
  folderId?: string;
  tags?: string[];
  summary?: string;
  createdAt: number;
  updatedAt: number;
  shared?: boolean;
}

// Projects
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  files: string[];
  chats: string[];
  agents: string[];
  tasks: string[];
  notes?: string;
  activity: ActivityEntry[];
  createdAt: number;
  updatedAt: number;
  shared?: boolean;
}

export interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  timestamp: number;
}

// Agents
export interface AgentDefinition {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  personality?: string;
  instructions: string;
  model?: string;
  tools: string[];
  memoryEnabled: boolean;
  permissions: string[];
  isPublic: boolean;
  status: "draft" | "published";
  createdAt: number;
  updatedAt: number;
  rating?: number;
  installs?: number;
}

// Workflows
export interface WorkflowNode {
  id: string;
  type:
    | "trigger"
    | "ai"
    | "search"
    | "file"
    | "email"
    | "http"
    | "condition"
    | "code"
    | "delay"
    | "notification";
  name: string;
  config: Record<string, any>;
  next?: string[];
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Automations
export interface Automation {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trigger: {
    type: "schedule" | "event" | "manual";
    schedule?: string;
    event?: string;
  };
  conditions: Record<string, any>[];
  actions: Record<string, any>[];
  isActive: boolean;
  executionHistory: AutomationExecution[];
  createdAt: number;
  updatedAt: number;
}

export interface AutomationExecution {
  id: string;
  status: "running" | "completed" | "failed";
  startedAt: number;
  finishedAt?: number;
  result?: string;
  error?: string;
}

// Subscriptions
export interface SubscriptionPlan {
  id: "FREE" | "PRO" | "VIP" | "ENTERPRISE";
  name: string;
  price: number;
  currency: string;
  limits: {
    messages: number;
    models: string[];
    files: number;
    storage: number;
    imageGen: number;
    video: number;
    research: number;
    agents: number;
    api: number;
    automations: number;
  };
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  plan: "FREE" | "PRO" | "VIP" | "ENTERPRISE";
  status: "active" | "expired" | "cancelled";
  startedAt: number;
  expiresAt?: number;
  autoRenew?: boolean;
  promoCodeApplied?: string;
}

// Credits
export interface CreditBalance {
  userId: string;
  text: number;
  image: number;
  video: number;
  voice: number;
  research: number;
  total: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: "usage" | "purchase" | "promo" | "reward";
  amount: number;
  category: "text" | "image" | "video" | "voice" | "research";
  description: string;
  timestamp: number;
}

// Promo Codes
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount?: number;
  creditReward?: number;
  planUpgrade?: "PRO" | "VIP" | "ENTERPRISE";
  expiresAt?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: number;
}

// API Keys
export interface APIKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  permissions: string[];
  usage: number;
  lastUsedAt?: number;
  createdAt: number;
  expiresAt?: number;
  isRevoked: boolean;
}

// Plugins
export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  author: string;
  permissions: string[];
  api?: string;
  tools: string[];
  isInstalled: boolean;
  rating?: number;
  installs?: number;
  createdAt: number;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type:
    | "task"
    | "research"
    | "video"
    | "agent"
    | "automation"
    | "subscription"
    | "security"
    | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  link?: string;
}

// Tasks
export interface Task {
  id: string;
  userId: string;
  type:
    | "video"
    | "research"
    | "file_analysis"
    | "data_analysis"
    | "agent"
    | "automation"
    | "image"
    | "voice";
  status: "active" | "completed" | "failed" | "scheduled";
  progress: number;
  statusText: string;
  startedAt: number;
  finishedAt?: number;
  result?: any;
  error?: string;
}

// Audit Log
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ip?: string;
  timestamp: number;
}

// Usage Tracking
export interface UsageRecord {
  id: string;
  userId: string;
  feature: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  credits?: number;
  timestamp: number;
}

// Knowledge Base
export interface KnowledgeBase {
  id: string;
  userId: string;
  projectId?: string;
  name: string;
  description?: string;
  documents: string[];
  embeddings: Record<string, number[]>;
  createdAt: number;
  updatedAt: number;
}

// Gamification
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: number;
}

// Support Tickets
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  replies: SupportReply[];
  createdAt: number;
  updatedAt: number;
}

export interface SupportReply {
  id: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  timestamp: number;
}

// Feature Flags
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  beta: boolean;
  proOnly: boolean;
  vipOnly: boolean;
  maintenanceMode: boolean;
}

// Analytics
export interface AnalyticsEvent {
  id: string;
  userId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: number;
}

// Monitoring
export interface HealthStatus {
  api: "ok" | "degraded" | "down";
  database: "ok" | "degraded" | "down";
  queue: "ok" | "degraded" | "down";
  aiProvider: "ok" | "degraded" | "down";
  errorRate: number;
  responseLatency: number;
  timestamp: number;
}

// Security Scanner
export interface SecurityFinding {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
  title: string;
  description: string;
  location?: string;
  recommendation: string;
}

export interface SecurityReport {
  id: string;
  userId: string;
  target: string;
  findings: SecurityFinding[];
  score: number;
  createdAt: number;
}

// Education
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Quiz {
  id: string;
  userId: string;
  topic: string;
  questions: QuizQuestion[];
  score?: number;
  createdAt: number;
}

export interface Flashcard {
  id: string;
  userId: string;
  front: string;
  back: string;
  deckId?: string;
  createdAt: number;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  name: string;
  cards: string[];
  createdAt: number;
}

// Data Analyst
export interface DataAnalysisResult {
  id: string;
  userId: string;
  fileName: string;
  summary: string;
  insights: string[];
  statistics: Record<string, any>;
  charts: ChartData[];
  createdAt: number;
}

export interface ChartData {
  id: string;
  type: "bar" | "line" | "pie" | "scatter" | "area" | "histogram";
  title: string;
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

// Document Studio
export interface DocumentTemplate {
  id: string;
  name: string;
  category:
    | "cv"
    | "resume"
    | "cover_letter"
    | "essay"
    | "report"
    | "business_plan"
    | "article"
    | "letter"
    | "notes"
    | "presentation";
  description: string;
  icon: string;
}

// AI Search
export interface AISearchResult {
  query: string;
  mode: "quick" | "deep" | "academic" | "news" | "technical";
  results: SearchSource[];
  summary?: string;
  citations?: string[];
  timestamp: number;
}

// Sharing
export interface SharedItem {
  id: string;
  userId: string;
  type: "chat" | "file" | "project" | "agent" | "research";
  itemId: string;
  isPublic: boolean;
  shareToken: string;
  createdAt: number;
  expiresAt?: number;
}

// Marketplace
export interface MarketplaceItem {
  id: string;
  type: "agent" | "plugin" | "template" | "workflow" | "prompt";
  name: string;
  description: string;
  icon: string;
  author: string;
  category: string;
  rating: number;
  reviews: number;
  installs: number;
  isInstalled: boolean;
  createdAt: number;
}
