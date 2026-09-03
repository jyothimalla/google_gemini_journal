import React, { useState, useRef, useEffect } from 'react';
import { useJournal } from '../context/JournalContext';
import { Sparkles, Send, Copy, Check, Trash2, ArrowLeft, Loader2, BookOpen, Bot, User as UserIcon, Tag } from 'lucide-react';
import { ChatMessage } from '../types';

export const ConversationView: React.FC = () => {
  const {
    activeInteraction,
    setActiveInteractionId,
    sendFollowupMessage,
    deleteInteraction,
    generateSummary,
    isLoadingAI,
  } = useJournal();

  const [followupText, setFollowupText] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeInteraction?.messages]);

  if (!activeInteraction) return null;

  const handleSendFollowup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!followupText.trim() || isLoadingAI) return;

    const text = followupText;
    setFollowupText('');
    await sendFollowupMessage(activeInteraction.id, text);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    await generateSummary(activeInteraction.id);
    setIsSummarizing(false);
  };

  const formattedDate = new Date(activeInteraction.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-full space-y-6 text-zinc-100">
      {/* Header & Controls Bento Card */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveInteractionId(null)}
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Return to New Reflection"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeInteraction.mode}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">{formattedDate}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight mt-1">
                {activeInteraction.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing || isLoadingAI}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-700/60 bg-zinc-800/80 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isSummarizing ? 'Synthesizing...' : 'Generate Summary'}</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Delete this entire reflection thread?')) {
                  deleteInteraction(activeInteraction.id);
                }
              }}
              className="p-2 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Delete Entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Synthesis / Summary Banner if present */}
        {activeInteraction.summary && (
          <div className="mt-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Executive Synthesis & Takeaway</span>
            </div>
            <div className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {activeInteraction.summary}
            </div>
          </div>
        )}

        {/* Tags */}
        {activeInteraction.tags && activeInteraction.tags.length > 0 && (
          <div className="mt-3 flex items-center space-x-1.5 overflow-x-auto text-[11px] text-zinc-400">
            <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            {activeInteraction.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-zinc-800/80 rounded-lg text-zinc-300 border border-zinc-700/50">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div className="space-y-4">
        {activeInteraction.messages.map((msg: ChatMessage) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isUser
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-200'
                    : 'bg-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 shadow-xs relative group text-sm ${
                  isUser
                    ? 'bg-zinc-800 text-zinc-100 rounded-tr-xs border border-zinc-700/60'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-xs'
                }`}
              >
                {/* Header inside Bubble */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2 space-x-3">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                    {isUser ? 'Your Journal Reflection' : `Gemini (${msg.model || 'gemini-3.6-flash'})`}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-zinc-200 cursor-pointer"
                      title="Copy text"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap leading-relaxed font-sans text-[13px] sm:text-sm text-zinc-200">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Loading Bubble */}
        {isLoadingAI && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl rounded-tl-xs p-4 shadow-xs flex items-center space-x-2 text-zinc-300 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Gemini is synthesizing reflection and insights...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Multi-turn Followup Composer */}
      <div className="sticky bottom-4 z-20">
        <form
          onSubmit={handleSendFollowup}
          className="bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-800 p-2 sm:p-2.5 shadow-xl flex items-center space-x-2"
        >
          <input
            type="text"
            value={followupText}
            onChange={(e) => setFollowupText(e.target.value)}
            placeholder="Reply, ask a followup, or explore this reflection deeper..."
            className="grow px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 bg-transparent focus:outline-none placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={isLoadingAI || !followupText.trim()}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            {isLoadingAI ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Reply</span>
                <Send className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
