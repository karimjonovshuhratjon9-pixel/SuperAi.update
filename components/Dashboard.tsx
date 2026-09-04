import React from "react";
import { AppView, User } from "../types";
import ChatView from "./ChatView";
import VoiceView from "./VoiceView";
import VirtualFriendView from "./VirtualFriendView";
import ImageGenView from "./ImageGenView";
import PlaygroundView from "./PlaygroundView";
import TranslatorView from "./TranslatorView";
import DocsView from "./DocsView";
import OverviewView from "./OverviewView";
import VideoStudioView from "./VideoStudioView";
import { DeepResearchView } from "./DeepResearchView";
import { CodingAgentView } from "./CodingAgentView";
import { DebuggerView } from "./DebuggerView";
import { KnowledgeBaseView } from "./KnowledgeBaseView";
import { MultiAgentsView } from "./MultiAgentsView";
import { AutomationsView } from "./AutomationsView";
import { SuperModeView } from "./SuperModeView";
import { ModelHubView } from "./ModelHubView";
import { AnalyticsView } from "./AnalyticsView";
import { SettingsView } from "./SettingsView";
import { hasApiKey } from "../services/geminiService";
// ===== SUPERAI 2.0 NEW VIEWS =====
import { AIMemoryView } from "./AIMemoryView";
import { AISearchView } from "./AISearchView";
import { MusicStudioView } from "./MusicStudioView";
import { VoiceStudioView } from "./VoiceStudioView";
import { DocumentStudioView } from "./DocumentStudioView";
import { FileLabView } from "./FileLabView";
import { DataAnalystView } from "./DataAnalystView";
import { AgentHubView } from "./AgentHubView";
import { AgentBuilderView } from "./AgentBuilderView";
import { WorkflowsView } from "./WorkflowsView";
import { StudyModeView } from "./StudyModeView";
import { AITutorView } from "./AITutorView";
import { QuizView } from "./QuizView";
import { FlashcardsView } from "./FlashcardsView";
import { ExamSimulatorView } from "./ExamSimulatorView";
import { VisionAIView } from "./VisionAIView";
import { SecurityScannerView } from "./SecurityScannerView";
import { ProfileView } from "./ProfileView";
import { SubscriptionView } from "./SubscriptionView";
import { ApiPlatformView } from "./ApiPlatformView";
import { ProjectsView } from "./ProjectsView";
import { MarketplaceView } from "./MarketplaceView";
import { PluginsView } from "./PluginsView";
import { AdminView } from "./AdminView";
import { NotificationsView } from "./NotificationsView";
import { TaskCenterView } from "./TaskCenterView";
import { HelpCenterView } from "./HelpCenterView";
import { SupportView } from "./SupportView";
import { WritingStudioView } from "./WritingStudioView";
import { SharingView } from "./SharingView";
import { GamificationView } from "./GamificationView";

