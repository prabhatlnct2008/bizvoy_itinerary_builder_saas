import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AppShell from '../components/layout/AppShell';
import Login from '../features/auth/Login';
import ForgotPassword from '../features/auth/ForgotPassword';
import Forbidden from '../features/auth/Forbidden';
import Dashboard from '../features/dashboard/Dashboard';
import UserList from '../features/users/UserList';
import RoleList from '../features/roles/RoleList';
import ActivityList from '../features/activities/ActivityList';
import ActivityForm from '../features/activities/ActivityForm';
import ActivityTypesList from '../features/activities/ActivityTypesList';
import TemplateList from '../features/templates/TemplateList';
import TemplateBuilder from '../features/templates/TemplateBuilder';
import ItineraryList from '../features/itineraries/ItineraryList';
import ItineraryWizard from '../features/itineraries/ItineraryWizard';
import ItineraryEditor from '../features/itineraries/ItineraryEditor';
import PublicItinerary from '../features/public/PublicItinerary';
import CompanySettings from '../features/settings/CompanySettings';
import { PersonalizationFlow } from '../features/personalization/pages/PersonalizationFlow';
// Admin Pages
import AdminDashboard from '../features/admin/AdminDashboard';
import AgenciesList from '../features/admin/AgenciesList';
import AgencyForm from '../features/admin/AgencyForm';
import AgencyDetail from '../features/admin/AgencyDetail';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component - requires bizvoy-admin role
const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_bizvoy_admin) {
    return <Forbidden />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/itinerary/:token" element={<PublicItinerary />} />
        <Route path="/itinerary/:token/personalize" element={<PersonalizationFlow />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Users & Roles */}
          <Route path="users" element={<UserList />} />
          <Route path="roles" element={<RoleList />} />

          {/* Activities */}
          <Route path="activities" element={<ActivityList />} />
          <Route path="activities/new" element={<ActivityForm />} />
          <Route path="activities/:id" element={<ActivityForm />} />
          <Route path="activity-types" element={<ActivityTypesList />} />

          {/* Templates */}
          <Route path="templates" element={<TemplateList />} />
          <Route path="templates/new" element={<TemplateBuilder />} />
          <Route path="templates/:id" element={<TemplateBuilder />} />

          {/* Itineraries */}
          <Route path="itineraries" element={<ItineraryList />} />
          <Route path="itineraries/new" element={<ItineraryWizard />} />
          <Route path="itineraries/:id" element={<ItineraryEditor />} />

          {/* Settings */}
          <Route path="settings" element={<CompanySettings />} />
          <Route path="settings/company" element={<CompanySettings />} />

          {/* Admin Routes - Bizvoy Admin Only */}
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="admin/agencies"
            element={
              <AdminRoute>
                <AgenciesList />
              </AdminRoute>
            }
          />
          <Route
            path="admin/agencies/new"
            element={
              <AdminRoute>
                <AgencyForm />
              </AdminRoute>
            }
          />
          <Route
            path="admin/agencies/:id"
            element={
              <AdminRoute>
                <AgencyDetail />
              </AdminRoute>
            }
          />

          {/* Catch-all: redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
