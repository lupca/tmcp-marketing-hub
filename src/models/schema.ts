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
    name: string;
    file: string; // File path
    type: 'image' | 'video' | 'document';
    tags?: string;
    ai_generated_tags?: any; // JSON
    description?: string;
}

export interface BrandIdentity extends BaseModel {
    workspace_id: string;
    name: string;
    logo?: string; // Relation to media_assets
    colors?: any; // JSON
    typography?: any; // JSON
    voice_tone?: string;
    mission_statement?: string;
    target_audience_summary?: string;
}

export interface CustomerPersona extends BaseModel {
    workspace_id: string;
    name: string;
    demographics?: any; // JSON
    psychographics?: any; // JSON
    pain_points?: string;
    goals?: string;
    buying_behavior?: string;
    avatar?: string; // Relation to media_assets
}

export interface InspirationEvent extends BaseModel {
    workspace_id: string;
    title: string;
    event_date: string; // Date
    description?: string;
    tags?: string;
    source_url?: string;
    is_recurring?: boolean;
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
    name: string;
    campaign_type?: 'awareness' | 'conversion' | 'retargeting' | 'newsletter' | 'social_series';
    status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
    budget?: number;
    kpi_targets?: any; // JSON
    start_date?: string; // Date
    end_date?: string; // Date
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
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: string; // Date
    platform_account_id?: string;
    status: 'active' | 'expired' | 'disconnected';
    metadata?: any; // JSON
}

export interface PromptTemplate extends BaseModel {
    workspace_id: string;
    name: string;
    template_content: string;
    input_variables?: any; // JSON
    model_config?: any; // JSON
    category?: string;
    is_public?: boolean;
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
}
