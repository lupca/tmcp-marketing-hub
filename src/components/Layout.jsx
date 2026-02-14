import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard, Lightbulb, Palette, Users, Megaphone, ListTodo,
    CalendarDays, Share2, FileText, PanelLeftClose, PanelLeft, Zap, LogOut
} from 'lucide-react';
import { logout } from '../lib/pb';
import AgentChat from './AgentChat';

const navItems = [
    { section: 'Overview' },
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { section: 'Marketing' },
    { to: '/business-ideas', icon: Lightbulb, label: 'Business Ideas' },
    { to: '/brands', icon: Palette, label: 'Brand Identities' },
    { to: '/customers', icon: Users, label: 'Customer Profiles' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/tasks', icon: ListTodo, label: 'Campaign Tasks' },
    { section: 'Content' },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/social-posts', icon: Share2, label: 'Social Posts' },
    { to: '/posts', icon: FileText, label: 'Blog Posts' },
];

const pageTitles = {
    '/': 'Dashboard',
    '/business-ideas': 'Business Ideas',
    '/brands': 'Brand Identities',
    '/customers': 'Customer Profiles',
    '/campaigns': 'Marketing Campaigns',
    '/tasks': 'Campaign Tasks',
    '/calendar': 'Content Calendar',
    '/social-posts': 'Social Posts',
    '/posts': 'Blog Posts',
};

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'Marketing Hub';

    const handleLogout = () => { logout(); window.location.href = '/login'; };

    return (
        <div className="app-layout">
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon"><Zap size={20} color="#fff" /></div>
                    <span className="logo-text">Marketing Hub</span>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item, i) =>
                        item.section ? (
                            <div key={i} className="nav-section-title">{item.section}</div>
                        ) : (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} className="nav-icon" />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    )}
                </nav>
                <div className="sidebar-footer">
                    <button className="collapse-btn" onClick={handleLogout} style={{ marginBottom: 6, color: 'var(--danger)' }}>
                        <LogOut size={18} /> {!collapsed && <span>Logout</span>}
                    </button>
                    <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <PanelLeft size={18} /> : <><PanelLeftClose size={18} /><span>Collapse</span></>}
                    </button>
                </div>
            </aside>
            <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
                <header className="main-header">
                    <h1>{title}</h1>
                </header>
                <div className="page-content">{children}</div>
            </div>
            <AgentChat />
        </div>
    );
}
