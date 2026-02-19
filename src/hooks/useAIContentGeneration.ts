import { useState, useCallback, useRef, useEffect } from 'react';

// Note: handleSSEEvent is kept in code structure but main streaming is handled through fetch API

export interface ActivityLogEvent {
  type: 'status' | 'chunk' | 'platform' | 'done' | 'error' | 'tool_start' | 'tool_end';
  [key: string]: any;
}

export interface UseAIContentGenerationReturn {
  isLoading: boolean;
  events: ActivityLogEvent[];
  error: string | null;
  generatedContent: any | null;
  startGeneratingMasterContent: (campaignId: string, workspaceId: string, language?: string) => Promise<void>;
  startGeneratingVariants: (masterContentId: string, platforms: string[], workspaceId: string, language?: string) => Promise<void>;
  reset: () => void;
}

const API_BASE_URL = import.meta.env.VITE_AGENTS_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAIContentGeneration = (): UseAIContentGenerationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<ActivityLogEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
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
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const handleSSEEvent = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      setEvents(prev => [...prev, data]);

      if (data.type === 'done') {
        setGeneratedContent(data);
        setIsLoading(false);
      } else if (data.type === 'error') {
        setError(data.error || 'An error occurred during generation');
        setIsLoading(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      }
    } catch (parseError) {
      console.error('Failed to parse SSE event:', parseError);
    }
  }, []);

  const startGeneratingMasterContent = useCallback(
    async (campaignId: string, workspaceId: string, language: string = 'Vietnamese') => {
      reset();
      setIsLoading(true);
      setEvents([]);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/generate-master-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId,
            workspaceId,
            languagePreference: language,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        // Handle SSE stream
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
          
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setEvents(prev => [...prev, data]);

                if (data.type === 'done') {
                  setGeneratedContent(data);
                  setIsLoading(false);
                } else if (data.type === 'error') {
                  setError(data.error || 'An error occurred');
                  setIsLoading(false);
                }
              } catch (e) {
                console.error('Failed to parse event:', e);
              }
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [reset]
  );

  const startGeneratingVariants = useCallback(
    async (masterContentId: string, platforms: string[], workspaceId: string, language: string = 'Vietnamese') => {
      reset();
      setIsLoading(true);
      setEvents([]);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/generate-platform-variants/${masterContentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platforms,
            workspaceId,
            languagePreference: language,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        // Handle SSE stream
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
          
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setEvents(prev => [...prev, data]);

                if (data.type === 'done') {
                  setGeneratedContent(data);
                  setIsLoading(false);
                } else if (data.type === 'error') {
                  setError(data.error || 'An error occurred');
                  setIsLoading(false);
                }
              } catch (e) {
                console.error('Failed to parse event:', e);
              }
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [reset]
  );

  return {
    isLoading,
    events,
    error,
    generatedContent,
    startGeneratingMasterContent,
    startGeneratingVariants,
    reset,
  };
};
