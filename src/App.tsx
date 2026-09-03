/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { JournalProvider, useJournal } from './context/JournalContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { ConversationView } from './components/ConversationView';
import { BentoWidgets } from './components/BentoWidgets';
import { ErrorBanner } from './components/ErrorBanner';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';
import { Menu, X, Loader2 } from 'lucide-react';
import { ReflectionMode } from './types';

const MainDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const {
    activeInteraction,
    errorMessage,
    clearError,
    retryLastAction,
    setActiveInteractionId,
  } = useJournal();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string>('');
  const [prefilledMode, setPrefilledMode] = useState<ReflectionMode>('reflect');

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center space-y-3 bg-zinc-950 text-zinc-100">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-medium text-zinc-400">Loading reflection vault...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleSelectPrompt = (prompt: string, mode: ReflectionMode) => {
    setActiveInteractionId(null);
    setPrefilledPrompt(prompt);
    setPrefilledMode(mode);
  };

  return (
    <div className="flex grow min-h-[calc(100vh-65px)] overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-3.5 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-500 transition-colors cursor-pointer"
          title="Toggle Journal History"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* History Sidebar */}
      <div
        className={`fixed lg:static inset-y-[65px] left-0 z-30 transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <HistorySidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Main Content Area in Bento Layout */}
      <main className="grow overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full space-y-6">
        {errorMessage && (
          <ErrorBanner
            message={errorMessage}
            onRetry={retryLastAction}
            onDismiss={clearError}
          />
        )}

        {/* Top Bento Widgets Grid */}
        <BentoWidgets
          onSelectPrompt={handleSelectPrompt}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />

        {/* Primary Interactive Workspace */}
        {activeInteraction ? (
          <ConversationView />
        ) : (
          <JournalEditor
            initialPrompt={prefilledPrompt}
            initialMode={prefilledMode}
          />
        )}
      </main>

      <SecurityBadgeModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <JournalProvider>
        <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
          <Navbar />
          <MainDashboard />
        </div>
      </JournalProvider>
    </AuthProvider>
  );
}
