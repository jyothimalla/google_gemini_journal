import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { ReflectionMode } from '../types';
import { Sparkles, Send, Lightbulb, Compass, ListChecks, MessageSquare, Loader2 } from 'lucide-react';

const MODE_OPTIONS: {
  id: ReflectionMode;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'reflect',
    label: 'Reflect & Deepen',
    desc: 'Mindful exploration of emotions and personal growth',
    icon: Compass,
  },
  {
    id: 'summarize',
    label: 'Synthesize & Summarize',
    desc: 'Extract key takeaways, core themes, and realizations',
    icon: MessageSquare,
  },
  {
    id: 'actionable',
    label: 'Action Items & Habits',
    desc: 'Translate reflections into concrete, manageable next steps',
    icon: ListChecks,
  },
  {
    id: 'brainstorm',
    label: 'Creative Brainstorming',
    desc: 'Generate novel perspectives and thought experiments',
    icon: Lightbulb,
  },
];

const INSPIRATIONAL_PROMPTS = [
  "What is one challenge I encountered today, and what did it teach me about my priorities?",
  "Reflecting on a recent decision: What emotions drove it, and how can I align better with my long-term goals?",
  "Brainstorm 3 unconventional solutions to overcome the creative block I'm experiencing right now.",
  "Summarize my thoughts on balancing deep focused work with restful recovery this week.",
];

interface JournalEditorProps {
  initialPrompt?: string;
  initialMode?: ReflectionMode;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({ initialPrompt = '', initialMode = 'reflect' }) => {
  const { createNewInteraction, isLoadingAI } = useJournal();
  const [promptText, setPromptText] = useState(initialPrompt);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<ReflectionMode>(initialMode);

  React.useEffect(() => {
    if (initialPrompt) {
      setPromptText(initialPrompt);
    }
  }, [initialPrompt]);

  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || isLoadingAI) return;

    try {
      await createNewInteraction(promptText, mode, title.trim() || undefined);
      setPromptText('');
      setTitle('');
    } catch (err) {
      console.error('Error creating journal entry:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-sm text-zinc-100">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                New Reflection Thread
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] uppercase font-mono tracking-widest rounded-full border border-indigo-500/20">
                  Live Session
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Write freely. Gemini will respond and converse multi-turn with you.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            Engine: Gemini 3.6 Flash
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode Selection Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
              Select Reflection Objective
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMode(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start space-x-3 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-md'
                        : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/80 text-zinc-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className={`text-[11px] mt-0.5 leading-tight ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Entry Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Navigating Mid-Year Career Growth & Clarity"
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-500 transition-colors"
            />
          </div>

          {/* Reflection Content Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Your Reflection / Journal Thoughts
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {promptText.length} / 10,000 characters
              </span>
            </div>
            <textarea
              rows={6}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What is on your mind today? Write candidly about your experiences, goals, dilemmas, or feelings..."
              className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-500 font-sans leading-relaxed resize-y transition-colors"
              required
            />
          </div>

          {/* Inspirational Prompt Chips */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 mb-2 block">
              Prompt Starters:
            </span>
            <div className="flex flex-wrap gap-2">
              {INSPIRATIONAL_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPromptText(prompt)}
                  className="text-left text-[11px] px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800 leading-snug cursor-pointer"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-mono text-[10px]">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-mono text-[10px]">Enter</kbd> to submit
            </span>

            <button
              type="submit"
              disabled={isLoadingAI || !promptText.trim()}
              className="ml-auto flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>Conversing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Begin Reflection</span>
                  <Send className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