interface DashboardProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  user: User | null;
  currentChatId: string | null;
  onNewMessage: () => void;
  onSelectChat: (id: string) => void;
  onOpenApiKeyModal: () => void;
  onToggleSidebar: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  currentView,
  setView,
  user,
  currentChatId,
  onNewMessage,
  onSelectChat,
  onOpenApiKeyModal,
  onToggleSidebar,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a] relative overflow-hidden">
      {/* Mobile Top Header (hidden for immersive Virtual Do'st) */}
      {currentView !== AppView.VIRTUAL_FRIEND && (
      <div className="md:hidden glass px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition"
            aria-label="Menyuni ochish"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            SuperAI
          </h1>
        </div>
        <button
          onClick={onOpenApiKeyModal}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            hasApiKey()
              ? "bg-slate-800 text-slate-300 border border-slate-700"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z"
            />
          </svg>
          <span>{hasApiKey() ? "API Key" : "Key Kiriting"}</span>
        </button>
      </div>
      )}

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {currentView === AppView.DASHBOARD && (
          <OverviewView
            user={user}
            setView={setView}
            onOpenApiKeyModal={onOpenApiKeyModal}
          />
        )}
        {currentView === AppView.CHAT && (
          <ChatView
            user={user}
            chatId={currentChatId}
            onNewMessage={onNewMessage}
            onChatCreated={onSelectChat}
            onOpenApiKeyModal={onOpenApiKeyModal}
          />
        )}
        {currentView === AppView.VOICE && (
          <VoiceView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.VIRTUAL_FRIEND && (
          <VirtualFriendView
            onOpenApiKeyModal={onOpenApiKeyModal}
            onNavigate={setView}
          />
        )}
        {(currentView === AppView.HEYGEN_AVATAR ||
          currentView === AppView.VIDEO_STUDIO) && (
          <VideoStudioView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.IMAGE_GEN && (
          <ImageGenView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.PLAYGROUND && <PlaygroundView />}
        {currentView === AppView.TRANSLATOR && (
          <TranslatorView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.DOCS && (
          <DocsView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.DEEP_RESEARCH && (
          <DeepResearchView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.CODING_AGENT && (
          <CodingAgentView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.AI_DEBUGGER && (
          <DebuggerView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.KNOWLEDGE_BASE && (
          <KnowledgeBaseView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.MULTI_AGENTS && (
          <MultiAgentsView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.AUTOMATIONS && <AutomationsView />}
        {currentView === AppView.SUPER_MODE && (
          <SuperModeView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.MODEL_HUB && (
          <ModelHubView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.ANALYTICS && <AnalyticsView />}
        {currentView === AppView.SETTINGS && (
          <SettingsView user={user} onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {/* ===== SUPERAI 2.0 NEW VIEWS ===== */}
        {currentView === AppView.AI_MEMORY && user && (
          <AIMemoryView userId={user.id} />
        )}
        {currentView === AppView.AI_SEARCH && user && (
          <AISearchView userId={user.id} />
        )}
        {currentView === AppView.MUSIC_STUDIO && <MusicStudioView />}
        {currentView === AppView.VOICE_STUDIO && (
          <VoiceStudioView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.DOCUMENT_STUDIO && (
          <DocumentStudioView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.FILE_LAB && user && (
          <FileLabView userId={user.id} onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.DATA_ANALYST && user && (
          <DataAnalystView
            userId={user.id}
            onOpenApiKeyModal={onOpenApiKeyModal}
          />
        )}
        {currentView === AppView.AGENT_HUB && user && (
          <AgentHubView
            userId={user.id}
            onOpenApiKeyModal={onOpenApiKeyModal}
          />
        )}
        {currentView === AppView.AGENT_BUILDER && user && (
          <AgentBuilderView userId={user.id} />
        )}
        {currentView === AppView.WORKFLOWS && user && (
          <WorkflowsView userId={user.id} />
        )}
        {currentView === AppView.STUDY_MODE && user && (
          <StudyModeView
            userId={user.id}
            onOpenApiKeyModal={onOpenApiKeyModal}
          />
        )}
        {currentView === AppView.AI_TUTOR && user && (
          <AITutorView userId={user.id} onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.QUIZ && user && (
          <QuizView userId={user.id} onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.FLASHCARDS && user && (
          <FlashcardsView userId={user.id} />
        )}
        {currentView === AppView.EXAM_SIMULATOR && user && (
          <ExamSimulatorView
            userId={user.id}
            onOpenApiKeyModal={onOpenApiKeyModal}
          />
        )}
        {currentView === AppView.VISION_AI && (
          <VisionAIView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.SECURITY_SCANNER && user && (
          <SecurityScannerView userId={user.id} />
        )}
        {currentView === AppView.PROFILE && user && (
          <ProfileView
            user={user}
            onUserUpdate={(u) => {
              /* handled in App */
            }}
          />
        )}
        {currentView === AppView.SUBSCRIPTION && user && (
          <SubscriptionView userId={user.id} />
        )}
        {currentView === AppView.API_PLATFORM && user && (
          <ApiPlatformView userId={user.id} />
        )}
        {currentView === AppView.PROJECTS && user && (
          <ProjectsView userId={user.id} />
        )}
        {currentView === AppView.MARKETPLACE && user && (
          <MarketplaceView userId={user.id} />
        )}
        {currentView === AppView.PLUGINS && user && (
          <PluginsView userId={user.id} />
        )}
        {currentView === AppView.ADMIN && user && (
          <AdminView currentUser={user} />
        )}
        {currentView === AppView.NOTIFICATIONS && user && (
          <NotificationsView userId={user.id} />
        )}
        {currentView === AppView.TASK_CENTER && user && (
          <TaskCenterView userId={user.id} />
        )}
        {currentView === AppView.HELP_CENTER && <HelpCenterView />}
        {currentView === AppView.SUPPORT && user && (
          <SupportView userId={user.id} />
        )}
        {currentView === AppView.WRITING_STUDIO && (
          <WritingStudioView onOpenApiKeyModal={onOpenApiKeyModal} />
        )}
        {currentView === AppView.SHARING && user && (
          <SharingView userId={user.id} />
        )}
        {currentView === AppView.GAMIFICATION && user && (
          <GamificationView userId={user.id} />
        )}
      </div>

      {/* Mobile Bottom Navigation (hidden for immersive Virtual Do'st) */}
      {currentView !== AppView.VIRTUAL_FRIEND && (
      <nav
        aria-label="Mobil navigatsiya"
        className="md:hidden glass fixed bottom-0 left-0 right-0 flex justify-around py-3 px-2 safe-area-bottom z-40 border-t border-white/10"
      >
        <button
          onClick={() => setView(AppView.CHAT)}
          aria-label="Chat bo'limi"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${currentView === AppView.CHAT ? "text-blue-400 font-bold" : "text-slate-400"}`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              strokeWidth="2"
            />
          </svg>
          <span className="text-[10px]">Chat</span>
        </button>
        <button
          onClick={() => setView(AppView.VOICE)}
          aria-label="Ovozli muloqot bo'limi"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${currentView === AppView.VOICE ? "text-blue-400 font-bold" : "text-slate-400"}`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              strokeWidth="2"
            />
          </svg>
          <span className="text-[10px]">Ovozli</span>
        </button>
        <button
          onClick={() => setView(AppView.IMAGE_GEN)}
          aria-label="Image Studio bo'limi"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${currentView === AppView.IMAGE_GEN ? "text-blue-400 font-bold" : "text-slate-400"}`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              strokeWidth="2"
            />
          </svg>
          <span className="text-[10px]">Image</span>
        </button>
        <button
          onClick={() => setView(AppView.AGENT_HUB)}
          aria-label="Agent Hub bo'limi"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${currentView === AppView.AGENT_HUB ? "text-blue-400 font-bold" : "text-slate-400"}`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              strokeWidth="2"
            />
          </svg>
          <span className="text-[10px]">Agents</span>
        </button>
      </nav>
      )}
    </div>
  );
};

export default Dashboard;
