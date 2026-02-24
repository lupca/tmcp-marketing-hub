import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
}

export default function LoadingSpinner({ fullScreen = true }: LoadingSpinnerProps) {
    return (
        <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'h-full min-h-[200px]'} w-full`}>
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );
}
