import React, { useEffect, useRef, useState } from 'react';

interface ActivityLogEvent {
  type: 'status' | 'chunk' | 'platform' | 'done' | 'error' | 'tool_start' | 'tool_end' | 'warn';
  [key: string]: any;
}

interface ActivityLogProps {
  events: ActivityLogEvent[];
  isLoading: boolean;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ events, isLoading }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [showLongRunningNote, setShowLongRunningNote] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  useEffect(() => {
    if (!isLoading) {
      setShowLongRunningNote(false);
      return;
    }
    const timer = setTimeout(() => setShowLongRunningNote(true), 30000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const getEventIcon = (event: ActivityLogEvent) => {
    switch (event.type) {
      case 'status':
        return '⏳';
      case 'chunk':
        return '📝';
      case 'platform':
        return '🌐';
      case 'tool_start':
        return '🔧';
      case 'tool_end':
        return '✅';
      case 'warn':
        return '⚠️';
      case 'done':
        return '🎉';
      case 'error':
        return '❌';
      default:
        return '📌';
    }
  };

  const getEventColor = (event: ActivityLogEvent) => {
    switch (event.type) {
      case 'status':
        return 'text-blue-600';
      case 'chunk':
        return 'text-gray-600';
      case 'platform':
        return 'text-purple-600';
      case 'tool_start':
      case 'tool_end':
        return 'text-green-600';
      case 'done':
        return 'text-green-700 font-semibold';
      case 'warn':
        return 'text-yellow-700 font-semibold';
      case 'error':
        return 'text-red-600 font-semibold';
      default:
        return 'text-gray-500';
    }
  };

  const formatEventMessage = (event: ActivityLogEvent) => {
    switch (event.type) {
      case 'status':
        return `${event.agent || 'System'}: ${event.step || event.status}`;
      case 'chunk':
        return `Generating: "${event.content?.substring(0, 50)}${event.content?.length > 50 ? '...' : ''}"`;
      case 'platform':
        return `Platform ${event.action === 'started' ? 'started' : 'completed'}: ${event.platform}${event.variantId ? ` (ID: ${event.variantId})` : ''}`;
      case 'tool_start':
        return `Tool: ${event.tool} - Started`;
      case 'tool_end':
        return `Tool: ${event.tool} - Completed`;
      case 'done':
        return `✓ Generation completed successfully!${event.masterContentId ? ` ID: ${event.masterContentId}` : ''}${event.platformCount ? ` (${event.platformCount} variants)` : ''}`;
      case 'error':
        return `Error: ${event.error} ${event.step ? `(${event.step})` : ''}`;
      case 'warn':
        return event.message || 'Connection interrupted. Generation continues on server.';
      default:
        return JSON.stringify(event);
    }
  };

  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Generation Activity</h3>
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Processing...</span>
          </div>
        )}
      </div>

      {showLongRunningNote && (
        <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          This job is running on the server. You can safely close this window and check results later.
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
        {events.length === 0 ? (
          <p className="text-gray-400 italic">No activity yet. Click "Generate via AI" to start.</p>
        ) : (
          <>
            {events.map((event, idx) => (
              <div key={idx} className={`flex gap-2 ${getEventColor(event)}`}>
                <span className="text-lg">{getEventIcon(event)}</span>
                <span className="flex-1 break-words">{formatEventMessage(event)}</span>
              </div>
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
