import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, queueService } from '../services/api';
import {
  User,
  Mail,
  Shield,
  Ticket,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
} from 'lucide-react';

export default function Profile() {
  const { user, logout, isAdmin } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfileData(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCancelTicket = async (ticketId) => {
    try {
      await queueService.updateStatus(ticketId, 'CANCELLED');
      setActionMsg('Ticket cancelled successfully.');
      fetchProfile();
    } catch (err) {
      setActionMsg(err.response?.data?.error?.message || 'Failed to cancel ticket.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const queueEntries = profileData?.queueEntries || [
    {
      id: 'demo-t1',
      tokenNumber: 'HOSP-018',
      status: 'WAITING',
      createdAt: new Date().toISOString(),
      location: { name: 'Metro Central General Hospital', category: 'HOSPITAL' },
    },
    {
      id: 'demo-t2',
      tokenNumber: 'BANK-104',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      location: { name: 'Summit Trust & Savings', category: 'BANK' },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 font-extrabold text-2xl">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">{user?.name}</h1>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    isAdmin
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-xs uppercase tracking-wider border border-slate-200 transition-colors flex items-center space-x-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Grid: Shortcuts & Active Queue Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-navy-900">Account Shortcuts</h3>

            <div className="space-y-2">
              <Link
                to="/locations"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
              >
                <div>
                  <div className="text-xs font-bold text-navy-900 group-hover:text-blue-600">Find Facilities</div>
                  <div className="text-[11px] text-slate-500">Explore 16 public desks</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                to="/map"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
              >
                <div>
                  <div className="text-xs font-bold text-navy-900 group-hover:text-blue-600">Live Crowd Map</div>
                  <div className="text-[11px] text-slate-500">Color-coded city density</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                to="/report"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 group"
              >
                <div>
                  <div className="text-xs font-bold text-navy-900 group-hover:text-blue-600">Report Observation</div>
                  <div className="text-[11px] text-slate-500">Record line length</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Active and Historical Tickets */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-blue-600" />
                <span>My Active & Recent Tickets</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Tickets automatically update when counters call your number</p>
            </div>
          </div>

          <div className="space-y-3">
            {queueEntries.map((ticket) => {
              const isWaiting = ticket.status === 'WAITING';
              const isServing = ticket.status === 'SERVING';
              const isCompleted = ticket.status === 'COMPLETED';

              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold text-sm">
                      {ticket.tokenNumber}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-navy-900">{ticket.location?.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span>{ticket.location?.category}</span>
                        <span>&bull;</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isWaiting
                          ? 'bg-amber-100 text-amber-800'
                          : isServing
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCompleted
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ticket.status}
                    </span>

                    {isWaiting && (
                      <button
                        onClick={() => handleCancelTicket(ticket.id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
