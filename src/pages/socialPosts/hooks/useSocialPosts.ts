import { useEffect, useState } from 'react';
import pb from '../../../lib/pocketbase';
import { MasterContent, PlatformVariant, MarketingCampaign } from '../../../models/schema';
import { SocialPostsData } from '../types/socialPosts';
import { sortByCreatedDesc } from '../utils/socialPostsHelpers';

export const useSocialPosts = (workspaceId: string | undefined) => {
    const [data, setData] = useState<SocialPostsData>({
        masterContents: [],
        variants: [],
        campaigns: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        if (!workspaceId) return;
        setLoading(true);
        setError(null);
        try {
            const filter = `workspace_id = "${workspaceId}"`;
            const [mcRes, pvRes, campRes] = await Promise.all([
                pb.collection('master_contents').getList<MasterContent>(1, 200, {
                    filter,
                }),
                pb.collection('platform_variants').getList<PlatformVariant>(1, 200, {
                    filter,
                }),
                pb.collection('marketing_campaigns').getList<MarketingCampaign>(1, 200, { filter }),
            ]);

            // Sort client-side to avoid PocketBase API filter+sort issue
            const sortedMasterContents = sortByCreatedDesc(mcRes.items);
            const sortedVariants = sortByCreatedDesc(pvRes.items);

            setData({
                masterContents: sortedMasterContents,
                variants: sortedVariants,
                campaigns: campRes.items,
            });
        } catch (e: any) {
            setError(e.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [workspaceId]);

    return { data, loading, error, reload: load };
};
