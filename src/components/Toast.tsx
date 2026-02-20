import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
    actionText?: string;
    onAction?: () => void;
}

interface ToastContextType {
    show: (message: string, type?: ToastType, options?: { actionText?: string; onAction?: () => void; durationMs?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const show = useCallback((message: string, type: ToastType = 'success', options?: { actionText?: string; onAction?: () => void; durationMs?: number }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, actionText: options?.actionText, onAction: options?.onAction }]);
        const duration = options?.durationMs ?? 3500;
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const icons = {
        success: <CheckCircle size={18} className="text-green-500" />,
        error: <XCircle size={18} className="text-red-500" />,
        info: <Info size={18} className="text-blue-500" />
    };

    const bgColors = {
        success: 'bg-white border-l-4 border-green-500',
        error: 'bg-white border-l-4 border-red-500',
        info: 'bg-white border-l-4 border-blue-500'
    };

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(t => (
                    <div key={t.id} className={`${bgColors[t.type]} rounded shadow-md p-4 flex items-center gap-3 min-w-[300px] animate-slide-in`}>
                        {icons[t.type]}
                        <span className="text-sm font-medium text-gray-800">{t.message}</span>
                        {t.actionText && t.onAction && (
                            <button
                                className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700"
                                onClick={() => t.onAction?.()}
                            >
                                {t.actionText}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
