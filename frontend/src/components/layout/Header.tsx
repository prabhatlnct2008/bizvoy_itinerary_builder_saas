import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  UserCircle,
  LogOut,
  ChevronDown,
  Bell,
  Settings,
} from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get page title from current path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/itineraries')) return 'Itineraries';
    if (path.startsWith('/templates')) return 'Templates';
    if (path.startsWith('/activities')) return 'Activities';
    if (path.startsWith('/activity-types')) return 'Activity Types';
    if (path.startsWith('/users')) return 'Users';
    if (path.startsWith('/roles')) return 'Roles';
    if (path.startsWith('/settings')) return 'Company Settings';
    return 'Dashboard';
  };

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6">
      {/* Page Title */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 mx-2" />

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-600">
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.full_name || user?.email?.split('@')[0]}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.agency?.name && (
                  <p className="text-xs text-primary-600 mt-1">{user.agency.name}</p>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
