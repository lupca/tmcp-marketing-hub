import React from 'react';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
}

export default function LoadingSpinner({ fullScreen = true }: LoadingSpinnerProps) {
    if (fullScreen) {
        return (
            <div className="flex items-center justify-center min-h-screen w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    return (
        <div className="flex justify-center p-4 h-full items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
}
