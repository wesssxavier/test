import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search, UserCheck, UserPlus, X, Clock, CheckCircle2, RotateCcw,
  Users, AlertCircle, Star, Crown,
} from 'lucide-react';
import { guestsApi, checkInApi } from '../lib/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

interface Guest {
  id: string;
  convidado: string;
  empresa: string | null;
  vipLevel: string;
  rsvpStatus: string;
  guestType: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  seatingAssignment?: {
    table?: { tableName: string };
    seatNumber?: number | null;
  } | null;
}

export default function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ convidado: '', empresa: '', notes: '' });
  const [walkInSaving, setWalkInSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    try {
      const [guestsRes, logsRes] = await Promise.all([
        guestsApi.list(eventId, { pageSize: 500 }),
        checkInApi.logs(eventId).catch(() => ({ data: { data: [] } })),
      ]);
      setGuests(guestsRes.data.data || []);
      setLogs(logsRes.data.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
    searchRef.current?.focus();
  }, [fetchData]);

  const handleCheckIn = async (guestId: string) => {
    if (!eventId) return;
    try {
      await checkInApi.checkIn(eventId, guestId);
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId ? { ...g, checkedIn: true, checkedInAt: new Date().toISOString() } : g
        )
      );
      toast.success('Checked in!');
      fetchData();
    } catch {
      toast.error('Check-in failed');
    }
  };

  const handleUndoCheckIn = async (guestId: string) => {
    if (!eventId) return;
    try {
      await checkInApi.undoCheckIn(eventId, guestId);
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId ? { ...g, checkedIn: false, checkedInAt: null } : g
        )
      );
      toast.success('Check-in undone');
      fetchData();
    } catch {
      toast.error('Failed to undo');
    }
  };

  const handleWalkIn = async () => {
    if (!eventId || !walkInForm.convidado.trim()) return;
    setWalkInSaving(true);
    try {
      await checkInApi.walkIn(eventId, walkInForm);
      setShowWalkIn(false);
      setWalkInForm({ convidado: '', empresa: '', notes: '' });
      toast.success('Walk-in registered');
      fetchData();
    } catch {
      toast.error('Failed to register walk-in');
    } finally {
      setWalkInSaving(false);
    }
  };

  const filteredGuests = guests.filter((g) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      g.convidado?.toLowerCase().includes(s) ||
      g.empresa?.toLowerCase().includes(s) ||
      false
    );
  });

  const totalGuests = guests.length;
  const checkedInCount = guests.filter((g) => g.checkedIn).length;
  const pendingCount = totalGuests - checkedInCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header Stats */}
      <div className="border-b border-surface-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Check-In</h1>
            <p className="text-sm text-surface-500">Day-of-event guest check-in</p>
          </div>
          <button className="btn-primary" onClick={() => setShowWalkIn(true)}>
            <UserPlus className="h-4 w-4" /> Walk-In
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-surface-900">{totalGuests}</p>
            <p className="text-xs text-surface-500 mt-1">Total Guests</p>
          </div>
          <div className="card p-4 text-center border-green-200 bg-green-50/50">
            <p className="text-3xl font-bold text-green-700">{checkedInCount}</p>
            <p className="text-xs text-green-600 mt-1">Checked In</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-surface-600">{pendingCount}</p>
            <p className="text-xs text-surface-500 mt-1">Pending</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${totalGuests > 0 ? (checkedInCount / totalGuests) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-surface-500 mt-1 text-right">
            {totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0}% checked in
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-surface-200 bg-white px-6 py-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
          <input
            ref={searchRef}
            className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-12 pr-4 text-lg placeholder-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
              <X className="h-5 w-5 text-surface-400" />
            </button>
          )}
        </div>
      </div>

      {/* Guest List */}
      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-surface-100">
          {filteredGuests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-surface-300 mb-3" />
              <p className="text-surface-500">{search ? 'No guests match your search' : 'No guests found'}</p>
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <div
                key={guest.id}
                className={`flex items-center justify-between px-6 py-4 transition-colors ${
                  guest.checkedIn ? 'bg-green-50/30' : 'hover:bg-surface-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ${
                    guest.checkedIn ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-600'
                  }`}>
                    {guest.checkedIn ? <CheckCircle2 className="h-6 w-6" /> : guest.convidado.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-surface-900">{guest.convidado}</span>
                      {guest.vipLevel === 'VVIP' && (
                        <span className="badge badge-purple"><Crown className="h-3 w-3 mr-0.5" /> VVIP</span>
                      )}
                      {guest.vipLevel === 'VIP' && (
                        <span className="badge badge-blue"><Star className="h-3 w-3 mr-0.5" /> VIP</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {guest.empresa && <span className="text-sm text-surface-500">{guest.empresa}</span>}
                      {guest.seatingAssignment?.table && (
                        <span className="text-xs text-surface-400">
                          Table: {guest.seatingAssignment.table.tableName}
                          {guest.seatingAssignment.seatNumber && `, Seat ${guest.seatingAssignment.seatNumber}`}
                        </span>
                      )}
                    </div>
                    {guest.checkedIn && guest.checkedInAt && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">
                          {new Date(guest.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {guest.checkedIn ? (
                    <button
                      className="btn-ghost btn-sm text-surface-500"
                      onClick={() => handleUndoCheckIn(guest.id)}
                    >
                      <RotateCcw className="h-4 w-4" /> Undo
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => handleCheckIn(guest.id)}
                    >
                      <UserCheck className="h-4 w-4" /> Check In
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Check-in Log */}
      {logs.length > 0 && (
        <div className="border-t border-surface-200 bg-surface-50 px-6 py-3 max-h-40 overflow-auto">
          <p className="text-xs font-semibold text-surface-500 mb-2">Recent Activity</p>
          <div className="space-y-1">
            {logs.slice(0, 10).map((log: any) => (
              <div key={log.id} className="flex items-center gap-2 text-xs text-surface-500">
                <span className={log.action === 'CHECK_IN' ? 'text-green-600' : 'text-surface-400'}>
                  {log.action === 'CHECK_IN' ? <CheckCircle2 className="h-3 w-3 inline" /> : <RotateCcw className="h-3 w-3 inline" />}
                </span>
                <span>{log.guest?.convidado || 'Guest'}</span>
                <span className="text-surface-300">-</span>
                <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Walk-In Modal */}
      <Modal open={showWalkIn} onClose={() => setShowWalkIn(false)} title="Register Walk-In" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowWalkIn(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleWalkIn} disabled={walkInSaving || !walkInForm.convidado.trim()}>
            {walkInSaving ? 'Registering...' : 'Register & Check In'}
          </button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={walkInForm.convidado} onChange={(e) => setWalkInForm((p) => ({ ...p, convidado: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" value={walkInForm.empresa} onChange={(e) => setWalkInForm((p) => ({ ...p, empresa: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[60px]" value={walkInForm.notes} onChange={(e) => setWalkInForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
