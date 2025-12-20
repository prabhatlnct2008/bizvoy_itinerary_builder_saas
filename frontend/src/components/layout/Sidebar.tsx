import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Map,
  Copy,
  Sparkles,
  Tags,
  Users,
  Shield,
  Building,
  Building2,
  LayoutDashboard,
  BarChart3,
  Gamepad2,
  Wand2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { aiBuilderAPI } from '../../api/ai-builder';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Itineraries', path: '/itineraries', icon: Map },
  { name: 'Templates', path: '/templates', icon: Copy },
  { name: 'Activities', path: '/activities', icon: Sparkles },
  { name: 'Activity Types', path: '/activity-types', icon: Tags },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Roles', path: '/roles', icon: Shield },
  { name: 'Company Settings', path: '/settings', icon: Building },
];

const gamificationNavItems: NavItem[] = [
  { name: 'Personalization', path: '/settings/personalization', icon: Gamepad2 },
  { name: 'Activity Readiness', path: '/settings/readiness', icon: BarChart3 },
  { name: 'Manage Vibes', path: '/settings/vibes', icon: Sparkles },
  { name: 'Analytics', path: '/analytics/personalization', icon: BarChart3 },
];

const adminNavItems: NavItem[] = [
  { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, adminOnly: true },
  { name: 'Agencies', path: '/admin/agencies', icon: Building2, adminOnly: true },
];

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const isBizvoyAdmin = user?.is_bizvoy_admin || false;
  const [aiBuilderEnabled, setAIBuilderEnabled] = useState(false);

  // Check if AI Builder is enabled for this agency
  useEffect(() => {
    if (!isBizvoyAdmin && user?.agency_id) {
      aiBuilderAPI.getStatus()
        .then(status => setAIBuilderEnabled(status.enabled))
        .catch(() => setAIBuilderEnabled(false));
    }
  }, [isBizvoyAdmin, user?.agency_id]);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600">Travel SaaS</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {/* Admin Section - Only for Bizvoy Admin */}
        {isBizvoyAdmin && (
          <>
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs font-semibold text-primary-600 uppercase tracking-wider">
                Bizvoy Admin
              </p>
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                    }`
                  }
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </>
        )}

        {/* Regular Navigation - Only for Agency Users (not Bizvoy Admin) */}
        {!isBizvoyAdmin && (
          <>
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Main Menu
              </p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`
                  }
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}

            {/* AI Builder Section - Only if enabled */}
            {aiBuilderEnabled && (
              <>
                <div className="pt-6 pb-1">
                  <p className="px-4 text-xs font-semibold text-purple-600 uppercase tracking-wider">
                    AI Tools
                  </p>
                </div>
                <NavLink
                  to="/ai-builder"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-600'
                        : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`
                  }
                >
                  <Wand2 className="mr-3 h-5 w-5" />
                  AI Itinerary Builder
                </NavLink>
              </>
            )}

            {/* Gamification Section */}
            <div className="pt-6 pb-1">
              <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Discovery Engine
              </p>
            </div>
            {gamificationNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`
                  }
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-text-muted text-center">
          v1.0.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
