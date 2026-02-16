import React, { createContext, useContext, useEffect, useState } from 'react';
import { Workspace } from '../models/schema';
import pb from '../lib/pocketbase';
import { useAuth } from './AuthContext';
import { ClientResponseError } from 'pocketbase';

interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    isLoading: boolean;
    error: Error | null;
    createWorkspace: (name: string) => Promise<void>;
    selectWorkspace: (workspaceId: string) => void;
    refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = 'tmcp_current_workspace_id';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchWorkspaces = async () => {
        if (!isAuthenticated || !user) {
            setWorkspaces([]);
            setCurrentWorkspace(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Fetch workspaces where the user is a member or owner
            // Note: The API rules should handle filtering based on user ID
            // Fetch workspaces where the user is a member or owner
            // Note: The API rules should handle filtering based on user ID
            const result = await pb.collection('workspaces').getList<Workspace>(1, 50);
            const records = result.items;
            setWorkspaces(records);

            // Attempt to restore selected workspace from local storage
            const savedWorkspaceId = localStorage.getItem(STORAGE_KEY);
            if (savedWorkspaceId) {
                const found = records.find(w => w.id === savedWorkspaceId);
                if (found) {
                    setCurrentWorkspace(found);
                } else if (records.length > 0) {
                    // Default to first workspace if saved one not found
                    selectWorkspace(records[0].id);
                }
            } else if (records.length > 0) {
                // Default to first workspace
                selectWorkspace(records[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch workspaces:', err);
            if (err instanceof ClientResponseError) {
                console.error('PocketBase Error Details:', err.response);
            }
            setError(err instanceof Error ? err : new Error('Unknown error fetching workspaces'));
        } finally {
            setIsLoading(false);
        }
    };

    const createWorkspace = async (name: string) => {
        if (!user) return;
        try {
            const record = await pb.collection('workspaces').create<Workspace>({
                name,
                owner_id: user.id,
                members: [user.id]
            });
            setWorkspaces(prev => [record, ...prev]);
            selectWorkspace(record.id);
        } catch (err) {
            console.error('Failed to create workspace:', err);
            if (err instanceof ClientResponseError) {
                console.error('PocketBase Error Details:', err.response);
            }
            throw err;
        }
    };

    const selectWorkspace = (workspaceId: string) => {
        const found = workspaces.find(w => w.id === workspaceId);
        if (found) {
            setCurrentWorkspace(found);
            localStorage.setItem(STORAGE_KEY, workspaceId);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, [isAuthenticated, user?.id]); // Re-fetch when user changes

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            currentWorkspace,
            isLoading,
            error,
            selectWorkspace,
            refreshWorkspaces: fetchWorkspaces,
            createWorkspace
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};
