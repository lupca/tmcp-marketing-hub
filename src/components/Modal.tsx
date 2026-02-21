import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function Modal({ title, onClose, children, footer }: ModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm text-left transition-opacity">
            <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] animate-slideUp">
                <div className="flex justify-between items-center p-5 border-b border-glass-border">
                    <h2 className="text-lg font-semibold text-white tracking-wide">{title}</h2>
                    <button className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 border-t border-glass-border bg-black/20 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
