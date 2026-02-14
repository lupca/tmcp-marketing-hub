import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './lib/pb';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BusinessIdeasPage from './pages/BusinessIdeasPage';
import BrandIdentitiesPage from './pages/BrandIdentitiesPage';
import CustomerProfilesPage from './pages/CustomerProfilesPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignTasksPage from './pages/CampaignTasksPage';
import CalendarPage from './pages/CalendarPage';
import SocialPostsPage from './pages/SocialPostsPage';
import BlogPostsPage from './pages/BlogPostsPage';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/business-ideas" element={<ProtectedRoute><BusinessIdeasPage /></ProtectedRoute>} />
          <Route path="/brands" element={<ProtectedRoute><BrandIdentitiesPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomerProfilesPage /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><CampaignTasksPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/social-posts" element={<ProtectedRoute><SocialPostsPage /></ProtectedRoute>} />
          <Route path="/posts" element={<ProtectedRoute><BlogPostsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
