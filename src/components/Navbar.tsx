import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, LogOut, User as UserIcon, PlusCircle, CheckCircle } from 'lucide-react';
import { SecurityBadgeModal } from './SecurityBadgeModal';
import { useJournal } from '../context/JournalContext';

export const Navbar: React.FC = () => {
  const { user, isDemoUser, logout } = useAuth();
  const { setActiveInteractionId, isSaving } = useJournal();
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3.5 transition-all text-zinc-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveInteractionId(null)}
              className="flex items-center space-x-3 text-left group focus:outline-hidden cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs group-hover:scale-105 transition-transform">
                <span className="text-base font-bold">G</span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight leading-tight flex items-center gap-2">
                  GeminiLog
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] uppercase font-mono tracking-widest rounded-full border border-indigo-500/20">
                    Bento
                  </span>
                </h1>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
                  Private AI Journal & Summarizer
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sync status indicator */}
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs">
              <CheckCircle className={`w-3.5 h-3.5 ${isSaving ? 'text-indigo-400 animate-spin' : 'text-emerald-400'}`} />
              <span className="text-[11px] font-medium">{isSaving ? 'Syncing...' : 'Firestore Protected'}</span>
            </div>

            {/* Threat Modeling / Security Info */}
            <button
              onClick={() => setShowSecurityModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-800 cursor-pointer"
              title="Inspect Security & Threat Model"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Threat Model</span>
            </button>

            {/* New Entry Button */}
            <button
              onClick={() => setActiveInteractionId(null)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center pl-2 border-l border-zinc-800 space-x-2">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
                      {user.displayName || 'Journaler'}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {isDemoUser ? 'Preview Member' : 'Verified Google'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SecurityBadgeModal isOpen={showSecurityModal} onClose={() => setShowSecurityModal(false)} />
    </>
  );
};
