import React from 'react';
import { ShieldCheck, Lock, Database, Key, Cpu, X, CheckCircle2 } from 'lucide-react';
import { ThreatZoneAssessment } from '../types';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THREAT_MODEL_DATA: ThreatZoneAssessment[] = [
  {
    zone: '1. Input Surfaces',
    threat: 'Unsanitized user reflections, prompt injections, or oversized payload flooding.',
    countermeasure: 'Strict string truncation (10k chars), stripUndefined sanitation, and delimited prompt boundaries.',
    status: 'Enforced',
  },
  {
    zone: '2. Planning & Reasoning',
    threat: 'Model hallucination, instruction bypass, or unhandled generation failures.',
    countermeasure: 'Resilient Model Fallback Ladder (gemini-3.6-flash -> gemini-3.1-flash-lite -> gemini-flash-latest -> gemini-3.7-flash) with error matrix.',
    status: 'Verified',
  },
  {
    zone: '3. Tool Execution',
    threat: 'API key leakage to client bundle or unauthorized server-side actions.',
    countermeasure: 'Server-side Express proxy with zero client exposure of GEMINI_API_KEY and telemetry headers.',
    status: 'Enforced',
  },
  {
    zone: '4. Memory & State',
    threat: 'Cross-user data leakage or unauthorized access to other users\' journal entries.',
    countermeasure: 'Strict path-isolated Firestore rules (/users/{userId}/interactions/{interactionId}) validating request.auth.uid == userId.',
    status: 'Enforced',
  },
  {
    zone: '5. Inter-System Communication',
    threat: 'Token leakage, insecure credentials, or third-party database hijacking.',
    countermeasure: 'Federated Google Identity via Firebase Auth (no plaintext passwords) and Secret Manager injection.',
    status: 'Implemented',
  },
];

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto text-zinc-100">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Security Architecture & Threat Model</h3>
              <p className="text-xs text-zinc-400">OWASP Top 10 & 5-Zone Agentic Threat Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="flex items-center space-x-2 text-zinc-200 font-medium text-xs mb-1">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Zero Trust Auth</span>
              </div>
              <p className="text-[11px] text-zinc-400">Google Federated Sign-In with no stored passwords</p>
            </div>
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="flex items-center space-x-2 text-zinc-200 font-medium text-xs mb-1">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>User Isolation</span>
              </div>
              <p className="text-[11px] text-zinc-400">Firestore owner-bound rules at /users/{'{userId}'}</p>
            </div>
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="flex items-center space-x-2 text-zinc-200 font-medium text-xs mb-1">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Resilient AI</span>
              </div>
              <p className="text-[11px] text-zinc-400">Server-side 4-model fallback ladder with zero key leak</p>
            </div>
          </div>

          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 pt-2 font-mono">
            Threat Analysis & Countermeasures
          </h4>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80 text-xs bg-zinc-950">
            {THREAT_MODEL_DATA.map((item, idx) => (
              <div key={idx} className="p-3.5 hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-zinc-200">{item.zone}</span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{item.status}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5 text-zinc-400">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono">Risk Surface:</span>
                    <p className="text-[11px] text-zinc-300">{item.threat}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono">Countermeasure:</span>
                    <p className="text-[11px] text-zinc-400">{item.countermeasure}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200">
            <div className="flex items-center space-x-1.5 font-semibold mb-1 text-indigo-300">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Production Firestore Security Rules Verified</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">
              match /users/{'{userId}'}/interactions/{'{interactionId}'} {'{'} allow read, write: if request.auth != null && request.auth.uid == userId; {'}'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
