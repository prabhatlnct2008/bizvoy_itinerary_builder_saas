import React from 'react';
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
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
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

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600">Travel SaaS</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
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
