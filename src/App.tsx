import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';

// Pages - now all TSX
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorksheetsPage from './pages/WorksheetsPage';
import BrandIdentitiesPage from './pages/BrandIdentitiesPage';
import CustomerProfilesPage from './pages/CustomerProfilesPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignTasksPage from './pages/CampaignTasksPage';
import CalendarPage from './pages/CalendarPage';
import SocialPostsPage from './pages/SocialPostsPage';
import ProductsServicesPage from './pages/ProductsServicesPage';
import ContentBriefsPage from './pages/ContentBriefsPage';

// ⚡ Bolt Optimization: Use Layout Route for Protected Areas
// Why: Using a layout route with <Outlet /> prevents the WorkspaceProvider and Layout
// from unmounting and remounting on every navigation.
// Impact: Eliminates redundant API calls to fetch workspaces, preserves UI state
// across navigations, and significantly improves page transition speed.
const ProtectedLayout = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <WorkspaceProvider>
            <Layout>
                <Outlet />
            </Layout>
        </WorkspaceProvider>
    );
};

export default function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedLayout />}>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/worksheets" element={<WorksheetsPage />} />
                            <Route path="/brands" element={<BrandIdentitiesPage />} />
                            <Route path="/customers" element={<CustomerProfilesPage />} />
                            <Route path="/campaigns" element={<CampaignsPage />} />
                            <Route path="/tasks" element={<CampaignTasksPage />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/social-posts" element={<SocialPostsPage />} />
                            <Route path="/products" element={<ProductsServicesPage />} />
                            <Route path="/campaigns/:campaignId/briefs" element={<ContentBriefsPage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}
