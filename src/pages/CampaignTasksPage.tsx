import { Layout, ListTodo } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';

export default function CampaignTasksPage() {
    const { currentWorkspace } = useWorkspace();

    if (!currentWorkspace) {
        return (
            <div className="glass-panel rounded-xl flex flex-col items-center justify-center p-16 text-center text-gray-400">
                <Layout size={48} className="mb-4 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-200">No Workspace Selected</h3>
                <p className="mt-2 text-gray-400">Please select a workspace to view tasks.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-xl flex flex-col items-center justify-center p-16 text-center text-gray-400 shadow-lg">
            <ListTodo size={64} className="mb-6 text-gray-500" />
            <h3 className="text-2xl font-bold text-white text-glow mb-3 tracking-wide">Campaign Tasks</h3>
            <p className="max-w-md mx-auto mb-8 text-gray-300 leading-relaxed">
                Detailed task management is being updated to align with the new Campaign workflows.
                Please manage your campaign activities directly within the <a href="/campaigns" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium">Campaigns</a> section for now.
            </p>
            <div className="text-xs bg-black/20 p-4 rounded-lg text-gray-400 border border-glass-border tracking-wide font-medium">
                Status: Pending Schema Integration
            </div>
        </div>
    );
}
