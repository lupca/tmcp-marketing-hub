
import { useMemo, useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { Share2 } from 'lucide-react';
import { useSocialPosts } from './socialPosts/hooks/useSocialPosts';
import { useSocialPostsForm } from './socialPosts/hooks/useSocialPostsForm';
import { sortMasterContents } from './socialPosts/utils/socialPostsHelpers';

import SocialPostsHeader from '../components/social-posts/SocialPostsHeader';
import SocialPostCard from '../components/social-posts/SocialPostCard';
import MasterContentModal from '../components/social-posts/MasterContentModal';
import VariantModal from '../components/social-posts/VariantModal';



export default function SocialPostsPage() {
    const { currentWorkspace } = useWorkspace();
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    // Load data
    const { data, loading, reload } = useSocialPosts(currentWorkspace?.id);
    const { masterContents, variants, campaigns } = data;

    // Form state & CRUD
    const form = useSocialPostsForm(
        () => {
            toast.show('Saved successfully!', 'success');
            reload();
        },
        (message: string) => toast.show(message, 'error'),
    );

    // Derived Data
    const variantsByMaster = useMemo(() => {
        const map = new Map<string, PlatformVariant[]>();
        for (const v of variants) {
            const list = map.get(v.master_content_id) || [];
            list.push(v);
            map.set(v.master_content_id, list);
        }
        return map;
    }, [variants]);

    const campaignsById = useMemo(() => {
        const map = new Map<string, any>();
        for (const c of campaigns) map.set(c.id, c);
        return map;
    }, [campaigns]);

    const variantCountByMaster = useMemo(() => {
        const map = new Map<string, number>();
        for (const v of variants) {
            map.set(v.master_content_id, (map.get(v.master_content_id) || 0) + 1);
        }
        return map;
    }, [variants]);

    const filteredMasters = useMemo(() => {
        let arr = masterContents;
        if (search.trim()) {
            const q = search.toLowerCase();
            arr = masterContents.filter(mc => {
                const campaignName = mc.campaign_id ? campaignsById.get(mc.campaign_id)?.name || '' : '';
                return mc.core_message?.toLowerCase().includes(q) || campaignName.toLowerCase().includes(q);
            });
        }
        return sortMasterContents(arr, sortBy, variantCountByMaster);
    }, [masterContents, search, campaignsById, sortBy, variantCountByMaster]);

    // Card Expand/Collapse
    const toggleExpand = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Render
    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <SocialPostsHeader
                    search={search}
                    setSearch={setSearch}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    onCreate={form.openCreateMc}
                />

                {/* Body */}
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredMasters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <Share2 size={48} className="mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No content yet</h3>
                        <p className="mt-1">Create your first content piece and adapt it for different platforms.</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {filteredMasters.map(mc => (
                            <SocialPostCard
                                key={mc.id}
                                mc={mc}
                                mcVariants={variantsByMaster.get(mc.id) || []}
                                isExpanded={expandedCards.has(mc.id)}
                                onToggleExpand={() => toggleExpand(mc.id)}
                                campaignsById={campaignsById}
                                form={form}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* MasterContent Modal */}
            {form.mcModal && currentWorkspace && (
                <MasterContentModal
                    form={form}
                    campaigns={campaigns}
                    currentWorkspace={currentWorkspace}
                />
            )}

            {/* Variant Modal */}
            {form.variantModal && currentWorkspace && (
                <VariantModal
                    form={form}
                    currentWorkspace={currentWorkspace}
                    masterContentId={form.variantParentId}
                />
            )}

            {/* Delete Confirms */}
            {form.deleteMcId && (
                <ConfirmDialog
                    message={`Delete this content? This will also delete ${variantsByMaster.get(form.deleteMcId)?.length || 0} platform variant(s).`}
                    onConfirm={form.handleDeleteMc}
                    onCancel={() => form.setDeleteMcId(null)}
                />
            )}
            {form.deleteVariantId && (
                <ConfirmDialog
                    message="Delete this platform variant?"
                    onConfirm={form.handleDeleteVariant}
                    onCancel={() => form.setDeleteVariantId(null)}
                />
            )}
        </>
    );
}
