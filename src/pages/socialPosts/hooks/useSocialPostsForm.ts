import { useState } from 'react';
import pb from '../../../lib/pocketbase';
import { MasterContent, PlatformVariant } from '../../../models/schema';
import { MasterContentForm, VariantForm } from '../types/socialPosts';
import { convertScheduledAtToISO } from '../utils/socialPostsHelpers';

export const useSocialPostsForm = (
    onSuccess: () => void,
    onError: (message: string) => void,
) => {
    // MasterContent modal state
    const [mcModal, setMcModal] = useState<'create' | 'edit' | null>(null);
    const [mcEditId, setMcEditId] = useState<string | null>(null);
    const [mcForm, setMcForm] = useState<MasterContentForm>({
        core_message: '',
        campaign_id: '',
        approval_status: 'pending',
    });

    // Variant modal state
    const [variantModal, setVariantModal] = useState<'create' | 'edit' | null>(null);
    const [variantEditId, setVariantEditId] = useState<string | null>(null);
    const [variantParentId, setVariantParentId] = useState<string | null>(null);
    const [variantForm, setVariantForm] = useState<VariantForm>({
        platform: 'facebook',
        adapted_copy: '',
        publish_status: 'draft',
        scheduled_at: '',
    });

    // Delete confirm state
    const [deleteMcId, setDeleteMcId] = useState<string | null>(null);
    const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);

    // ─── MasterContent CRUD ──────────────────────────────────────────────────

    const openCreateMc = () => {
        setMcForm({ core_message: '', campaign_id: '', approval_status: 'pending' });
        setMcEditId(null);
        setMcModal('create');
    };

    const openEditMc = (mc: MasterContent) => {
        setMcForm({
            core_message: mc.core_message || '',
            campaign_id: mc.campaign_id || '',
            approval_status: mc.approval_status || 'pending',
        });
        setMcEditId(mc.id);
        setMcModal('edit');
    };

    const handleSaveMc = async (currentWorkspaceId: string) => {
        try {
            const body = {
                workspace_id: currentWorkspaceId,
                core_message: mcForm.core_message,
                campaign_id: mcForm.campaign_id || null,
                approval_status: mcForm.approval_status,
                primaryMediaIds: [],
            };

            if (mcModal === 'edit' && mcEditId) {
                await pb.collection('master_contents').update(mcEditId, body);
            } else {
                await pb.collection('master_contents').create(body);
            }
            setMcModal(null);
            onSuccess();
        } catch (e: any) {
            onError(e.message || 'Save failed');
        }
    };

    const handleDeleteMc = async () => {
        if (!deleteMcId) return;
        try {
            await pb.collection('master_contents').delete(deleteMcId);
            setDeleteMcId(null);
            onSuccess();
        } catch (e: any) {
            onError(e.message || 'Delete failed');
        }
    };

    // ─── PlatformVariant CRUD ────────────────────────────────────────────────

    const openCreateVariant = (masterContentId: string, coreMessage: string) => {
        setVariantForm({
            platform: 'facebook',
            adapted_copy: coreMessage,
            publish_status: 'draft',
            scheduled_at: '',
        });
        setVariantParentId(masterContentId);
        setVariantEditId(null);
        setVariantModal('create');
    };

    const openEditVariant = (v: PlatformVariant) => {
        setVariantForm({
            platform: v.platform || 'facebook',
            adapted_copy: v.adapted_copy || '',
            publish_status: v.publish_status || 'draft',
            scheduled_at: v.scheduled_at ? v.scheduled_at.slice(0, 16) : '',
        });
        setVariantEditId(v.id);
        setVariantParentId(v.master_content_id);
        setVariantModal('edit');
    };

    const handleSaveVariant = async (currentWorkspaceId: string) => {
        if (!variantParentId) return;
        try {
            // Convert scheduled_at to ISO string if present
            const scheduledAtISO = convertScheduledAtToISO(variantForm.scheduled_at);

            const body = {
                workspace_id: currentWorkspaceId,
                master_content_id: variantParentId,
                platform: variantForm.platform,
                adapted_copy: variantForm.adapted_copy,
                publish_status: variantForm.publish_status,
                scheduled_at: scheduledAtISO,
                platformMediaIds: [],
            };

            if (variantModal === 'edit' && variantEditId) {
                await pb.collection('platform_variants').update(variantEditId, body);
            } else {
                await pb.collection('platform_variants').create(body);
            }
            setVariantModal(null);
            onSuccess();
        } catch (e: any) {
            onError(e.message || 'Save failed');
        }
    };

    const handleDeleteVariant = async () => {
        if (!deleteVariantId) return;
        try {
            await pb.collection('platform_variants').delete(deleteVariantId);
            setDeleteVariantId(null);
            onSuccess();
        } catch (e: any) {
            onError(e.message || 'Delete failed');
        }
    };

    return {
        // MasterContent
        mcModal,
        setMcModal,
        mcForm,
        setMcForm,
        openCreateMc,
        openEditMc,
        handleSaveMc,
        deleteMcId,
        setDeleteMcId,
        handleDeleteMc,
        // Variant
        variantModal,
        setVariantModal,
        variantForm,
        setVariantForm,
        variantParentId,
        openCreateVariant,
        openEditVariant,
        handleSaveVariant,
        deleteVariantId,
        setDeleteVariantId,
        handleDeleteVariant,
    };
};
