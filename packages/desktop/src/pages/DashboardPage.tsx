import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, UserX, Clock, CheckCircle2, Armchair, AlertTriangle,
  Star, Grid3X3, FileSpreadsheet, ArrowRight,
} from 'lucide-react';
import { dashboardApi, eventsApi } from '../lib/api';
import { useEventStore } from '../stores/eventStore';
import toast from 'react-hot-toast';

interface DashboardData {
  overview: {
    totalGuests: number;
    confirmed: number;
    declined: number;
    pending: number;
    checkedIn: number;
    seated: number;
    unseated: number;
    totalTables: number;
    totalCapacity: number;
    availableSeats: number;
  };
  breakdowns: {
    byVipLevel: { vipLevel: string; count: number }[];
    byStatus: { status: string; count: number }[];
    byRsvp: { rsvpStatus: string; count: number }[];
    byGuestType: { guestType: string; count: number }[];
    byCompany: { empresa: string; count: number }[];
  };
  recentActivity: any[];
}

export default function DashboardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const setCurrentEvent = useEventStore((s) => s.setCurrentEvent);
  const navigate = useNavigate();

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const [statsRes, eventRes] = await Promise.all([
          dashboardApi.stats(eventId),
          eventsApi.get(eventId),
        ]);
        setData(statsRes.data.data || statsRes.data);
        const evt = eventRes.data.data || eventRes.data;
        setCurrentEvent(eventId, evt.eventName);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-surface-500">Failed to load dashboard data</div>
      </div>
    );
  }

  const o = data.overview;
  const vipCount = data.breakdowns.byVipLevel
    .filter((v) => v.vipLevel === 'VIP' || v.vipLevel === 'VVIP')
    .reduce((sum, v) => sum + v.count, 0);

  const statCards = [
    { label: 'Total Invited', value: o.totalGuests, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Confirmed', value: o.confirmed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Declined', value: o.declined, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pending', value: o.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Checked In', value: o.checkedIn, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Assigned Seats', value: o.seated, icon: Armchair, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Unassigned', value: o.unseated, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'VIP Guests', value: vipCount, icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Tables', value: o.totalTables, icon: Grid3X3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Available Seats', value: o.availableSeats, icon: Armchair, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  const confirmRate = o.totalGuests > 0 ? Math.round((o.confirmed / o.totalGuests) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="mt-1 text-sm text-surface-500">Overview of your event at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{card.value}</p>
                <p className="text-xs text-surface-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-surface-900">RSVP Progress</h3>
          <span className="text-sm font-medium text-primary-600">{confirmRate}% confirmed</span>
        </div>
        <div className="h-3 rounded-full bg-surface-100 overflow-hidden">
          <div className="flex h-full">
            <div className="bg-green-500 transition-all" style={{ width: `${o.totalGuests > 0 ? (o.confirmed / o.totalGuests) * 100 : 0}%` }} />
            <div className="bg-red-400 transition-all" style={{ width: `${o.totalGuests > 0 ? (o.declined / o.totalGuests) * 100 : 0}%` }} />
            <div className="bg-yellow-400 transition-all" style={{ width: `${o.totalGuests > 0 ? (o.pending / o.totalGuests) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-surface-500"><div className="h-2 w-2 rounded-full bg-green-500" /> Confirmed ({o.confirmed})</div>
          <div className="flex items-center gap-1.5 text-xs text-surface-500"><div className="h-2 w-2 rounded-full bg-red-400" /> Declined ({o.declined})</div>
          <div className="flex items-center gap-1.5 text-xs text-surface-500"><div className="h-2 w-2 rounded-full bg-yellow-400" /> Pending ({o.pending})</div>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdowns */}
        <div className="card">
          <div className="p-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900">Guest Types</h3>
          </div>
          <div className="p-4 space-y-2">
            {data.breakdowns.byGuestType.map((item) => (
              <div key={item.guestType} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-surface-700">{item.guestType}</span>
                <span className="text-sm font-medium text-surface-900">{item.count}</span>
              </div>
            ))}
            {data.breakdowns.byGuestType.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-4">No guests yet</p>
            )}
          </div>
        </div>

        {/* Top Companies */}
        <div className="card">
          <div className="p-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900">Top Companies</h3>
          </div>
          <div className="p-4 space-y-2">
            {data.breakdowns.byCompany.slice(0, 8).map((item) => (
              <div key={item.empresa} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-surface-700">{item.empresa}</span>
                <span className="text-sm font-medium text-surface-900">{item.count}</span>
              </div>
            ))}
            {data.breakdowns.byCompany.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-4">No company data</p>
            )}
          </div>
        </div>

        {/* VIP Breakdown */}
        <div className="card">
          <div className="p-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900">VIP Breakdown</h3>
          </div>
          <div className="p-4 space-y-2">
            {data.breakdowns.byVipLevel.map((item) => (
              <div key={item.vipLevel} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-surface-700">{item.vipLevel || 'None'}</span>
                <span className="text-sm font-medium text-surface-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="p-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900">Recent Activity</h3>
          </div>
          <div className="p-4 space-y-2">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 8).map((log: any) => (
                <div key={log.id} className="flex items-start gap-2 py-1.5">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 truncate">{log.summary}</p>
                    <p className="text-xs text-surface-400">
                      {new Date(log.createdAt).toLocaleString()}
                      {log.user && ` - ${log.user.displayName}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-surface-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button className="btn-primary" onClick={() => navigate(`/events/${eventId}/guests`)}>
          <Users className="h-4 w-4" /> Manage Guests
        </button>
        <button className="btn-secondary" onClick={() => navigate(`/events/${eventId}/seating`)}>
          <Armchair className="h-4 w-4" /> Seating Planner
        </button>
        <button className="btn-secondary" onClick={() => navigate(`/events/${eventId}/imports`)}>
          <FileSpreadsheet className="h-4 w-4" /> Import Guests
        </button>
      </div>
    </div>
  );
}
