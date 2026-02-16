import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
    return (
        <Modal
            title="Confirm Action"
            onClose={onCancel}
            footer={
                <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={onCancel}>Cancel</button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700" onClick={onConfirm}>Delete</button>
                </div>
            }
        >
            <div className="py-4">
                <p className="text-gray-700">{message}</p>
                <p className="mt-2 text-sm text-red-600 font-medium">This action cannot be undone.</p>
            </div>
        </Modal>
    );
}
