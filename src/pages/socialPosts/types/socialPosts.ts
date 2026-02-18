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
}

export interface SocialPostsData {
    masterContents: MasterContent[];
    variants: PlatformVariant[];
    campaigns: MarketingCampaign[];
}
