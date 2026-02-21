import { ArrowUpDown, ChevronDown, Search, Plus } from 'lucide-react';
import { SORT_OPTIONS } from '../../pages/socialPosts/constants/platforms';
import React, { useState } from 'react';

interface SocialPostsHeaderProps {
  search: string;
  setSearch: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  onCreate: () => void;
  onBatchGenerate: () => void;
}

const SocialPostsHeader: React.FC<SocialPostsHeaderProps> = ({ search, setSearch, sortBy, setSortBy, onCreate, onBatchGenerate }) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  return (
    <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4">
      <h2 className="text-xl font-bold text-white text-glow tracking-wide">Social Posts</h2>
      <div className="flex gap-2 w-full sm:w-auto items-center">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="pl-10 pr-4 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 text-white placeholder-gray-500 backdrop-blur-md transition-all"
            placeholder="Search content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-1.5 px-3 py-2 border border-glass-border rounded-lg bg-black/20 hover:bg-white/10 text-sm text-gray-300 transition-colors"
            onClick={() => setShowSortMenu(!showSortMenu)}
            title="Sort by"
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}</span>
            <ChevronDown size={14} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 glass-panel border border-glass-border rounded-lg shadow-lg z-20 py-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors ${sortBy === opt.value ? 'bg-blue-500/20 text-blue-400 font-medium' : 'text-gray-300'
                      }`}
                    onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                  >
                    <span className="w-5 text-center">{opt.icon}</span>
                    {opt.label}
                    {sortBy === opt.value && <span className="ml-auto text-blue-600">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg whitespace-nowrap"
          onClick={onCreate}
        >
          <Plus size={18} /> <span className="hidden sm:inline">New Content</span>
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600/80 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-lg whitespace-nowrap"
          onClick={onBatchGenerate}
        >
          <Plus size={18} /> <span className="hidden sm:inline">Batch Generate</span>
        </button>
      </div>
    </div>
  );
};

export default SocialPostsHeader;
