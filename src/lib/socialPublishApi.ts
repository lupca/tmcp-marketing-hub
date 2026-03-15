import pb from './pocketbase';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL || '/pb';

export interface PublishFacebookVariantPayload {
    workspace_id: string;
    variant_id: string;
}

export interface PublishFacebookVariantResponse {
    workspace_id: string;
    variant_id: string;
    platform: 'facebook';
    publish_status: 'published' | 'failed' | string;
    platform_post_id?: string;
    facebook_response?: any;
}

export async function publishFacebookVariant(payload: PublishFacebookVariantPayload): Promise<PublishFacebookVariantResponse> {
    const token = pb.authStore.token;

    const res = await fetch(`${PB_URL}/api/social/facebook/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    let body: any = null;
    try {
        body = await res.json();
    } catch {
        body = null;
    }

    if (!res.ok) {
        const message = body?.message || body?.data?.message || `Publish failed with status ${res.status}`;
        throw new Error(message);
    }

    return body as PublishFacebookVariantResponse;
}
