import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  Search, Plus, ChevronDown, ChevronUp, ArrowUpDown,
  Trash2, Edit3, Copy, Users,
} from 'lucide-react';
import { guestsApi, savedViewsApi } from '../lib/api';
import { RsvpBadge, GuestStatusBadge, VipBadge, CheckedInIndicator } from '../components/StatusBadge';
import GuestDetailPanel from '../components/GuestDetailPanel';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

interface Guest {
  id: string;
  convidado: string;
  empresa: string | null;
  telephone: string | null;
  email: string | null;
  guestType: string;
  status: string;
  rsvpStatus: string;
  vipLevel: string;
  dietaryRestrictions: string | null;
  notes: string | null;
  linkedGroupName: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  seatingAssignment?: {
    table?: { tableName: string };
    seatNumber?: number | null;
  } | null;
}

const columnHelper = createColumnHelper<Guest>();

export default function GuestsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRsvp, setFilterRsvp] = useState<string>('');
  const [filterVip, setFilterVip] = useState<string>('');
  const [newGuest, setNewGuest] = useState({ convidado: '', empresa: '', email: '', telephone: '' });
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (eventId) {
      loadGuests();
      loadSavedViews();
    }
  }, [eventId]);

  const loadGuests = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { pageSize: 500 };
      if (filterStatus) params.status = filterStatus;
      if (filterRsvp) params.rsvpStatus = filterRsvp;
      if (filterVip) params.vipLevel = filterVip;
      const res = await guestsApi.list(eventId, params);
      setGuests(res.data.data || []);
    } catch {
      toast.error('Failed to load guests');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedViews = async () => {
    if (!eventId) return;
    try {
      const res = await savedViewsApi.list(eventId);
      setSavedViews(res.data.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { if (eventId) loadGuests(); }, [filterStatus, filterRsvp, filterVip]);

  const startEditing = useCallback((rowId: string, columnId: string, value: string) => {
    setEditingCell({ rowId, columnId });
    setEditValue(value || '');
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const commitEdit = useCallback(async () => {
    if (!editingCell || !eventId) return;
    const guest = guests.find((g) => g.id === editingCell.rowId);
    if (!guest || (guest as any)[editingCell.columnId] === editValue) {
      setEditingCell(null);
      return;
    }
    try {
      await guestsApi.update(eventId, guest.id, { [editingCell.columnId]: editValue });
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, [editingCell.columnId]: editValue } : g))
      );
    } catch {
      toast.error('Failed to update');
    }
    setEditingCell(null);
  }, [editingCell, editValue, eventId, guests]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditingCell(null);
  }, [commitEdit]);

  const handleFieldChange = async (guestId: string, field: string, value: string) => {
    if (!eventId) return;
    try {
      await guestsApi.update(eventId, guestId, { [field]: value });
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, [field]: value } : g))
      );
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleAddGuest = async () => {
    if (!eventId || !newGuest.convidado.trim()) return;
    try {
      const res = await guestsApi.create(eventId, newGuest);
      setGuests((prev) => [res.data.data, ...prev]);
      setShowAddModal(false);
      setNewGuest({ convidado: '', empresa: '', email: '', telephone: '' });
      toast.success('Guest added');
    } catch {
      toast.error('Failed to add guest');
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!eventId) return;
    try {
      const res = await guestsApi.duplicate(eventId, id);
      setGuests((prev) => [res.data.data, ...prev]);
      toast.success('Guest duplicated');
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  const handleBulkUpdate = async (updates: Record<string, string>) => {
    if (!eventId) return;
    const ids = Object.keys(rowSelection).map((idx) => guests[parseInt(idx)]?.id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      await guestsApi.bulkUpdate(eventId, ids, updates);
      loadGuests();
      setRowSelection({});
      setShowBulkMenu(false);
      toast.success(`${ids.length} guests updated`);
    } catch {
      toast.error('Bulk update failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!eventId) return;
    const ids = Object.keys(rowSelection).map((idx) => guests[parseInt(idx)]?.id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      await guestsApi.bulkDelete(eventId, ids);
      loadGuests();
      setRowSelection({});
      setShowDeleteConfirm(false);
      toast.success(`${ids.length} guests deleted`);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDelete = async (id: string) => {
    if (!eventId) return;
    try {
      await guestsApi.delete(eventId, id);
      setGuests((prev) => prev.filter((g) => g.id !== id));
      toast.success('Guest deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const EditableCell = ({ value, rowId, columnId }: { value: string; rowId: string; columnId: string }) => {
    const isEditing = editingCell?.rowId === rowId && editingCell?.columnId === columnId;
    if (isEditing) {
      return (
        <input
          ref={editInputRef}
          className="w-full bg-white px-1 py-0.5 text-sm outline-none ring-2 ring-primary-500 rounded"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleCellKeyDown}
        />
      );
    }
    return (
      <span
        className="block w-full cursor-text truncate px-1 py-0.5 rounded hover:bg-surface-50"
        onDoubleClick={() => startEditing(rowId, columnId, value)}
      >
        {value || <span className="text-surface-300">-</span>}
      </span>
    );
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-surface-300"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-surface-300"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 40,
      }),
      columnHelper.accessor('convidado', {
        header: 'Convidado',
        size: 200,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              className="text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline truncate text-left"
              onClick={() => setSelectedGuestId(row.original.id)}
            >
              {row.original.convidado}
            </button>
            {row.original.vipLevel !== 'None' && <VipBadge level={row.original.vipLevel} />}
          </div>
        ),
      }),
      columnHelper.accessor('empresa', {
        header: 'Empresa',
        size: 160,
        cell: ({ row }) => <EditableCell value={row.original.empresa || ''} rowId={row.original.id} columnId="empresa" />,
      }),
      columnHelper.accessor('telephone', {
        header: 'Telephone',
        size: 140,
        cell: ({ row }) => <EditableCell value={row.original.telephone || ''} rowId={row.original.id} columnId="telephone" />,
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        size: 200,
        cell: ({ row }) => <EditableCell value={row.original.email || ''} rowId={row.original.id} columnId="email" />,
      }),
      columnHelper.accessor('guestType', {
        header: 'Type',
        size: 100,
        cell: ({ row }) => (
          <select
            className="w-full border-0 bg-transparent text-sm focus:ring-0 cursor-pointer"
            value={row.original.guestType}
            onChange={(e) => handleFieldChange(row.original.id, 'guestType', e.target.value)}
          >
            {['Guest', 'Spouse', 'Officer', 'Other'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 130,
        cell: ({ row }) => <GuestStatusBadge status={row.original.status} />,
      }),
      columnHelper.accessor('rsvpStatus', {
        header: 'RSVP',
        size: 120,
        cell: ({ row }) => (
          <select
            className="w-full border-0 bg-transparent text-sm focus:ring-0 cursor-pointer"
            value={row.original.rsvpStatus}
            onChange={(e) => {
              const rsvp = e.target.value;
              handleFieldChange(row.original.id, 'rsvpStatus', rsvp);
              const statusMap: Record<string, string> = { Confirmed: 'Confirmed', Declined: 'Declined', Pending: 'Invited' };
              handleFieldChange(row.original.id, 'status', statusMap[rsvp] || 'Invited');
            }}
          >
            {['Pending', 'Confirmed', 'Declined'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        ),
      }),
      columnHelper.accessor('vipLevel', {
        header: 'VIP',
        size: 90,
        cell: ({ row }) => (
          <select
            className="w-full border-0 bg-transparent text-sm focus:ring-0 cursor-pointer"
            value={row.original.vipLevel}
            onChange={(e) => handleFieldChange(row.original.id, 'vipLevel', e.target.value)}
          >
            {['None', 'VIP', 'VVIP'].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        ),
      }),
      columnHelper.display({
        id: 'table',
        header: 'Table',
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm text-surface-600">
            {row.original.seatingAssignment?.table?.tableName || <span className="text-surface-300">Unassigned</span>}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'seat',
        header: 'Seat',
        size: 60,
        cell: ({ row }) => (
          <span className="text-sm text-surface-600">{row.original.seatingAssignment?.seatNumber || '-'}</span>
        ),
      }),
      columnHelper.accessor('linkedGroupName', {
        header: 'Linked Group',
        size: 130,
        cell: ({ row }) => (
          <span className="text-sm text-surface-600">
            {row.original.linkedGroupName || <span className="text-surface-300">-</span>}
          </span>
        ),
      }),
      columnHelper.accessor('checkedIn', {
        header: 'Checked In',
        size: 100,
        cell: ({ row }) => <CheckedInIndicator checkedIn={row.original.checkedIn} checkedInAt={row.original.checkedInAt} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button className="btn-icon p-1" onClick={() => handleDuplicate(row.original.id)} title="Duplicate">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button className="btn-icon p-1 text-red-500 hover:text-red-700" onClick={() => handleDelete(row.original.id)} title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      }),
    ],
    [editingCell, editValue],
  );

  const table = useReactTable({
    data: guests,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const g = row.original;
      return (
        g.convidado?.toLowerCase().includes(search) ||
        g.empresa?.toLowerCase().includes(search) ||
        g.email?.toLowerCase().includes(search) ||
        g.telephone?.toLowerCase().includes(search) ||
        false
      );
    },
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input className="input pl-9 w-64" placeholder="Search guests..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
          </div>
          <select className="input w-32" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); }}>
            <option value="">All Status</option>
            <option value="Invited">Invited</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Declined">Declined</option>
            <option value="Waitlist">Waitlist</option>
          </select>
          <select className="input w-32" value={filterRsvp} onChange={(e) => { setFilterRsvp(e.target.value); }}>
            <option value="">All RSVP</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Declined">Declined</option>
          </select>
          <select className="input w-28" value={filterVip} onChange={(e) => { setFilterVip(e.target.value); }}>
            <option value="">All VIP</option>
            <option value="VIP">VIP</option>
            <option value="VVIP">VVIP</option>
            <option value="None">None</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {savedViews.length > 0 && (
            <select className="input w-40" value={activeView} onChange={(e) => setActiveView(e.target.value)}>
              <option value="all">All Guests</option>
              {savedViews.map((v: any) => <option key={v.id} value={v.id}>{v.viewName}</option>)}
            </select>
          )}
          {selectedCount > 0 && (
            <div className="relative">
              <button className="btn-secondary btn-sm" onClick={() => setShowBulkMenu(!showBulkMenu)}>
                <Edit3 className="h-3.5 w-3.5" /> Bulk ({selectedCount}) <ChevronDown className="h-3 w-3" />
              </button>
              {showBulkMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-surface-200 bg-white py-1 shadow-lg z-20">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-surface-50" onClick={() => handleBulkUpdate({ rsvpStatus: 'Confirmed', status: 'Confirmed' })}>Mark Confirmed</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-surface-50" onClick={() => handleBulkUpdate({ rsvpStatus: 'Declined', status: 'Declined' })}>Mark Declined</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-surface-50" onClick={() => handleBulkUpdate({ vipLevel: 'VIP' })}>Set VIP</button>
                  <div className="my-1 h-px bg-surface-200" />
                  <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => { setShowBulkMenu(false); setShowDeleteConfirm(true); }}>Delete Selected</button>
                </div>
              )}
            </div>
          )}
          <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Add Guest
          </button>
        </div>
      </div>

      {/* Guest Count */}
      <div className="flex items-center gap-4 border-b border-surface-100 bg-surface-50 px-6 py-2">
        <span className="text-xs font-medium text-surface-500">{table.getFilteredRowModel().rows.length} guests</span>
        {selectedCount > 0 && <span className="text-xs font-medium text-primary-600">{selectedCount} selected</span>}
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="h-12 w-12 text-surface-300 mb-4" />
            <p className="text-lg font-medium text-surface-600">No guests yet</p>
            <p className="text-sm text-surface-400 mt-1">Add your first guest to get started</p>
            <button className="btn-primary mt-4" onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4" /> Add Guest</button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="border-b border-surface-200 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500" style={{ width: header.getSize() }}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? 'flex cursor-pointer select-none items-center gap-1 hover:text-surface-700' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            header.column.getIsSorted() === 'asc' ? <ChevronUp className="h-3 w-3" /> :
                            header.column.getIsSorted() === 'desc' ? <ChevronDown className="h-3 w-3" /> :
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-surface-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={`transition-colors hover:bg-surface-50 ${row.getIsSelected() ? 'bg-primary-50/50' : ''}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-sm text-surface-700" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Guest Detail Panel */}
      {selectedGuestId && eventId && (
        <GuestDetailPanel guestId={selectedGuestId} eventId={eventId} onClose={() => setSelectedGuestId(null)} onUpdated={loadGuests} />
      )}

      {/* Add Guest Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Guest" footer={
        <>
          <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleAddGuest} disabled={!newGuest.convidado.trim()}>Add Guest</button>
        </>
      }>
        <div className="space-y-4">
          <div><label className="label">Name (Convidado) *</label><input className="input" value={newGuest.convidado} onChange={(e) => setNewGuest((p) => ({ ...p, convidado: e.target.value }))} autoFocus /></div>
          <div><label className="label">Company (Empresa)</label><input className="input" value={newGuest.empresa} onChange={(e) => setNewGuest((p) => ({ ...p, empresa: e.target.value }))} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={newGuest.email} onChange={(e) => setNewGuest((p) => ({ ...p, email: e.target.value }))} /></div>
          <div><label className="label">Telephone</label><input className="input" value={newGuest.telephone} onChange={(e) => setNewGuest((p) => ({ ...p, telephone: e.target.value }))} /></div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Guests"
        message={`Are you sure you want to delete ${selectedCount} selected guests? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
