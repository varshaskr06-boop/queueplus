import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  MapPin,
  TrendingUp,
  MessageSquarePlus,
  Shield,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAdmin } = useAuth();

  const links = [
    { to: '/dashboard', label: 'User Dashboard', icon: LayoutDashboard },
    { to: '/locations', label: 'Facility Search', icon: Search },
    { to: '/map', label: 'Live Crowd Map', icon: MapPin },
    { to: '/predictions', label: 'AI Forecaster', icon: TrendingUp },
    { to: '/report', label: 'Community Reports', icon: MessageSquarePlus },
    { to: '/profile', label: 'My Queue Tickets', icon: User },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 p-5 hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Sections */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main Services
          </div>
          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div>
            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider px-3 mb-2 flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Administration</span>
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'text-purple-700 bg-purple-50/60 hover:bg-purple-100/60'
                  }`
                }
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Mission Control</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* AI Queue Engine Badge */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-100 text-xs">
        <div className="flex items-center space-x-1.5 text-blue-700 font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>ML Random Forest</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Forecasts updated every 15s using live service rates & arrival theories.
        </p>
      </div>
    </aside>
  );
}
