import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <WorkspaceProvider>
            <Layout>{children}</Layout>
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
                        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/worksheets" element={<ProtectedRoute><WorksheetsPage /></ProtectedRoute>} />
                        <Route path="/brands" element={<ProtectedRoute><BrandIdentitiesPage /></ProtectedRoute>} />
                        <Route path="/customers" element={<ProtectedRoute><CustomerProfilesPage /></ProtectedRoute>} />
                        <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
                        <Route path="/tasks" element={<ProtectedRoute><CampaignTasksPage /></ProtectedRoute>} />
                        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                        <Route path="/social-posts" element={<ProtectedRoute><SocialPostsPage /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}
