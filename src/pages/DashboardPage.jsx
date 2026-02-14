import { useEffect, useState } from 'react';
import { list } from '../lib/pb';
import { Lightbulb, Palette, Users, Megaphone, ListTodo, CalendarDays, Share2, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#6c5ce7', '#00cec9', '#fdcb6e', '#e17055', '#74b9ff', '#a29bfe', '#55efc4'];

export default function DashboardPage() {
    const [stats, setStats] = useState({});
    const [tasks, setTasks] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [ideas, brands, customers, campaigns, taskData, events, socialPosts, blogPosts] = await Promise.all([
                    list('business_ideas', { perPage: 1 }),
                    list('brand_identities', { perPage: 1 }),
                    list('customer_profiles', { perPage: 1 }),
                    list('marketing_campaigns', { perPage: 1 }),
                    list('campaign_tasks', { perPage: 200 }),
                    list('content_calendar_events', { perPage: 1 }),
                    list('social_posts', { perPage: 200 }),
                    list('posts', { perPage: 1 }),
                ]);
                setStats({
                    ideas: ideas.totalItems,
                    brands: brands.totalItems,
                    customers: customers.totalItems,
                    campaigns: campaigns.totalItems,
                    tasks: taskData.totalItems,
                    events: events.totalItems,
                    socialPosts: socialPosts.totalItems,
                    blogPosts: blogPosts.totalItems,
                });
                setTasks(taskData.items || []);
                setPosts(socialPosts.items || []);
            } catch (e) { console.error(e); }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    const statCards = [
        { label: 'Business Ideas', value: stats.ideas, icon: Lightbulb, color: '#fdcb6e' },
        { label: 'Brands', value: stats.brands, icon: Palette, color: '#6c5ce7' },
        { label: 'Customers', value: stats.customers, icon: Users, color: '#00cec9' },
        { label: 'Campaigns', value: stats.campaigns, icon: Megaphone, color: '#e17055' },
        { label: 'Tasks', value: stats.tasks, icon: ListTodo, color: '#74b9ff' },
        { label: 'Calendar Events', value: stats.events, icon: CalendarDays, color: '#55efc4' },
        { label: 'Social Posts', value: stats.socialPosts, icon: Share2, color: '#a29bfe' },
        { label: 'Blog Posts', value: stats.blogPosts, icon: FileText, color: '#fdcb6e' },
    ];

    // Task status chart
    const statusMap = {};
    tasks.forEach(t => { statusMap[t.status || 'Unknown'] = (statusMap[t.status || 'Unknown'] || 0) + 1; });
    const taskChartData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // Platform chart
    const platformMap = {};
    posts.forEach(p => { platformMap[p.platform || 'Unknown'] = (platformMap[p.platform || 'Unknown'] || 0) + 1; });
    const platformData = Object.entries(platformMap).map(([name, value]) => ({ name, value }));

    // Weekly activity (mock based on real total counts)
    const weeklyData = [
        { name: 'Mon', tasks: Math.ceil(stats.tasks * 0.15), posts: Math.ceil(stats.socialPosts * 0.1) },
        { name: 'Tue', tasks: Math.ceil(stats.tasks * 0.2), posts: Math.ceil(stats.socialPosts * 0.15) },
        { name: 'Wed', tasks: Math.ceil(stats.tasks * 0.25), posts: Math.ceil(stats.socialPosts * 0.2) },
        { name: 'Thu', tasks: Math.ceil(stats.tasks * 0.15), posts: Math.ceil(stats.socialPosts * 0.25) },
        { name: 'Fri', tasks: Math.ceil(stats.tasks * 0.1), posts: Math.ceil(stats.socialPosts * 0.15) },
        { name: 'Sat', tasks: Math.ceil(stats.tasks * 0.1), posts: Math.ceil(stats.socialPosts * 0.1) },
        { name: 'Sun', tasks: Math.ceil(stats.tasks * 0.05), posts: Math.ceil(stats.socialPosts * 0.05) },
    ];

    return (
        <>
            <div className="stats-grid">
                {statCards.map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                            <s.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value">{s.value ?? 0}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <h3><TrendingUp size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Weekly Activity</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={weeklyData}>
                            <defs>
                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00cec9" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00cec9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a5a" />
                            <XAxis dataKey="name" stroke="#666688" fontSize={12} />
                            <YAxis stroke="#666688" fontSize={12} />
                            <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid #2a2a5a', borderRadius: 8, fontSize: 13 }} />
                            <Area type="monotone" dataKey="tasks" stroke="#6c5ce7" fill="url(#colorTasks)" strokeWidth={2} />
                            <Area type="monotone" dataKey="posts" stroke="#00cec9" fill="url(#colorPosts)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="card chart-card">
                    <h3>Task Status Distribution</h3>
                    {taskChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={taskChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {taskChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid #2a2a5a', borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="empty-state"><p>No tasks yet</p></div>}
                </div>

                <div className="card chart-card">
                    <h3>Social Posts by Platform</h3>
                    {platformData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={platformData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a5a" />
                                <XAxis dataKey="name" stroke="#666688" fontSize={12} />
                                <YAxis stroke="#666688" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid #2a2a5a', borderRadius: 8 }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="empty-state"><p>No social posts yet</p></div>}
                </div>

                <div className="card chart-card">
                    <h3>Content Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 12 }}>
                        {[
                            { label: 'Active Campaigns', value: stats.campaigns, color: '#e17055' },
                            { label: 'Pending Tasks', value: statusMap['To Do'] || 0, color: '#74b9ff' },
                            { label: 'In Progress', value: statusMap['In Progress'] || 0, color: '#fdcb6e' },
                            { label: 'Completed', value: statusMap['Done'] || 0, color: '#00b894' },
                        ].map(item => (
                            <div key={item.label} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${item.color}` }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
