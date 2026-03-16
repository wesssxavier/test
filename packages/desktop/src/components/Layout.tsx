import { useState } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  LayoutDashboard,
  Users,
  Grid3X3,
  MapPin,
  UserCheck,
  Upload,
  Download,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Armchair,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useEventStore } from '../stores/eventStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const currentEventName = useEventStore((s) => s.currentEventName);

  const activeEventId = eventId || useEventStore((s) => s.currentEventId);

  const mainNav = [
    { to: '/events', icon: Calendar, label: 'Events' },
  ];

  const eventNav = activeEventId
    ? [
        { to: `/events/${activeEventId}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
        { to: `/events/${activeEventId}/guests`, icon: Users, label: 'Guests' },
        { to: `/events/${activeEventId}/seating`, icon: Armchair, label: 'Seating Planner' },
        { to: `/events/${activeEventId}/room-layout`, icon: MapPin, label: 'Room Layout' },
        { to: `/events/${activeEventId}/check-in`, icon: UserCheck, label: 'Check-In' },
        { to: `/events/${activeEventId}/imports`, icon: Upload, label: 'Imports' },
        { to: `/events/${activeEventId}/exports`, icon: Download, label: 'Exports / Print' },
      ]
    : [];

  const bottomNav = [
    { to: '/admin', icon: Settings, label: 'Admin / Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-surface-200 bg-white transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-surface-200 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
                GF
              </div>
              <span className="font-semibold text-surface-900">GuestFlow</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
              GF
            </div>
          )}
        </div>

        {/* Current Event Badge */}
        {!collapsed && currentEventName && (
          <div className="mx-3 mt-3 rounded-lg bg-primary-50 px-3 py-2">
            <p className="text-xs text-primary-600 font-medium">Current Event</p>
            <p className="text-sm font-semibold text-primary-900 truncate">{currentEventName}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>

          {eventNav.length > 0 && (
            <>
              {!collapsed && (
                <div className="my-3 px-3">
                  <div className="h-px bg-surface-200" />
                </div>
              )}
              <div className="space-y-0.5">
                {eventNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-surface-200 px-2 py-3">
          {bottomNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          <div className="mt-2 flex items-center gap-3 px-3 py-2">
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">{user?.displayName}</p>
                <p className="text-xs text-surface-500 truncate">{user?.role}</p>
              </div>
            )}
            <button onClick={handleLogout} className="btn-icon flex-shrink-0" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mt-1 flex w-full items-center justify-center rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
