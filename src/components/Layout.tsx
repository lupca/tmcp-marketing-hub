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
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile menu button */}
            <div className="fixed top-4 left-4 z-50 md:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-6 w-6 text-gray-800" aria-hidden="true" />
                    ) : (
                        <Menu className="h-6 w-6 text-gray-800" aria-hidden="true" />
                    )}
                </button>
            </div>

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-center h-16 bg-blue-600 text-white font-bold text-xl">
                        TMCP Marketing
                    </div>

                    {/* Workspace Selector */}
                    <div className="px-4 py-4 border-b border-gray-200">
                        <div className="relative">
                            <button
                                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                                disabled={isLoading}
                            >
                                <span className="truncate">
                                    {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
                                </span>
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </button>

                            {isWorkspaceDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {workspaces.length === 0 ? (
                                        <div className="px-4 py-2 text-sm text-gray-500">
                                            <p className="mb-2">No workspaces found</p>
                                            <button
                                                onClick={async () => {
                                                    const name = prompt('Enter workspace name:');
                                                    if (name) {
                                                        await createWorkspace(name);
                                                        setIsWorkspaceDropdownOpen(false);
                                                    }
                                                }}
                                                className="w-full text-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                            >
                                                Create Workspace
                                            </button>
                                        </div>
                                    ) : (
                                        workspaces.map((ws) => (
                                            <button
                                                key={ws.id}
                                                onClick={() => handleWorkspaceSelect(ws.id)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${currentWorkspace?.id === ws.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
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
                            <p className="mt-2 text-xs text-red-500">Please select a workspace to continue.</p>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="px-4 py-4 border-b border-gray-200 flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon
                                        className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                            }`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={logout}
                            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 group"
                        >
                            <LogOut
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                                aria-hidden="true"
                            />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 md:p-8 pt-16 md:pt-8 w-full">
                    {children}
                </main>
            </div>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}
        </div>
    );
}
