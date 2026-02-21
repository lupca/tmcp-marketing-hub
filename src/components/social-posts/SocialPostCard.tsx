import React from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { MasterContent, PlatformVariant } from '../../models/schema';
import { PLATFORM_COLORS, APPROVAL_BADGE, PUBLISH_STATUS_BADGE } from '../../pages/socialPosts/constants/platforms';
import { stripHtml, truncate } from '../../pages/socialPosts/utils/socialPostsHelpers';

interface SocialPostCardProps {
  mc: MasterContent;
  mcVariants: PlatformVariant[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  campaignsById: Map<string, any>;
  form: any;
}

const SocialPostCard: React.FC<SocialPostCardProps> = ({ mc, mcVariants, isExpanded, onToggleExpand, campaignsById, form }) => {
  const campaignName = mc.campaign_id ? campaignsById.get(mc.campaign_id)?.name || null : null;
  return (
    <div className="glass-card rounded-xl shadow-lg group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-gray-100 font-medium leading-relaxed group-hover:text-blue-400 transition-colors" title={stripHtml(mc.core_message || '')}>
              {truncate(mc.core_message || '', 200) || <span className="italic text-gray-400">No core message</span>}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${APPROVAL_BADGE[mc.approval_status || 'pending'] || APPROVAL_BADGE.pending}`}>
                {(mc.approval_status || 'pending').replace('_', ' ')}
              </span>
              {campaignName && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {campaignName}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-500/10 text-gray-400 border-gray-500/20">
                {mcVariants.length} variant{mcVariants.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(mc.created).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              title="Add Variant"
              className="p-1.5 text-gray-400 hover:text-green-400 rounded-md hover:bg-green-500/10 transition-colors opacity-0 group-hover:opacity-100"
              onClick={() => form.openCreateVariant(mc.id, stripHtml(mc.core_message || ''))}
            >
              <Plus size={16} />
            </button>
            <button
              title="Edit"
              className="p-1.5 text-gray-400 hover:text-blue-400 rounded-md hover:bg-blue-500/10 transition-colors opacity-0 group-hover:opacity-100"
              onClick={() => form.openEditMc(mc)}
            >
              <Edit2 size={16} />
            </button>
            <button
              title="Delete"
              className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
              onClick={() => form.setDeleteMcId(mc.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {mcVariants.length > 0 && (
          <button
            className="mt-3 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            onClick={onToggleExpand}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? 'Hide' : 'Show'} variants ({mcVariants.length})
          </button>
        )}
        {mcVariants.length === 0 && (
          <p className="mt-3 text-xs text-gray-500 italic">
            No variants yet &mdash;{' '}
            <button
              className="text-blue-400 hover:underline font-medium hover:text-blue-300"
              onClick={() => form.openCreateVariant(mc.id, stripHtml(mc.core_message || ''))}
            >
              Add Variant
            </button>{' '}
            to adapt for platforms
          </p>
        )}
      </div>
      {isExpanded && mcVariants.length > 0 && (
        <div className="border-t border-glass-border bg-black/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border/50">
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-400">Platform</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-400">Content</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-400">Status</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-400">Scheduled</th>
                <th className="px-5 py-2 text-right text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/50">
              {mcVariants.map(v => (
                <tr key={v.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${PLATFORM_COLORS[v.platform] || 'bg-gray-800 text-gray-200'}`}>
                      {v.platform}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <p className="text-gray-300 max-w-xs truncate">{truncate(v.adapted_copy || '', 80)}</p>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border capitalize ${PUBLISH_STATUS_BADGE[v.publish_status] || PUBLISH_STATUS_BADGE.draft}`}>
                      {v.publish_status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-xs text-gray-500">
                    {v.scheduled_at ? new Date(v.scheduled_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Edit"
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                        onClick={() => form.openEditVariant(v)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        title="Delete"
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        onClick={() => form.setDeleteVariantId(v.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-glass-border/50">
            <button
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              onClick={() => form.openCreateVariant(mc.id, stripHtml(mc.core_message || ''))}
            >
              + Add variant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPostCard;
