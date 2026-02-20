import { useState, useCallback, useRef, useEffect } from 'react';

// Note: handleSSEEvent is kept in code structure but main streaming is handled through fetch API

export interface ActivityLogEvent {
  type: 'status' | 'chunk' | 'platform' | 'done' | 'error' | 'tool_start' | 'tool_end' | 'warn';
  [key: string]: any;
}

export interface UseAIContentGenerationReturn {
  isLoading: boolean;
  events: ActivityLogEvent[];
  error: string | null;
  generatedContent: any | null;
  startGeneratingMasterContent: (campaignId: string, workspaceId: string, language?: string) => Promise<void>;
  startGeneratingVariants: (masterContentId: string, platforms: string[], workspaceId: string, language?: string) => Promise<void>;
  startBatchGeneratingPosts: (campaignId: string, platforms: string[], numMasters: number, workspaceId: string, language?: string) => Promise<void>;
  reset: () => void;
}

const API_BASE_URL = import.meta.env.VITE_AGENTS_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAIContentGeneration = (): UseAIContentGenerationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<ActivityLogEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setEvents([]);
    setError(null);
    setGeneratedContent(null);
  }, []);

  const pushEvent = useCallback((data: ActivityLogEvent) => {
    setEvents(prev => [...prev, data]);
  }, []);

  const handleStreamEvent = useCallback((data: any) => {
    pushEvent(data);

    if (data.type === 'done') {
      setGeneratedContent(data);
      setIsLoading(false);
    } else if (data.type === 'error') {
      setError(data.error || 'An error occurred during generation');
      setIsLoading(false);
    }
  }, [pushEvent]);

  const streamSSE = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            handleStreamEvent(data);
          } catch (e) {
            console.error('Failed to parse event:', e);
          }
        }
      }
    }
  }, [handleStreamEvent]);

  const startStream = useCallback(async (url: string, body: any) => {
    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      await streamSSE(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (err instanceof TypeError) {
        pushEvent({ type: 'warn', message: 'Connection interrupted. Generation continues on server.' });
        setIsLoading(false);
        return;
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [pushEvent, streamSSE]);

  const startGeneratingMasterContent = useCallback(
    async (campaignId: string, workspaceId: string, language: string = 'Vietnamese') => {
      reset();
      setIsLoading(true);
      setEvents([]);
      setError(null);

      await startStream(`${API_BASE_URL}/generate-master-content`, {
        campaignId,
        workspaceId,
        languagePreference: language,
      });
    },
    [reset, startStream]
  );

  const startGeneratingVariants = useCallback(
    async (masterContentId: string, platforms: string[], workspaceId: string, language: string = 'Vietnamese') => {
      reset();
      setIsLoading(true);
      setEvents([]);
      setError(null);

      await startStream(`${API_BASE_URL}/generate-platform-variants/${masterContentId}`, {
        platforms,
        workspaceId,
        languagePreference: language,
      });
    },
    [reset, startStream]
  );

  const startBatchGeneratingPosts = useCallback(
    async (campaignId: string, platforms: string[], numMasters: number, workspaceId: string, language: string = 'Vietnamese') => {
      reset();
      setIsLoading(true);
      setEvents([]);
      setError(null);

      await startStream(`${API_BASE_URL}/batch-generate-posts`, {
        campaignId,
        workspaceId,
        language,
        platforms,
        numMasters,
      });
    },
    [reset, startStream]
  );

  return {
    isLoading,
    events,
    error,
    generatedContent,
    startGeneratingMasterContent,
    startGeneratingVariants,
    startBatchGeneratingPosts,
    reset,
  };
};
