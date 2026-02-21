import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages - lazy loaded
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WorksheetsPage = lazy(() => import('./pages/WorksheetsPage'));
const BrandIdentitiesPage = lazy(() => import('./pages/BrandIdentitiesPage'));
const CustomerProfilesPage = lazy(() => import('./pages/CustomerProfilesPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const CampaignTasksPage = lazy(() => import('./pages/CampaignTasksPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SocialPostsPage = lazy(() => import('./pages/SocialPostsPage'));
const ProductsServicesPage = lazy(() => import('./pages/ProductsServicesPage'));
const ContentBriefsPage = lazy(() => import('./pages/ContentBriefsPage'));

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <WorkspaceProvider>
            <Layout>
                <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
                    {children}
                </Suspense>
            </Layout>
        </WorkspaceProvider>
    );
};

export default function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Suspense fallback={<LoadingSpinner />}>
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
                            <Route path="/products" element={<ProtectedRoute><ProductsServicesPage /></ProtectedRoute>} />
                            <Route path="/campaigns/:campaignId/briefs" element={<ProtectedRoute><ContentBriefsPage /></ProtectedRoute>} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}
