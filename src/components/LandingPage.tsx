import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, Lock, Brain, ArrowRight, Database, Zap, BookOpen } from 'lucide-react';
import { SecurityBadgeModal } from './SecurityBadgeModal';

export const LandingPage: React.FC = () => {
  const { loginWithGoogle, loginAsDemoUser, loading, authError, clearAuthError } = useAuth();
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col justify-between py-8 px-4 sm:px-6 max-w-6xl mx-auto text-zinc-100">
      {/* Top Banner / Security Badge */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowSecurityModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">OWASP & 5-Zone Threat Modeled Architecture</span>
          <span className="text-zinc-600">|</span>
          <span className="text-indigo-400 underline text-[11px]">View Specs</span>
        </button>
      </div>

      {/* Main Hero & Auth Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-auto">
        {/* Left Column: Description & Bento Feature Grid */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-mono font-semibold uppercase tracking-widest">
              Gemini 3.6 Flash + Cloud Firestore
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-100 tracking-tight leading-[1.15]">
              Reflect deeper. <br className="hidden sm:inline" />
              <span className="text-indigo-400">Converse with clarity.</span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
              A private, multi-turn AI journaling vault. Capture daily thoughts, brainstorm new directions, and receive synthesized reflections from Google Gemini, strictly isolated to your authenticated account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-start space-x-3.5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Multi-Turn Reflections</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Explore ideas through continuous back-and-forth dialogue.</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-start space-x-3.5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Per-User Data Isolation</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Owner-bound Firestore rules prevent cross-user data leakage.</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-start space-x-3.5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">4-Model AI Resilience</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Automated fallback ladder ensures 99.9% prompt uptime.</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-start space-x-3.5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Structured Summaries</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Auto-extract takeaways, sentiment, and actionable habits.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bento Authentication Card */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-2xl">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm font-bold text-xl">
                G
              </div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Welcome to your Journal</h2>
              <p className="text-xs text-zinc-400">
                Sign in securely to open your private reflection vault
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 text-red-200 rounded-2xl text-xs flex justify-between items-start">
                <p className="leading-snug">{authError}</p>
                <button onClick={clearAuthError} className="text-zinc-400 hover:text-zinc-200 ml-2">×</button>
              </div>
            )}

            <div className="space-y-3">
              {/* Google Sign In Button */}
              <button
                onClick={loginWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-zinc-800"></div>
                <span className="shrink mx-3 text-zinc-500 text-[11px] uppercase font-mono tracking-wider font-semibold">Or Instant Demo</span>
                <div className="grow border-t border-zinc-800"></div>
              </div>

              {/* Instant Demo Access */}
              <button
                onClick={() => loginAsDemoUser()}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 rounded-xl font-medium text-xs transition-colors border border-zinc-700/60 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Explore with Instant Preview Mode</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero stored passwords. No third-party tracking.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Specs Footer */}
      <div className="mt-12 pt-6 border-t border-zinc-800/80 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-zinc-400">Tech Architecture:</span>
            <span>Firebase Auth (Google)</span>
            <span>•</span>
            <span>Cloud Firestore (ABAC Isolated)</span>
            <span>•</span>
            <span>Gemini 3.6 Flash</span>
          </div>
          <button
            onClick={() => setShowSecurityModal(true)}
            className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
          >
            Threat Model & Rules Documentation
          </button>
        </div>
      </div>

      <SecurityBadgeModal isOpen={showSecurityModal} onClose={() => setShowSecurityModal(false)} />
    </div>
  );
};
