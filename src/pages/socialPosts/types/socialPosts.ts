import { MasterContent, PlatformVariant, MarketingCampaign } from '../../../models/schema';

export interface MasterContentForm {
    core_message: string;
    campaign_id: string;
    approval_status: string;
}

export interface VariantForm {
    platform: string;
    adapted_copy: string;
    publish_status: string;
    scheduled_at: string;
    hashtags?: string;
    call_to_action?: string;
    summary?: string;
    character_count?: number;
    platform_tips?: string;
    confidence_score?: number;
    optimization_notes?: string;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
}

export interface SocialPostsData {
    masterContents: MasterContent[];
    variants: PlatformVariant[];
    campaigns: MarketingCampaign[];
}
