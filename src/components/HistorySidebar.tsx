import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { useAuth } from '../context/AuthContext';
import { ReflectionInteraction, ReflectionMode } from '../types';
import { Search, PlusCircle, MessageSquare, Trash2, Calendar, Compass, ListChecks, Lightbulb, Download, User as UserIcon } from 'lucide-react';

const MODE_ICONS: Record<ReflectionMode, React.ElementType> = {
  reflect: Compass,
  summarize: MessageSquare,
  actionable: ListChecks,
  brainstorm: Lightbulb,
};

export const HistorySidebar: React.FC<{ isOpenMobile?: boolean; onCloseMobile?: () => void }> = ({
  onCloseMobile,
}) => {
  const { interactions, activeInteractionId, setActiveInteractionId, deleteInteraction } = useJournal();
  const { user, isDemoUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ReflectionMode | 'all'>('all');

  const filtered = interactions.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter === 'all' || item.mode === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    const jsonStr = JSON.stringify(interactions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geminilog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col h-[calc(100vh-65px)] sticky top-[65px] text-zinc-100">
      {/* Top action bar */}
      <div className="p-4 border-b border-zinc-800/80 space-y-3">
        <button
          onClick={() => {
            setActiveInteractionId(null);
            onCloseMobile?.();
          }}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Journal Reflection</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections..."
            className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-500 transition-colors"
          />
        </div>

        {/* Mode Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px]">
          {(['all', 'reflect', 'summarize', 'actionable', 'brainstorm'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setSelectedFilter(filterKey)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors shrink-0 cursor-pointer ${
                selectedFilter === filterKey
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800/60'
              }`}
            >
              {filterKey}
            </button>
          ))}
        </div>
      </div>

      {/* Interactions List */}
      <div className="grow overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-zinc-500 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-zinc-600 stroke-1" />
            <p className="text-xs font-medium text-zinc-400">No reflections found</p>
            <p className="text-[11px] text-zinc-500">Start a new entry to begin your journal history.</p>
          </div>
        ) : (
          filtered.map((item: ReflectionInteraction) => {
            const isSelected = activeInteractionId === item.id;
            const Icon = MODE_ICONS[item.mode] || MessageSquare;
            const snippet = item.messages[0]?.content || '';

            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveInteractionId(item.id);
                  onCloseMobile?.();
                }}
                className={`group relative p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/40 shadow-xs'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <h3 className="text-xs font-bold text-zinc-200 truncate">
                      {item.title}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this reflection entry?')) {
                        deleteInteraction(item.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition-opacity cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                  {snippet}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                  <span>
                    {new Date(item.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                    {item.messages.length} {item.messages.length === 1 ? 'turn' : 'turns'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom User / Export Section */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 space-y-2">
        <button
          onClick={handleExport}
          disabled={interactions.length === 0}
          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium transition-colors border border-zinc-800 disabled:opacity-40 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Backup (JSON)</span>
        </button>

        {user && (
          <div className="pt-2 flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-200 truncate">{user.displayName || 'Alex Rivera'}</span>
              <span className="text-[10px] text-zinc-500 font-mono">{isDemoUser ? 'Preview Member' : 'Google Verified'}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
