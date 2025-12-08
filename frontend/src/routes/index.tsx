import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import Login from '../features/auth/Login';
import AppShell from '../components/layout/AppShell';
import ActivityList from '../features/activities/ActivityList';
import ActivityForm from '../features/activities/ActivityForm';
import ActivityTypesList from '../features/activities/ActivityTypesList';
import TemplateList from '../features/templates/TemplateList';
import TemplateBuilder from '../features/templates/TemplateBuilder';
import { PersonalizationFlow } from '../features/personalization/pages/PersonalizationFlow';

// Placeholder components (will be implemented in later phases)
const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Dashboard</h1><p>Welcome to Travel SaaS!</p></div>;
const Users = () => <div className="p-8"><h1 className="text-2xl font-bold">Users</h1></div>;
const Roles = () => <div className="p-8"><h1 className="text-2xl font-bold">Roles</h1></div>;
const Itineraries = () => <div className="p-8"><h1 className="text-2xl font-bold">Itineraries</h1></div>;

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />
          <Route path="activities" element={<ActivityList />} />
          <Route path="activities/new" element={<ActivityForm />} />
          <Route path="activities/:id" element={<ActivityForm />} />
          <Route path="activity-types" element={<ActivityTypesList />} />
          <Route path="templates" element={<TemplateList />} />
          <Route path="templates/new" element={<TemplateBuilder />} />
          <Route path="templates/:id" element={<TemplateBuilder />} />
          <Route path="itineraries" element={<Itineraries />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
