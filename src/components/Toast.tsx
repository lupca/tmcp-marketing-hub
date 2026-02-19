import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    show: (message: string, type?: ToastType) => void;
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

    const show = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
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

    // Optimization: Memoize the context value to prevent consumers from re-rendering
    // when the toast list updates (which happens frequently).
    const contextValue = useMemo(() => ({ show }), [show]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(t => (
                    <div key={t.id} className={`${bgColors[t.type]} rounded shadow-md p-4 flex items-center gap-3 min-w-[300px] animate-slide-in`}>
                        {icons[t.type]}
                        <span className="text-sm font-medium text-gray-800">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
