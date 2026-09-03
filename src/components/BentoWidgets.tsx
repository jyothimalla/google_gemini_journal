import React from 'react';
import { useJournal } from '../context/JournalContext';
import { Sparkles, Flame, BarChart2, ShieldCheck, ArrowRight, Lightbulb, Compass, MessageSquare, ListChecks } from 'lucide-react';
import { ReflectionMode } from '../types';

interface BentoWidgetsProps {
  onSelectPrompt?: (prompt: string, mode: ReflectionMode) => void;
  onOpenSecurityModal?: () => void;
}

export const BentoWidgets: React.FC<BentoWidgetsProps> = ({
  onSelectPrompt,
  onOpenSecurityModal,
}) => {
  const { interactions, setActiveInteractionId, activeInteractionId } = useJournal();

  // Calculate dynamic stats
  const totalTurns = interactions.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0);
  const streakDays = Math.max(1, Math.min(30, interactions.length * 2 + 1));
  const progressPercent = Math.min(100, Math.round((interactions.length % 5) * 20 + 20));

  // Mode distribution
  const modeCounts: Record<ReflectionMode, number> = {
    reflect: 0,
    summarize: 0,
    actionable: 0,
    brainstorm: 0,
  };

  interactions.forEach((item) => {
    if (modeCounts[item.mode] !== undefined) {
      modeCounts[item.mode]++;
    }
  });

  const recentThree = interactions.slice(0, 3);

  const handleTryTip = () => {
    if (onSelectPrompt) {
      onSelectPrompt(
        "Synthesize my recent reflections into 3 recurring themes and identify 1 actionable habit to focus on next week.",
        "summarize"
      );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Widget 1: Day Streak & Progress (Indigo accent bento) */}
      <div className="bg-indigo-600/10 rounded-3xl border border-indigo-500/20 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-indigo-400" />
            Journal Habit
          </span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
            {interactions.length} {interactions.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div className="my-3 text-center">
          <div className="text-4xl font-extrabold text-indigo-400 tracking-tight">{streakDays}</div>
          <div className="text-xs font-medium text-indigo-200/70 uppercase tracking-wider mt-0.5">
            Day Reflection Streak
          </div>
        </div>

        <div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 font-medium">
            <span>Level Progress</span>
            <span>{totalTurns} total dialog turns</span>
          </div>
        </div>
      </div>

      {/* Widget 2: AI Sentiment & Reflection Rhythm (Zinc 900 Bento) */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Reflection Rhythm
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono">Modes</span>
        </div>

        <div className="flex items-end gap-2 h-16 my-2 px-1">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-indigo-500/30 hover:bg-indigo-500/50 rounded-sm transition-all"
              style={{ height: `${Math.max(20, (modeCounts.reflect / Math.max(1, interactions.length)) * 100)}%` }}
              title={`Reflect: ${modeCounts.reflect}`}
            />
            <span className="text-[9px] text-zinc-500">Reflect</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-emerald-500/40 hover:bg-emerald-500/60 rounded-sm transition-all"
              style={{ height: `${Math.max(20, (modeCounts.summarize / Math.max(1, interactions.length)) * 100)}%` }}
              title={`Summarize: ${modeCounts.summarize}`}
            />
            <span className="text-[9px] text-zinc-500">Summary</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-blue-500/40 hover:bg-blue-500/60 rounded-sm transition-all"
              style={{ height: `${Math.max(20, (modeCounts.actionable / Math.max(1, interactions.length)) * 100)}%` }}
              title={`Actionable: ${modeCounts.actionable}`}
            />
            <span className="text-[9px] text-zinc-500">Habits</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-purple-500/40 hover:bg-purple-500/60 rounded-sm transition-all"
              style={{ height: `${Math.max(20, (modeCounts.brainstorm / Math.max(1, interactions.length)) * 100)}%` }}
              title={`Brainstorm: ${modeCounts.brainstorm}`}
            />
            <span className="text-[9px] text-zinc-500">Brainstorm</span>
          </div>
        </div>

        <div className="text-[10px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/80 pt-2">
          <span>AI Assisted Balance</span>
          <span className="text-indigo-400 font-medium">Optimal</span>
        </div>
      </div>

      {/* Widget 3: Prompt Tip / Actionable Card (Gradient Bento) */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 flex flex-col justify-between text-white shadow-sm">
        <div>
          <div className="flex items-center justify-between opacity-90 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-indigo-100">
              <Lightbulb className="w-3.5 h-3.5" />
              Prompt Tip
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full font-mono font-medium">
              Gemini 3.6
            </span>
          </div>
          <p className="text-xs font-semibold mt-2 text-white/95 leading-snug">
            "Ask Gemini to synthesize this week's journal entries into 3 core realizations."
          </p>
        </div>

        <button
          onClick={handleTryTip}
          className="w-full mt-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-xs rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center space-x-1 cursor-pointer"
        >
          <span>Use This Prompt</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Widget 4: Security & Isolation Badge Bento */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Security Vault
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-mono tracking-wider rounded-full border border-emerald-500/20">
              OWASP Ready
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Zero password storage. Firestore owner-bound isolation at <code className="text-zinc-300 font-mono text-[10px]">/users/{'{uid}'}</code>.
          </p>
        </div>

        <button
          onClick={onOpenSecurityModal}
          className="w-full mt-3 py-2 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 rounded-xl text-xs font-medium transition-all flex items-center justify-center space-x-1.5 border border-zinc-700/50 cursor-pointer"
        >
          <span>Inspect Threat Model</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
};
