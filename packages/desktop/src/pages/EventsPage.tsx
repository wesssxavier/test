import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users, Grid3X3, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { eventsApi } from '../lib/api';
import { useEventStore } from '../stores/eventStore';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

interface EventData {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  roomName: string | null;
  notes: string | null;
  _count?: { guests: number; roomTables: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ eventName: '', eventDate: '', eventLocation: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const setCurrentEvent = useEventStore((s) => s.setCurrentEvent);

  const fetchEvents = async () => {
    try {
      const res = await eventsApi.list();
      setEvents(res.data.data || []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => {
    setEditingEvent(null);
    setForm({ eventName: '', eventDate: '', eventLocation: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (event: EventData) => {
    setEditingEvent(event);
    setForm({
      eventName: event.eventName,
      eventDate: event.eventDate?.split('T')[0] || '',
      eventLocation: event.eventLocation || '',
      notes: event.notes || '',
    });
    setShowModal(true);
    setMenuOpenId(null);
  };

  const handleSave = async () => {
    if (!form.eventName.trim() || !form.eventDate) {
      toast.error('Name and date are required');
      return;
    }
    setSaving(true);
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, form);
        toast.success('Event updated');
      } else {
        await eventsApi.create(form);
        toast.success('Event created');
      }
      setShowModal(false);
      fetchEvents();
    } catch {
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await eventsApi.delete(deleteId);
      toast.success('Event deleted');
      setDeleteId(null);
      fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const handleSelectEvent = (event: EventData) => {
    setCurrentEvent(event.id, event.eventName);
    navigate(`/events/${event.id}/dashboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Events</h1>
          <p className="text-sm text-surface-500 mt-1">Manage your events</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Calendar className="h-16 w-16 text-surface-300 mb-4" />
          <p className="text-lg font-medium text-surface-600">No events yet</p>
          <p className="text-sm text-surface-400 mt-1">Create your first event to get started</p>
          <button className="btn-primary mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="card p-5 cursor-pointer transition-shadow hover:shadow-md group relative"
              onClick={() => handleSelectEvent(event)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-surface-900 truncate group-hover:text-primary-700 transition-colors">
                    {event.eventName}
                  </h3>
                </div>
                <div className="relative ml-2">
                  <button
                    className="btn-icon p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === event.id ? null : event.id); }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === event.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-surface-200 bg-white py-1 shadow-lg z-10">
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                        onClick={(e) => { e.stopPropagation(); openEdit(event); }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(event.id); setMenuOpenId(null); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-surface-500">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-500">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{event.eventLocation}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-surface-100 pt-3">
                <div className="flex items-center gap-1.5 text-sm text-surface-600">
                  <Users className="h-4 w-4 text-surface-400" />
                  <span className="font-medium">{event._count?.guests || 0}</span>
                  <span className="text-surface-400">guests</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-surface-600">
                  <Grid3X3 className="h-4 w-4 text-surface-400" />
                  <span className="font-medium">{event._count?.roomTables || 0}</span>
                  <span className="text-surface-400">tables</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingEvent ? 'Edit Event' : 'Create Event'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingEvent ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Event Name *</label>
            <input className="input" value={form.eventName} onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="label">Event Date *</label>
            <input className="input" type="date" value={form.eventDate} onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.eventLocation} onChange={(e) => setForm((p) => ({ ...p, eventLocation: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? All guests, tables, and seating data will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
