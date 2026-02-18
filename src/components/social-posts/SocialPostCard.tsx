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
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-medium leading-relaxed" title={stripHtml(mc.core_message || '')}>
              {truncate(mc.core_message || '', 200) || <span className="italic text-gray-400">No core message</span>}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${APPROVAL_BADGE[mc.approval_status || 'pending'] || APPROVAL_BADGE.pending}`}>
                {(mc.approval_status || 'pending').replace('_', ' ')}
              </span>
              {campaignName && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {campaignName}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
              className="p-1.5 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-50"
              onClick={() => form.openCreateVariant(mc.id, stripHtml(mc.core_message || ''))}
            >
              <Plus size={16} />
            </button>
            <button
              title="Edit"
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
              onClick={() => form.openEditMc(mc)}
            >
              <Edit2 size={16} />
            </button>
            <button
              title="Delete"
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
              onClick={() => form.setDeleteMcId(mc.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {mcVariants.length > 0 && (
          <button
            className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            onClick={onToggleExpand}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? 'Hide' : 'Show'} variants ({mcVariants.length})
          </button>
        )}
        {mcVariants.length === 0 && (
          <p className="mt-3 text-xs text-gray-400 italic">
            No variants yet &mdash;{' '}
            <button
              className="text-blue-600 hover:underline font-medium"
              onClick={() => form.openCreateVariant(mc.id, stripHtml(mc.core_message || ''))}
            >
              Add Variant
            </button>{' '}
            to adapt for platforms
          </p>
        )}
      </div>
      {isExpanded && mcVariants.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Platform</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Content</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Scheduled</th>
                <th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mcVariants.map(v => (
                <tr key={v.id} className="hover:bg-white/60">
                  <td className="px-5 py-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${PLATFORM_COLORS[v.platform] || 'bg-gray-100 text-gray-800'}`}>
                      {v.platform}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <p className="text-gray-700 max-w-xs truncate">{truncate(v.adapted_copy || '', 80)}</p>
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
                    <div className="flex justify-end gap-1">
                      <button
                        title="Edit"
                        className="p-1 text-gray-400 hover:text-blue-600"
                        onClick={() => form.openEditVariant(v)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        title="Delete"
                        className="p-1 text-gray-400 hover:text-red-600"
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
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
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
