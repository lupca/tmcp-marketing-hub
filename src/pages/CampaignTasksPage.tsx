import { Layout, ListTodo } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';

export default function CampaignTasksPage() {
    const { currentWorkspace } = useWorkspace();

    if (!currentWorkspace) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                <Layout size={48} className="mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No Workspace Selected</h3>
                <p>Please select a workspace to view tasks.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
            <ListTodo size={64} className="mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Campaign Tasks</h3>
            <p className="max-w-md mx-auto mb-6">
                Detailed task management is being updated to align with the new Campaign workflows.
                Please manage your campaign activities directly within the <a href="/campaigns" className="text-blue-600 hover:underline">Campaigns</a> section for now.
            </p>
            <div className="text-xs bg-gray-100 p-3 rounded text-gray-600">
                Status: Pending Schema Integration
            </div>
        </div>
    );
}
