import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Users,
    FileText,
    Target,
    Palette,
    Calendar as CalendarIcon,
    Share2,
    LogOut,
    LayoutDashboard,
    Menu,
    X,
    ChevronDown,
    Package
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { user, logout } = useAuth();
    const { currentWorkspace, workspaces, selectWorkspace, isLoading, createWorkspace } = useWorkspace();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Worksheets', href: '/worksheets', icon: FileText },
        { name: 'Campaigns', href: '/campaigns', icon: Target },
        { name: 'My Brand', href: '/brands', icon: Palette },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
        { name: 'Social Posts', href: '/social-posts', icon: Share2 },
        { name: 'Products', href: '/products', icon: Package },
    ];

    const handleWorkspaceSelect = (id: string) => {
        selectWorkspace(id);
        setIsWorkspaceDropdownOpen(false);
    };

    return (
        <div className="min-h-screen bg-dark-bg text-gray-100 flex relative overflow-hidden font-sans">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-blob z-0"></div>
            <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-600/20 blur-[100px] animate-blob animation-delay-2000 z-0"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[40%] rounded-full bg-teal-500/20 blur-[120px] animate-blob animation-delay-4000 z-0"></div>

            {/* Mobile menu button */}
            <div className="fixed top-4 left-4 z-50 md:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-6 w-6 text-gray-200" aria-hidden="true" />
                    ) : (
                        <Menu className="h-6 w-6 text-gray-200" aria-hidden="true" />
                    )}
                </button>
            </div>

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-center h-16 bg-white/5 border-b border-white/10 text-white font-bold text-xl tracking-wider text-glow">
                        TMCP Marketing
                    </div>

                    {/* Workspace Selector */}
                    <div className="px-4 py-4 border-b border-white/10">
                        <div className="relative">
                            <button
                                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-200 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 focus:outline-none transition-all"
                                disabled={isLoading}
                            >
                                <span className="truncate">
                                    {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
                                </span>
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </button>

                            {isWorkspaceDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 glass-panel rounded-md shadow-2xl z-50 max-h-60 overflow-y-auto">
                                    {workspaces.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-400">
                                            <p className="mb-2">No workspaces found</p>
                                            <button
                                                onClick={async () => {
                                                    const name = prompt('Enter workspace name:');
                                                    if (name) {
                                                        await createWorkspace(name);
                                                        setIsWorkspaceDropdownOpen(false);
                                                    }
                                                }}
                                                className="w-full text-center px-3 py-2 bg-blue-600/80 hover:bg-blue-500 text-white rounded transition-colors text-xs"
                                            >
                                                Create Workspace
                                            </button>
                                        </div>
                                    ) : (
                                        workspaces.map((ws) => (
                                            <button
                                                key={ws.id}
                                                onClick={() => handleWorkspaceSelect(ws.id)}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors ${currentWorkspace?.id === ws.id ? 'bg-white/10 text-blue-400 font-medium' : 'text-gray-300'
                                                    }`}
                                            >
                                                {ws.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {!currentWorkspace && !isLoading && (
                            <p className="mt-2 text-xs text-red-400">Please select a workspace to continue.</p>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="px-4 py-4 border-b border-white/10 flex items-center">
                        <div className="h-9 w-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-gray-200 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                        }`}
                                >
                                    <item.icon
                                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                                            }`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={logout}
                            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors group"
                        >
                            <LogOut
                                className="mr-3 h-5 w-5 text-gray-500 group-hover:text-red-400 transition-colors"
                                aria-hidden="true"
                            />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 pt-16 md:pt-8 w-full custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}
        </div>
    );
}
