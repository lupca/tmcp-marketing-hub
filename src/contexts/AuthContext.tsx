import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '../models/schema';
import pb from '../lib/pocketbase';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, model: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(pb.authStore.model as User | null);
    const [token, setToken] = useState<string | null>(pb.authStore.token);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = pb.authStore.onChange((authToken, authModel) => {
            setToken(authToken);
            setUser(authModel as User | null);
            setIsLoading(false);
        }, true); // trigger initially

        return () => {
            unsubscribe();
        };
    }, []);

    const login = useCallback((authToken: string, authModel: User) => {
        pb.authStore.save(authToken, authModel);
        setToken(authToken);
        setUser(authModel);
    }, []);

    const logout = useCallback(() => {
        pb.authStore.clear();
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading
    }), [user, token, login, logout, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
