import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Download, FileSpreadsheet, Users, UserCheck, Grid3X3, Tag, Map,
  Loader2, CheckCircle2, Filter,
} from 'lucide-react';
import { exportsApi } from '../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  formats: string[];
  action: (format: string) => Promise<void>;
}

export default function ExportsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [filterRsvp, setFilterRsvp] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportGuests = async (format: 'xlsx' | 'csv') => {
    if (!eventId) return;
    const key = `guests-${format}`;
    setDownloading(key);
    try {
      const params: any = {};
      if (filterRsvp) params.rsvp = filterRsvp;
      if (filterStatus) params.status = filterStatus;

      const res = await exportsApi.guests(eventId, format, params);
      downloadBlob(res.data, `guests.${format}`);
      toast.success('Download started');
    } catch {
      toast.error('Export failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportCheckInList = async (format: string) => {
    if (!eventId) return;
    setDownloading(`checkin-${format}`);
    try {
      const res = await exportsApi.checkInList(eventId, format);
      downloadBlob(res.data, `check-in-list.${format}`);
      toast.success('Download started');
    } catch {
      toast.error('Export failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportTableLists = async (format: string) => {
    if (!eventId) return;
    setDownloading(`tables-${format}`);
    try {
      const res = await exportsApi.tableLists(eventId, format);
      downloadBlob(res.data, `table-lists.${format}`);
      toast.success('Download started');
    } catch {
      toast.error('Export failed');
    } finally {
      setDownloading(null);
    }
  };

  const exportOptions: ExportOption[] = [
    {
      id: 'guests',
      title: 'Guest List',
      description: 'Export complete guest list with all details, RSVP status, and custom fields',
      icon: Users,
      formats: ['xlsx', 'csv'],
      action: (format) => handleExportGuests(format as 'xlsx' | 'csv'),
    },
    {
      id: 'checkin',
      title: 'Check-In List',
      description: 'Printable check-in list sorted alphabetically with check-in status',
      icon: UserCheck,
      formats: ['xlsx', 'pdf'],
      action: handleExportCheckInList,
    },
    {
      id: 'tables',
      title: 'Table Lists',
      description: 'Table-by-table guest lists with seat assignments and guest details',
      icon: Grid3X3,
      formats: ['xlsx', 'pdf'],
      action: handleExportTableLists,
    },
    {
      id: 'placecards',
      title: 'Place Cards',
      description: 'Printable place cards with guest names and table assignments',
      icon: Tag,
      formats: ['pdf'],
      action: async () => toast('Place cards export coming soon'),
    },
    {
      id: 'seating-chart',
      title: 'Seating Chart',
      description: 'Visual seating chart showing room layout with table assignments',
      icon: Map,
      formats: ['pdf'],
      action: async () => toast('Seating chart export coming soon'),
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Exports & Print</h1>
          <p className="mt-1 text-sm text-surface-500">Download guest lists, reports, and printable materials</p>
        </div>
        <button
          className={clsx('btn-secondary btn-sm', showFilters && 'bg-primary-50 border-primary-300')}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {(filterRsvp || filterStatus) && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">
              {[filterRsvp, filterStatus].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 mb-6">
          <h4 className="text-sm font-semibold text-surface-700 mb-3">Filter Exports</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="label">RSVP Status</label>
              <select className="input" value={filterRsvp} onChange={(e) => setFilterRsvp(e.target.value)}>
                <option value="">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="label">Guest Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                <option value="invited">Invited</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="pt-5">
              <button
                className="btn-ghost btn-sm"
                onClick={() => { setFilterRsvp(''); setFilterStatus(''); }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportOptions.map((option) => (
          <div key={option.id} className="card p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 flex-shrink-0">
                <option.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-surface-900">{option.title}</h3>
                <p className="text-sm text-surface-500 mt-1">{option.description}</p>
                <div className="flex gap-2 mt-4">
                  {option.formats.map((format) => {
                    const key = `${option.id}-${format}`;
                    const isDownloading = downloading === key;
                    return (
                      <button
                        key={format}
                        className="btn-secondary btn-sm"
                        disabled={isDownloading}
                        onClick={() => option.action(format)}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {format.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
