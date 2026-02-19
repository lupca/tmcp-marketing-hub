import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocialPostsForm } from '../../../../src/pages/socialPosts/hooks/useSocialPostsForm';
import pb from '../../../../src/lib/pocketbase';

vi.mock('../../../../src/lib/pocketbase', () => ({
  default: {
    collection: vi.fn(() => ({
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe('useSocialPostsForm - Metadata Handling', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes variantForm with all metadata fields on create', () => {
    const { result } = renderHook(() => useSocialPostsForm(mockOnSuccess, mockOnError));

    act(() => {
      result.current.openCreateVariant('master-123', 'Core message');
    });

    expect(result.current.variantForm).toEqual(
      expect.objectContaining({
        platform: 'facebook',
        adapted_copy: 'Core message',
        publish_status: 'draft',
        scheduled_at: '',
        hashtags: '',
        call_to_action: '',
        summary: '',
        character_count: 0,
        platform_tips: '',
        confidence_score: 0,
        optimization_notes: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
      })
    );
  });

  it('builds metadata JSON on handleSaveVariant', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'new-variant' });
    vi.mocked(pb.collection).mockReturnValue({
      create: mockCreate,
      update: vi.fn(),
      delete: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSocialPostsForm(mockOnSuccess, mockOnError));

    act(() => {
      result.current.openCreateVariant('master-123', 'Core message');
      result.current.setVariantForm({
        ...result.current.variantForm,
        hashtags: '#ai #ml',
        call_to_action: 'Learn more',
        summary: 'Test summary',
        character_count: 150,
        platform_tips: 'Post at 9 AM',
        confidence_score: 4.5,
        optimization_notes: 'Optimized for engagement',
        seo_title: 'SEO Title',
        seo_description: 'SEO Description',
        seo_keywords: 'AI, ML, Marketing',
      });
    });

    await act(async () => {
      await result.current.handleSaveVariant('workspace-123');
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: 'workspace-123',
        master_content_id: 'master-123',
        metadata: expect.stringContaining('"hashtags":"#ai #ml"'),
      })
    );

    // Parse the metadata JSON to verify structure
    const createCall = mockCreate.mock.calls[0][0];
    const metadata = JSON.parse(createCall.metadata);
    
    expect(metadata).toEqual({
      hashtags: '#ai #ml',
      call_to_action: 'Learn more',
      summary: 'Test summary',
      character_count: 150,
      platform_tips: 'Post at 9 AM',
      confidence_score: 4.5,
      optimization_notes: 'Optimized for engagement',
      seo_title: 'SEO Title',
      seo_description: 'SEO Description',
      seo_keywords: 'AI, ML, Marketing',
    });
  });

  it('parses metadata JSON on openEditVariant', () => {
    const { result } = renderHook(() => useSocialPostsForm(mockOnSuccess, mockOnError));

    const mockVariant = {
      id: 'variant-123',
      platform: 'instagram',
      adapted_copy: 'IG content',
      publish_status: 'draft',
      scheduled_at: '2026-02-20T10:00:00Z',
      master_content_id: 'master-123',
      metadata: JSON.stringify({
        hashtags: ['#ig', '#photo'],
        call_to_action: 'Swipe up',
        summary: 'IG summary',
        character_count: 200,
        platform_tips: 'Use visuals',
        confidence_score: 4.3,
        optimization_notes: 'Visual focus',
        seo_title: 'IG Title',
        seo_description: 'IG Desc',
        seo_keywords: ['Instagram', 'Photos'],
      }),
    };

    act(() => {
      result.current.openEditVariant(mockVariant as any);
    });

    expect(result.current.variantForm).toEqual(
      expect.objectContaining({
        platform: 'instagram',
        adapted_copy: 'IG content',
        hashtags: '#ig #photo',  // Array joined
        call_to_action: 'Swipe up',
        summary: 'IG summary',
        character_count: 200,
        platform_tips: 'Use visuals',
        confidence_score: 4.3,
        optimization_notes: 'Visual focus',
        seo_title: 'IG Title',
        seo_description: 'IG Desc',
        seo_keywords: 'Instagram, Photos',  // Array joined with comma
      })
    );
  });

  it('handles metadata JSON parse error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useSocialPostsForm(mockOnSuccess, mockOnError));

    const mockVariant = {
      id: 'variant-123',
      platform: 'twitter',
      adapted_copy: 'Tweet',
      publish_status: 'draft',
      scheduled_at: '',
      master_content_id: 'master-123',
      metadata: 'invalid json {',
    };

    act(() => {
      result.current.openEditVariant(mockVariant as any);
    });

    // Should still work with empty metadata
    expect(result.current.variantForm.platform).toBe('twitter');
    expect(result.current.variantForm.hashtags).toBe('');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('handles array hashtags conversion properly', () => {
    const { result } = renderHook(() => useSocialPostsForm(mockOnSuccess, mockOnError));

    const mockVariant = {
      id: 'variant-123',
      platform: 'facebook',
      adapted_copy: 'FB content',
      publish_status: 'draft',
      scheduled_at: '',
      master_content_id: 'master-123',
      metadata: JSON.stringify({
        hashtags: ['#fb', '#social', '#marketing'],
      }),
    };

    act(() => {
      result.current.openEditVariant(mockVariant as any);
    });

    expect(result.current.variantForm.hashtags).toBe('#fb #social #marketing');
  });

  it('handles string hashtags as-is', () => {
    const { result } = renderHook(() => useSocialPostsForm(mockOnSuccess, mockOnError));

    const mockVariant = {
      id: 'variant-123',
      platform: 'facebook',
      adapted_copy: 'FB content',
      publish_status: 'draft',
      scheduled_at: '',
      master_content_id: 'master-123',
      metadata: JSON.stringify({
        hashtags: '#already #string',
      }),
    };

    act(() => {
      result.current.openEditVariant(mockVariant as any);
    });

    expect(result.current.variantForm.hashtags).toBe('#already #string');
  });

  it('includes platformMediaIds in save request', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'new-variant' });
    vi.mocked(pb.collection).mockReturnValue({
      create: mockCreate,
      update: vi.fn(),
      delete: vi.fn(),
    } as any);

    const { result } = renderHook(() => useSocialPostsForm(mockOnSuccess, mockOnError));

    act(() => {
      result.current.openCreateVariant('master-123', 'Core message');
    });

    await act(async () => {
      await result.current.handleSaveVariant('workspace-123');
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        platformMediaIds: [],
      })
    );
  });
});
