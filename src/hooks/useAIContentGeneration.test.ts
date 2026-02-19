import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIContentGeneration } from './useAIContentGeneration';

global.fetch = vi.fn();

describe('useAIContentGeneration - SSE Streaming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts generating variants with correct payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        }),
      },
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useAIContentGeneration());

    await act(async () => {
      await result.current.startGeneratingVariants(
        'master-123',
        ['facebook', 'instagram'],
        'workspace-456',
        'Vietnamese'
      );
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/generate-platform-variants/master-123'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platforms: ['facebook', 'instagram'],
          workspaceId: 'workspace-456',
          languagePreference: 'Vietnamese',
        }),
      })
    );
  });

  it('parses SSE events and updates state', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"type":"status","message":"Starting"}\n'),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"type":"done","variants":[{"platform":"facebook"}]}\n'),
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined,
        }),
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useAIContentGeneration());

    await act(async () => {
      await result.current.startGeneratingVariants(
        'master-123',
        ['facebook'],
        'workspace-456',
        'Vietnamese'
      );
    });

    await waitFor(() => {
      expect(result.current.events.length).toBeGreaterThan(0);
      expect(result.current.generatedContent).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles error events', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('data: {"type":"error","error":"Generation failed"}\n'),
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined,
        }),
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useAIContentGeneration());

    await act(async () => {
      await result.current.startGeneratingVariants(
        'master-123',
        ['facebook'],
        'workspace-456',
        'Vietnamese'
      );
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Generation failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('resets all state on reset()', async () => {
    const mockReader = {
      read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useAIContentGeneration());

    await act(async () => {
      await result.current.startGeneratingVariants(
        'master-123',
        ['facebook'],
        'workspace-456',
        'Vietnamese'
      );
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.generatedContent).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('uses correct API base URL from environment', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        }),
      },
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useAIContentGeneration());

    await act(async () => {
      await result.current.startGeneratingMasterContent(
        'campaign-123',
        'workspace-456',
        'English'
      );
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/generate-master-content'),
      expect.any(Object)
    );
  });

  it('handles fetch errors gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    const { result } = renderHook(() => useAIContentGeneration());

    await act(async () => {
      await result.current.startGeneratingVariants(
        'master-123',
        ['facebook'],
        'workspace-456',
        'Vietnamese'
      );
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
