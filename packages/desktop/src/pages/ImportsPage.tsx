import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Upload, FileSpreadsheet, Check, ArrowRight, ArrowLeft, AlertCircle,
  Loader2, CheckCircle2, X, File,
} from 'lucide-react';
import { importsApi } from '../lib/api';
import toast from 'react-hot-toast';

const GUEST_FIELDS = [
  { key: 'convidado', label: 'Name (Convidado)', required: true },
  { key: 'empresa', label: 'Company (Empresa)' },
  { key: 'telephone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'guestType', label: 'Guest Type' },
  { key: 'status', label: 'Status' },
  { key: 'rsvpStatus', label: 'RSVP' },
  { key: 'vipLevel', label: 'VIP Level' },
  { key: 'dietaryRestrictions', label: 'Dietary Restrictions' },
  { key: 'linkedGroupName', label: 'Linked Group' },
  { key: 'notes', label: 'Notes' },
  { key: 'seatPreference', label: 'Seat Preference' },
  { key: '', label: '-- Skip --' },
];

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function ImportsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [suggestedMappings, setSuggestedMappings] = useState<Record<string, string>>({});
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [totalRows, setTotalRows] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [pastImports, setPastImports] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (eventId) loadPastImports();
  }, [eventId]);

  const loadPastImports = async () => {
    if (!eventId) return;
    try {
      const res = await importsApi.list(eventId);
      setPastImports(res.data.data || []);
    } catch { /* ignore */ }
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!eventId) return;
    setFile(selectedFile);
    try {
      const res = await importsApi.upload(eventId, selectedFile);
      const data = res.data.data || res.data;
      setJobId(data.id || data.jobId);
      // Load preview
      const previewRes = await importsApi.preview(eventId, data.id || data.jobId);
      const preview = previewRes.data.data || previewRes.data;
      setHeaders(preview.headers || []);
      setPreviewRows(preview.rows || []);
      setTotalRows(preview.totalRows || 0);
      // Set suggested mappings
      const suggested: Record<string, string> = {};
      if (preview.suggestedMappings) {
        preview.suggestedMappings.forEach((m: any) => {
          suggested[m.sourceColumn] = m.targetField;
        });
      }
      setSuggestedMappings(suggested);
      setMappings(suggested);
      setStep('mapping');
    } catch {
      toast.error('Failed to upload file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleExecuteImport = async () => {
    if (!eventId || !jobId) return;
    setImporting(true);
    setStep('importing');
    try {
      const mappingArray = Object.entries(mappings)
        .filter(([, target]) => target)
        .map(([source, target]) => ({ sourceColumn: source, targetField: target, isCustomField: false }));
      const res = await importsApi.execute(eventId, jobId, mappingArray);
      const data = res.data.data || res.data;
      setResult({
        imported: data.importedRows || data.imported || 0,
        skipped: data.skippedRows || data.skipped || 0,
        errors: data.errorRows || data.errors || 0,
      });
      setStep('complete');
      loadPastImports();
    } catch {
      toast.error('Import failed');
      setStep('mapping');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setJobId(null);
    setHeaders([]);
    setPreviewRows([]);
    setMappings({});
    setResult(null);
  };

  const steps = [
    { id: 'upload', label: 'Upload', num: 1 },
    { id: 'mapping', label: 'Map Columns', num: 2 },
    { id: 'preview', label: 'Preview', num: 3 },
    { id: 'importing', label: 'Import', num: 4 },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Import Guests</h1>
        <p className="text-sm text-surface-500 mt-1">Import guest data from Excel (.xlsx/.xls) or CSV files</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              i < stepIndex ? 'bg-green-500 text-white' :
              i === stepIndex ? 'bg-primary-600 text-white' :
              'bg-surface-200 text-surface-500'
            }`}>
              {i < stepIndex ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span className={`text-sm font-medium ${i <= stepIndex ? 'text-surface-900' : 'text-surface-400'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="w-12 h-px bg-surface-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div>
          <div
            className={`card p-12 text-center border-2 border-dashed transition-colors ${
              dragOver ? 'border-primary-400 bg-primary-50' : 'border-surface-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-surface-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-surface-700">Drop your file here</p>
            <p className="text-sm text-surface-400 mt-1">or click to browse (.xlsx, .xls, .csv)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            <button className="btn-primary mt-4" onClick={() => fileRef.current?.click()}>
              <File className="h-4 w-4" /> Choose File
            </button>
          </div>

          {/* Past Imports */}
          {pastImports.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-surface-700 mb-3">Previous Imports</h3>
              <div className="space-y-2">
                {pastImports.map((imp: any) => (
                  <div key={imp.id} className="card px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-surface-400" />
                      <div>
                        <p className="text-sm font-medium text-surface-700">{imp.fileName}</p>
                        <p className="text-xs text-surface-400">
                          {new Date(imp.createdAt).toLocaleDateString()} - {imp.importedRows}/{imp.totalRows} rows imported
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${imp.status === 'COMPLETED' ? 'badge-green' : imp.status === 'FAILED' ? 'badge-red' : 'badge-yellow'}`}>
                      {imp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mapping Step */}
      {step === 'mapping' && (
        <div>
          <div className="card">
            <div className="p-4 border-b border-surface-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-surface-500" />
                <span className="text-sm font-medium text-surface-700">{file?.name}</span>
                <span className="text-xs text-surface-400">({totalRows} rows detected)</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-surface-700 mb-4">Map File Columns to Guest Fields</h3>
              <div className="space-y-3">
                {headers.map((header) => (
                  <div key={header} className="flex items-center gap-4">
                    <div className="w-48 flex-shrink-0">
                      <span className="text-sm font-medium text-surface-700">{header}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-surface-400 flex-shrink-0" />
                    <select
                      className="input flex-1"
                      value={mappings[header] || ''}
                      onChange={(e) => setMappings((p) => ({ ...p, [header]: e.target.value }))}
                    >
                      <option value="">-- Skip --</option>
                      {GUEST_FIELDS.filter((f) => f.key).map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                    {suggestedMappings[header] && mappings[header] === suggestedMappings[header] && (
                      <span className="text-xs text-green-600">Auto-mapped</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button className="btn-secondary" onClick={reset}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button className="btn-primary" onClick={() => setStep('preview')}>
              Preview <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div>
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-surface-200">
              <h3 className="text-sm font-semibold text-surface-700">Preview (first {Math.min(20, previewRows.length)} rows)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-surface-500">#</th>
                    {headers.filter((h) => mappings[h]).map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-surface-500">
                        {GUEST_FIELDS.find((f) => f.key === mappings[h])?.label || mappings[h]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {previewRows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="hover:bg-surface-50">
                      <td className="px-3 py-2 text-surface-400">{i + 1}</td>
                      {headers.filter((h) => mappings[h]).map((h) => (
                        <td key={h} className="px-3 py-2 text-surface-700 truncate max-w-[200px]">
                          {row[h] || <span className="text-surface-300">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button className="btn-secondary" onClick={() => setStep('mapping')}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button className="btn-primary" onClick={handleExecuteImport}>
              <Upload className="h-4 w-4" /> Import {totalRows} Rows
            </button>
          </div>
        </div>
      )}

      {/* Importing Step */}
      {step === 'importing' && (
        <div className="card p-12 text-center">
          <Loader2 className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-lg font-medium text-surface-700">Importing guests...</p>
          <p className="text-sm text-surface-400 mt-1">Processing {totalRows} rows</p>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && result && (
        <div className="card p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-surface-900">Import Complete</p>
          <div className="mt-4 flex justify-center gap-6">
            <div>
              <p className="text-3xl font-bold text-green-600">{result.imported}</p>
              <p className="text-sm text-surface-500">Imported</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-600">{result.skipped}</p>
              <p className="text-sm text-surface-500">Skipped</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">{result.errors}</p>
              <p className="text-sm text-surface-500">Errors</p>
            </div>
          </div>
          <button className="btn-primary mt-6" onClick={reset}>
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
