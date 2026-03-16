import { useState, useEffect } from 'react';
import { X, Save, Link2, MapPin, Clock, FileText } from 'lucide-react';
import { guestsApi, relationshipsApi, auditApi } from '../lib/api';
import { RsvpBadge, GuestStatusBadge, VipBadge } from './StatusBadge';
import toast from 'react-hot-toast';

interface GuestDetailPanelProps {
  guestId: string | null;
  eventId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function GuestDetailPanel({ guestId, eventId, onClose, onUpdated }: GuestDetailPanelProps) {
  const [guest, setGuest] = useState<any>(null);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'relationships' | 'history'>('details');

  useEffect(() => {
    if (!guestId) return;
    loadGuest();
  }, [guestId]);

  const loadGuest = async () => {
    if (!guestId) return;
    setLoading(true);
    try {
      const [guestRes, relRes, auditRes] = await Promise.all([
        guestsApi.get(eventId, guestId),
        relationshipsApi.list(eventId).catch(() => ({ data: { data: [] } })),
        auditApi.byEntity('Guest', guestId).catch(() => ({ data: { data: [] } })),
      ]);
      setGuest(guestRes.data.data);
      const allRels = relRes.data.data || [];
      setRelationships(allRels.filter((r: any) => r.guestId === guestId || r.relatedGuestId === guestId));
      setAuditLogs(auditRes.data.data || []);
    } catch {
      toast.error('Failed to load guest details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!guestId || Object.keys(editing).length === 0) return;
    try {
      await guestsApi.update(eventId, guestId, editing);
      toast.success('Guest updated');
      setEditing({});
      onUpdated();
      loadGuest();
    } catch {
      toast.error('Failed to update guest');
    }
  };

  const setField = (field: string, value: string) => {
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  if (!guestId) return null;

  const tabs = [
    { id: 'details' as const, label: 'Details', icon: FileText },
    { id: 'relationships' as const, label: 'Relationships', icon: Link2 },
    { id: 'history' as const, label: 'History', icon: Clock },
  ];

  const currentValue = (field: string) => editing[field] ?? guest?.[field] ?? '';

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-[480px] flex-col border-l border-surface-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-surface-900">
            {guest?.convidado || 'Loading...'}
          </h2>
          {guest?.empresa && (
            <p className="text-sm text-surface-500">{guest.empresa}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(editing).length > 0 && (
            <button className="btn-primary btn-sm" onClick={handleSave}>
              <Save className="h-3 w-3" /> Save
            </button>
          )}
          <button onClick={onClose} className="btn-icon">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Status Row */}
      {guest && (
        <div className="flex items-center gap-2 border-b border-surface-200 px-6 py-3">
          <GuestStatusBadge status={guest.status} />
          <RsvpBadge status={guest.rsvpStatus} />
          <VipBadge level={guest.vipLevel} />
          {guest.seatingAssignment && (
            <span className="badge badge-blue">
              <MapPin className="h-3 w-3 mr-1" />
              {guest.seatingAssignment.table?.tableName}
              {guest.seatingAssignment.seatNumber && ` - Seat ${guest.seatingAssignment.seatNumber}`}
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary-600 text-primary-700'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : activeTab === 'details' ? (
          <div className="space-y-4">
            {[
              { label: 'Name', field: 'convidado' },
              { label: 'Company', field: 'empresa' },
              { label: 'Telephone', field: 'telephone' },
              { label: 'Email', field: 'email' },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input
                  className="input"
                  value={currentValue(field)}
                  onChange={(e) => setField(field, e.target.value)}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Guest Type</label>
                <select className="input" value={currentValue('guestType')} onChange={(e) => setField('guestType', e.target.value)}>
                  {['Guest', 'Spouse', 'Officer', 'Other'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">VIP Level</label>
                <select className="input" value={currentValue('vipLevel')} onChange={(e) => setField('vipLevel', e.target.value)}>
                  {['None', 'VIP', 'VVIP'].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={currentValue('status')} onChange={(e) => setField('status', e.target.value)}>
                  {['Invited', 'Confirmed', 'Declined', 'Waitlist', 'Checked-In', 'No Response'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">RSVP</label>
                <select className="input" value={currentValue('rsvpStatus')} onChange={(e) => setField('rsvpStatus', e.target.value)}>
                  {['Pending', 'Confirmed', 'Declined'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Dietary Restrictions</label>
              <input className="input" value={currentValue('dietaryRestrictions')} onChange={(e) => setField('dietaryRestrictions', e.target.value)} />
            </div>

            <div>
              <label className="label">Linked Group</label>
              <input className="input" value={currentValue('linkedGroupName')} onChange={(e) => setField('linkedGroupName', e.target.value)} />
            </div>

            <div>
              <label className="label">Seat Preference</label>
              <input className="input" value={currentValue('seatPreference')} onChange={(e) => setField('seatPreference', e.target.value)} />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                className="input min-h-[80px]"
                value={currentValue('notes')}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>

            {/* Import Metadata */}
            {guest?.importedFileName && (
              <div className="rounded-lg bg-surface-50 p-3">
                <p className="text-xs font-medium text-surface-500 mb-1">Import Metadata</p>
                <p className="text-sm text-surface-700">File: {guest.importedFileName}</p>
                {guest.importedRowNumber && <p className="text-sm text-surface-700">Row: {guest.importedRowNumber}</p>}
              </div>
            )}
          </div>
        ) : activeTab === 'relationships' ? (
          <div className="space-y-3">
            {relationships.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-8">No relationships linked</p>
            ) : (
              relationships.map((rel: any) => {
                const isFrom = rel.guestId === guestId;
                const other = isFrom ? rel.relatedGuest : rel.guest;
                return (
                  <div key={rel.id} className="flex items-center justify-between rounded-lg border border-surface-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-surface-900">{other?.convidado}</p>
                      <p className="text-xs text-surface-500">{rel.relationshipType}</p>
                    </div>
                    <span className="badge badge-blue">{rel.relationshipType}</span>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-8">No audit history</p>
            ) : (
              auditLogs.map((log: any) => (
                <div key={log.id} className="border-l-2 border-surface-200 pl-3 py-1">
                  <p className="text-sm text-surface-700">{log.summary}</p>
                  <p className="text-xs text-surface-400">
                    {new Date(log.createdAt).toLocaleString()}
                    {log.user && ` by ${log.user.displayName}`}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
