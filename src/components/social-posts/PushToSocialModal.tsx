import React from 'react';
import Modal from '../Modal';
import { PlatformVariant } from '../../models/schema';

interface PushToSocialModalProps {
    variant: PlatformVariant;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

const PushToSocialModal: React.FC<PushToSocialModalProps> = ({
    variant,
    onClose,
    onConfirm,
    isSubmitting,
}) => {
    return (
        <Modal
            title="Preview Before Publish"
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 shadow-lg transition-colors disabled:opacity-60"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Post'}
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="glass-panel rounded-md p-3 border border-glass-border">
                    <p className="text-xs text-gray-400 mb-1">Platform</p>
                    <p className="text-sm font-semibold text-blue-300 uppercase">{variant.platform}</p>
                </div>

                <div className="glass-panel rounded-md p-3 border border-glass-border">
                    <p className="text-xs text-gray-400 mb-2">Content Preview</p>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">
                        {variant.adapted_copy || '(No content)'}
                    </p>
                </div>

                <p className="text-xs text-gray-400">
                    This will publish to the configured Facebook Page for the current workspace.
                </p>
            </div>
        </Modal>
    );
};

export default PushToSocialModal;
