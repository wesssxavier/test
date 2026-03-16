import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import {
  Search, AlertTriangle, Users, X, GripVertical, Link2,
} from 'lucide-react';
import { guestsApi, tablesApi, seatingApi } from '@/lib/api';
import { VipBadge, RsvpBadge } from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface SeatingAssignment {
  table: {
    tableName: string;
    id: string;
  };
  seatNumber: number;
}

interface Guest {
  id: string;
  convidado: string;
  empresa: string;
  vipLevel: 'None' | 'VIP' | 'VVIP';
  rsvpStatus: 'Pending' | 'Confirmed' | 'Declined';
  status: string;
  linkedGroupName: string | null;
  guestType: string;
  seatingAssignment: SeatingAssignment | null;
}

interface TableData {
  id: string;
  tableName: string;
  shape: string;
  capacity: number;
  xPosition: number;
  yPosition: number;
}

interface Warning {
  message: string;
  [key: string]: unknown;
}

// --- Draggable guest item ---
function DraggableGuest({ guest }: { guest: Guest }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
    data: { type: 'guest', guest },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm cursor-grab active:cursor-grabbing hover:border-primary-300 hover:shadow-sm transition-all',
        isDragging && 'opacity-50',
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-surface-300 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-surface-800 truncate block">{guest.convidado}</span>
        {guest.empresa && (
          <span className="text-xs text-surface-500 truncate block">{guest.empresa}</span>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <VipBadge level={guest.vipLevel} />
        {guest.linkedGroupName && (
          <span className="inline-flex items-center gap-0.5 text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">
            <Link2 className="h-2.5 w-2.5" />
            {guest.linkedGroupName}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Droppable table card ---
function DroppableTableCard({
  table,
  assignedGuests,
  onRemoveGuest,
}: {
  table: TableData;
  assignedGuests: Guest[];
  onRemoveGuest: (guest: Guest) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: table.id,
    data: { type: 'table', table },
  });

  const isOverCapacity = assignedGuests.length > table.capacity;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'card overflow-hidden transition-all',
        isOverCapacity && 'ring-2 ring-red-400 border-red-300',
        isOver && !isOverCapacity && 'ring-2 ring-primary-400 border-primary-300',
        isOver && isOverCapacity && 'ring-2 ring-red-500',
      )}
    >
      {/* Table Header */}
      <div
        className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          isOverCapacity ? 'bg-red-50 border-red-200' : 'bg-surface-50 border-surface-200',
        )}
      >
        <div>
          <h4 className="text-sm font-semibold text-surface-900">{table.tableName}</h4>
          <p
            className={clsx(
              'text-xs font-medium',
              isOverCapacity ? 'text-red-600' : 'text-surface-500',
            )}
          >
            {assignedGuests.length}/{table.capacity}
            {isOverCapacity && (
              <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />
            )}
          </p>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="h-1 bg-surface-100">
        <div
          className={clsx(
            'h-full transition-all',
            isOverCapacity
              ? 'bg-red-500'
              : assignedGuests.length === table.capacity
                ? 'bg-yellow-500'
                : 'bg-green-500',
          )}
          style={{
            width: `${Math.min((assignedGuests.length / table.capacity) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Guest List */}
      <div className="p-3 space-y-1 min-h-[80px]">
        {assignedGuests.length === 0 ? (
          <div
            className={clsx(
              'text-center py-4 text-xs border-2 border-dashed rounded-lg',
              isOver
                ? 'text-primary-500 border-primary-300 bg-primary-50'
                : 'text-surface-400 border-surface-200',
            )}
          >
            Drop guests here
          </div>
        ) : (
          assignedGuests.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center gap-2 rounded-lg bg-surface-50 px-2.5 py-1.5 text-sm group"
            >
              <span className="font-medium text-surface-800 truncate flex-1">
                {guest.convidado}
              </span>
              <VipBadge level={guest.vipLevel} />
              {guest.linkedGroupName && (
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded-full flex-shrink-0">
                  <Link2 className="h-2.5 w-2.5" />
                  {guest.linkedGroupName}
                </span>
              )}
              <button
                className="opacity-0 group-hover:opacity-100 btn-icon p-0.5 text-surface-400 hover:text-red-600 transition-opacity"
                onClick={() => onRemoveGuest(guest)}
                title="Remove from table"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Main page component ---
export default function SeatingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');
  const [vipFilter, setVipFilter] = useState<string>('all');
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    try {
      const [guestsRes, tablesRes, warningsRes] = await Promise.all([
        guestsApi.list(eventId, { pageSize: 500 }),
        tablesApi.list(eventId),
        seatingApi.warnings(eventId).catch(() => ({ data: [] })),
      ]);
      setGuests(guestsRes.data.data ?? guestsRes.data);
      setTables(tablesRes.data.data ?? tablesRes.data);
      setWarnings(warningsRes.data?.data ?? warningsRes.data ?? []);
    } catch {
      toast.error('Failed to load seating data');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived data
  const unassignedGuests = guests.filter((g) => {
    if (g.seatingAssignment) return false;

    const matchesSearch =
      !search ||
      g.convidado.toLowerCase().includes(search.toLowerCase()) ||
      g.empresa?.toLowerCase().includes(search.toLowerCase());

    const matchesRsvp = rsvpFilter === 'all' || g.rsvpStatus === rsvpFilter;
    const matchesVip = vipFilter === 'all' || g.vipLevel === vipFilter;

    return matchesSearch && matchesRsvp && matchesVip;
  });

  const getTableGuests = (tableId: string): Guest[] => {
    return guests.filter(
      (g) => g.seatingAssignment?.table?.id === tableId,
    );
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const guest = guests.find((g) => g.id === event.active.id);
    setActiveGuest(guest || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveGuest(null);
    const { active, over } = event;
    if (!over || !eventId) return;

    const guestId = String(active.id);
    const targetTableId = String(over.id);

    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;

    // Already assigned to this table
    if (guest.seatingAssignment?.table?.id === targetTableId) return;

    try {
      // If currently assigned elsewhere, remove first
      if (guest.seatingAssignment) {
        await seatingApi.remove(eventId, guest.id);
      }

      await seatingApi.assign(eventId, { guestId, tableId: targetTableId });
      toast.success(`Assigned to ${targetTable.tableName}`);
      fetchData();
    } catch {
      toast.error('Failed to assign seat');
    }
  };

  const handleRemoveGuest = async (guest: Guest) => {
    if (!eventId) return;
    try {
      await seatingApi.remove(eventId, guest.id);
      toast.success('Removed from table');
      fetchData();
    } catch {
      toast.error('Failed to remove assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-surface-500">Loading seating planner...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">
        {/* Left Sidebar - Unassigned Guests */}
        <div className="w-80 border-r border-surface-200 bg-white flex flex-col">
          <div className="p-3 border-b border-surface-200">
            <h3 className="text-sm font-semibold text-surface-900 mb-2">
              Unassigned Guests
              <span className="ml-1 text-surface-400 font-normal">
                ({unassignedGuests.length})
              </span>
            </h3>

            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
              <input
                className="input input-sm pl-8 w-full"
                placeholder="Search by name or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="input input-sm flex-1 text-xs"
                value={rsvpFilter}
                onChange={(e) => setRsvpFilter(e.target.value)}
              >
                <option value="all">All RSVP</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Declined">Declined</option>
              </select>
              <select
                className="input input-sm flex-1 text-xs"
                value={vipFilter}
                onChange={(e) => setVipFilter(e.target.value)}
              >
                <option value="all">All VIP</option>
                <option value="VIP">VIP</option>
                <option value="VVIP">VVIP</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>

          {/* Guest List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {unassignedGuests.length === 0 ? (
              <div className="text-center py-8 text-sm text-surface-400">
                {guests.length === 0
                  ? 'No guests added yet'
                  : guests.every((g) => g.seatingAssignment)
                    ? 'All guests are assigned'
                    : 'No guests match filters'}
              </div>
            ) : (
              unassignedGuests.map((guest) => (
                <DraggableGuest key={guest.id} guest={guest} />
              ))
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="border-t border-surface-200 p-3">
              <h4 className="text-xs font-semibold text-yellow-700 flex items-center gap-1 mb-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Warnings ({warnings.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {warnings.map((w, i) => (
                  <p
                    key={i}
                    className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1"
                  >
                    {w.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Area - Tables */}
        <div className="flex-1 bg-surface-50 overflow-auto">
          <div className="p-4">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-surface-900">Seating Planner</h1>
              <p className="text-sm text-surface-500 mt-0.5">
                Drag guests from the left panel to assign them to tables
              </p>
            </div>

            {/* Table Cards Grid */}
            {tables.length === 0 ? (
              <div className="text-center py-20">
                <Users className="h-12 w-12 text-surface-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-surface-700">No tables yet</h3>
                <p className="text-sm text-surface-500 mt-1">
                  Tables will appear here once created
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <DroppableTableCard
                    key={table.id}
                    table={table}
                    assignedGuests={getTableGuests(table.id)}
                    onRemoveGuest={handleRemoveGuest}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeGuest && (
          <div className="flex items-center gap-2 rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm shadow-lg cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5 text-primary-400" />
            <span className="font-medium text-surface-800">{activeGuest.convidado}</span>
            <VipBadge level={activeGuest.vipLevel} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
