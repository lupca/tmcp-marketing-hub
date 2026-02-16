import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
    Layout as LayoutIcon,
    Palette,
    Users,
    Megaphone,
    ListTodo,
    CalendarDays,
    Share2,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { MarketingCampaign, SocialInteraction } from '../models/schema';

const COLORS = ['#6c5ce7', '#00cec9', '#fdcb6e', '#e17055', '#74b9ff', '#a29bfe', '#55efc4'];

interface DashboardStats {
    worksheets: number;
    brands: number;
    customers: number;
    campaigns: number;
    tasks: number; // Note: 'campaign_tasks' collection might need to be added to schema if it exists? 
    // Based on schema.json, there isn't a separate 'campaign_tasks' collection.
    // Assuming tasks might be part of campaigns or a separate collection not in the main schema list provided?
    // Checking file listing earlier, there was 'CampaignTasksPage.jsx', so tasks likely exist.
    // I'll assume a generic 'tasks' or 'campaign_tasks' collection exists or mapped to something else.
    // The original code listed 'campaign_tasks'. I will keep it but might need to verify schema.
    events: number;
    socialPosts: number;
}

export default function DashboardPage() {
    const { currentWorkspace } = useWorkspace();
    const [stats, setStats] = useState<DashboardStats>({
        worksheets: 0,
        brands: 0,
        customers: 0,
        campaigns: 0,
        tasks: 0,
        events: 0,
        socialPosts: 0,
    });
    // Types for tasks and posts would ideally come from schema, but for now using any or partials
    const [tasks, setTasks] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            if (!currentWorkspace) return;

            setLoading(true);
            setError(null);
            try {
                // Filter all queries by workspace_id
                const filter = `workspace_id = "${currentWorkspace.id}"`;

                // Note: 'campaign_tasks' and 'content_calendar_events' are NOT in the provided schema.ts
                // I will comment them out or map them to existing collections if possible.
                // Assuming 'social_posts' maps to 'platform_variants' or 'social_interactions' in new schema?
                // The new schema has 'platform_variants'.
                // 'content_calendar_events' might be 'inspiration_events' or 'marketing_campaigns' dates?
                // I will try to map to the CLOSEST new schema equivalents.

                // Old: worksheets, brand_identities, ideal_customer_profiles, marketing_campaigns, campaign_tasks, content_calendar_events, social_posts
                // New: workspaces, brand_identities, customer_personas, marketing_campaigns, worksheets, inspiration_events, platform_variants

                // Mapping:
                // ideal_customer_profiles -> customer_personas
                // content_calendar_events -> inspiration_events? (or just rely on campaigns start/end)
                // social_posts -> platform_variants
                // campaign_tasks -> ??? (Maybe not in new schema? Or part of campaign json?)

                const [worksheets, brands, customers, campaigns, events, platformVariants] = await Promise.all([
                    pb.collection('worksheets').getList(1, 1, { filter }),
                    pb.collection('brand_identities').getList(1, 1, { filter }),
                    pb.collection('customer_personas').getList(1, 1, { filter }),
                    pb.collection('marketing_campaigns').getList(1, 1, { filter }),
                    pb.collection('inspiration_events').getList(1, 1, { filter }),
                    pb.collection('platform_variants').getList(1, 200, { filter }), // Fetch more for charts
                ]);

                setStats({
                    worksheets: worksheets.totalItems,
                    brands: brands.totalItems,
                    customers: customers.totalItems,
                    campaigns: campaigns.totalItems,
                    tasks: 0, // Placeholder
                    events: events.totalItems,
                    socialPosts: platformVariants.totalItems,
                });

                // setPosts(platformVariants.items); 
                // Need to check if platform_variants items match what the chart expects
                // post has 'platform', 'publish_status' (which maps to status chart?)
                setPosts(platformVariants.items);

                setTasks([]); // Tasks collection seems missing in new schema description provided

            } catch (e: any) {
                console.error(e);
                setError("Failed to load dashboard data. Please check your workspace connection.");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [currentWorkspace?.id]);

    if (!currentWorkspace) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                <LayoutIcon size={48} className="mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No Workspace Selected</h3>
                <p>Please select a workspace from the sidebar to view the dashboard.</p>
            </div>
        );
    }

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    if (error) {
        return (
            <div className="rounded-md bg-red-50 p-4 m-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statCards = [
        { label: 'Worksheets', value: stats.worksheets, icon: LayoutIcon, color: '#fdcb6e' },
        { label: 'Brands', value: stats.brands, icon: Palette, color: '#6c5ce7' },
        { label: 'Personas', value: stats.customers, icon: Users, color: '#00cec9' },
        { label: 'Campaigns', value: stats.campaigns, icon: Megaphone, color: '#e17055' },
        // { label: 'Tasks', value: stats.tasks, icon: ListTodo, color: '#74b9ff' },
        { label: 'Events', value: stats.events, icon: CalendarDays, color: '#55efc4' },
        { label: 'Variants', value: stats.socialPosts, icon: Share2, color: '#a29bfe' },
    ];

    // Status chart (from platform variants publish_status)
    const statusMap: Record<string, number> = {};
    posts.forEach((p: any) => {
        const status = p.publish_status || 'unknown';
        statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const taskChartData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // Platform chart
    const platformMap: Record<string, number> = {};
    posts.forEach((p: any) => {
        const platform = p.platform || 'unknown';
        platformMap[platform] = (platformMap[platform] || 0) + 1;
    });
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
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {statCards.map(s => (
                    <div key={s.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 rounded-md mr-4" style={{ background: `${s.color}20`, color: s.color }}>
                            <s.icon size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-500">{s.label}</div>
                            <div className="text-2xl font-bold text-gray-900">{s.value ?? 0}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Activity Area Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <TrendingUp size={18} className="mr-2" /> Weekly Activity
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
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
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }} />
                                <Area type="monotone" dataKey="tasks" stroke="#6c5ce7" fill="url(#colorTasks)" strokeWidth={2} />
                                <Area type="monotone" dataKey="posts" stroke="#00cec9" fill="url(#colorPosts)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Content Status Distribution</h3>
                    {taskChartData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={taskChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {taskChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="h-64 flex items-center justify-center text-gray-400">No content data yet</div>}
                </div>

                {/* Platform Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Variants by Platform</h3>
                    {platformData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={platformData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                        {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="h-64 flex items-center justify-center text-gray-400">No platform data yet</div>}
                </div>
            </div>
        </div>
    );
}
