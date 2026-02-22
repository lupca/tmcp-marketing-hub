/**
 * This file contains the TypeScript definitions for the PocketBase schema.
 * It is the Single Source of Truth for all data models in the frontend.
 * Based on marketing_schema.json
 */

import PocketBase, { RecordService } from 'pocketbase';

// ==========================================
// Base Types
// ==========================================

export interface BaseModel {
    id: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
}

// ==========================================
// Collection Types
// ==========================================

export interface Workspace extends BaseModel {
    name: string;
    owner_id: string;
    members: string[]; // Relation to users (multiple)
    settings?: any; // JSON
}

export interface MediaAsset extends BaseModel {
    workspace_id: string;
    file: string; // File path
    file_type: 'image' | 'video' | 'doc';
    aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:5' | '4:3' | 'N/A';
    tags?: any; // JSON
}

export interface BrandIdentity extends BaseModel {
    workspace_id: string;
    brand_name: string;
    core_messaging?: any; // JSON
    visual_assets?: any; // JSON
    voice_and_tone?: string; // HTML/Editor
    dos_and_donts?: any; // JSON
    content_pillars?: any; // JSON
}

export interface CustomerPersona extends BaseModel {
    workspace_id: string;
    persona_name: string;
    summary?: string;
    demographics?: any; // JSON
    psychographics?: any; // JSON
}

export interface InspirationEvent extends BaseModel {
    workspace_id: string;
    event_name: string;
    event_date?: string; // Date
    type?: 'holiday' | 'industry_event' | 'company_milestone' | 'trend' | 'other';
    description?: string;
    suggested_angles?: any; // JSON
}

export interface Worksheet extends BaseModel {
    workspace_id: string;
    title: string;
    event_id?: string; // Relation to inspiration_events
    brandRefs: string[]; // Relation to brand_identities (multiple)
    customerRefs: string[]; // Relation to customer_personas (multiple)
    status: 'draft' | 'processing' | 'completed' | 'archived';
    agent_context?: any; // JSON
}

export interface MarketingCampaign extends BaseModel {
    workspace_id: string;
    worksheet_id?: string; // Relation to worksheets
    product_id?: string; // Relation to products_services
    name: string;
    campaign_type?: 'awareness' | 'conversion' | 'retargeting' | 'newsletter' | 'social_series';
    status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
    budget?: number;
    kpi_targets?: any; // JSON
    start_date?: string; // Date
    end_date?: string; // Date
}

export interface ProductService extends BaseModel {
    workspace_id: string;
    brand_id: string; // Relation to brand_identities
    name: string;
    description?: string;
    usp?: string;
    key_features?: any; // JSON
    key_benefits?: any; // JSON
    default_offer?: string;
}

export interface ContentBrief extends BaseModel {
    workspace_id: string;
    campaign_id: string; // Relation to marketing_campaigns
    angle_name: string;
    funnel_stage: 'Awareness' | 'Consideration' | 'Conversion' | 'Retention';
    psychological_angle: 'Fear' | 'Emotion' | 'Logic' | 'Social Proof' | 'Urgency' | 'Curiosity';
    pain_point_focus?: string;
    key_message_variation?: string;
    call_to_action_direction?: string;
    brief?: string;
}

export interface MasterContent extends BaseModel {
    workspace_id: string;
    campaign_id?: string; // Relation to marketing_campaigns
    core_message?: string; // HTML/Editor
    primaryMediaIds: string[]; // Relation to media_assets (multiple)
    approval_status?: 'pending' | 'approved' | 'rejected' | 'revision_needed';
}

export interface PlatformVariant extends BaseModel {
    workspace_id: string;
    master_content_id: string; // Relation to master_contents
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube' | 'blog' | 'email';
    adapted_copy?: string;
    platformMediaIds: string[]; // Relation to media_assets (multiple)
    publish_status: 'draft' | 'scheduled' | 'published' | 'failed';
    scheduled_at?: string; // Date
    published_at?: string; // Date
    platform_post_id?: string;
    metadata?: any; // JSON
    metric_views?: number;
    metric_likes?: number;
    metric_shares?: number;
    metric_comments?: number;
}

export interface SocialAccount extends BaseModel {
    workspace_id: string;
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube';
    account_name: string;
    account_id: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: string; // Date
}

export interface PromptTemplate extends BaseModel {
    workspace_id: string;
    agent_role: string;
    template_text: string;
}

export interface AgentLog extends BaseModel {
    workspace_id: string;
    agent_name: string;
    action: string;
    status: 'success' | 'failed' | 'pending';
    tokens_used?: number;
    error_message?: string;
}

export interface TrackingLink extends BaseModel {
    workspace_id: string;
    variant_id: string; // Relation to platform_variants
    original_url: string;
    short_url?: string;
    utm_source?: string;
    utm_campaign?: string;
    click_count?: number;
}

export interface SocialInteraction extends BaseModel {
    workspace_id: string;
    variant_id: string; // Relation to platform_variants
    platform_user_id: string;
    content: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    is_handled?: boolean;
}

export interface Lead extends BaseModel {
    workspace_id: string;
    campaign_id?: string; // Relation to marketing_campaigns
    name: string;
    email?: string;
    phone?: string;
    source?: 'web' | 'social' | 'email' | 'referral' | 'other';
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
}

export interface User extends BaseModel {
    name: string;
    email: string;
    avatar?: string;
    role: 'admin' | 'manager' | 'member' | 'viewer';
}

// ==========================================
// PocketBase Schema Definition
// ==========================================

export interface TypedPocketBase extends PocketBase {
    collection(idOrName: string): RecordService; // Generic fallback
    collection(idOrName: 'workspaces'): RecordService<Workspace>;
    collection(idOrName: 'media_assets'): RecordService<MediaAsset>;
    collection(idOrName: 'brand_identities'): RecordService<BrandIdentity>;
    collection(idOrName: 'customer_personas'): RecordService<CustomerPersona>;
    collection(idOrName: 'inspiration_events'): RecordService<InspirationEvent>;
    collection(idOrName: 'worksheets'): RecordService<Worksheet>;
    collection(idOrName: 'marketing_campaigns'): RecordService<MarketingCampaign>;
    collection(idOrName: 'master_contents'): RecordService<MasterContent>;
    collection(idOrName: 'platform_variants'): RecordService<PlatformVariant>;
    collection(idOrName: 'social_accounts'): RecordService<SocialAccount>;
    collection(idOrName: 'prompt_templates'): RecordService<PromptTemplate>;
    collection(idOrName: 'agent_logs'): RecordService<AgentLog>;
    collection(idOrName: 'tracking_links'): RecordService<TrackingLink>;
    collection(idOrName: 'social_interactions'): RecordService<SocialInteraction>;
    collection(idOrName: 'leads'): RecordService<Lead>;
    collection(idOrName: 'users'): RecordService<User>;
    collection(idOrName: 'products_services'): RecordService<ProductService>;
    collection(idOrName: 'content_briefs'): RecordService<ContentBrief>;
}
