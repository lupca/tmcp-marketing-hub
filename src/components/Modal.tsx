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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 text-left" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <button className="text-gray-400 hover:text-gray-500 transition-colors" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
