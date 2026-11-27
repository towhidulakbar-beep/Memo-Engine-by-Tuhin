import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  FilePlus2,
  FolderUp,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type {
  CalculationResult,
  DocumentCategory,
  ExtractionConflict,
  ManualInputsData,
  PlaceholderField,
  UploadedDocumentItem,
} from '../types/memo.ts';
import { DOCUMENT_CATEGORIES } from '../utils/calculations.ts';

interface ManualInputsTabProps {
  documents: UploadedDocumentItem[];
  fields: Record<string, PlaceholderField>;
  manualInputs: ManualInputsData;
  calculations: CalculationResult;
  conflicts: ExtractionConflict[];
  isBatchProcessing: boolean;
  onUploadFiles: (files: File[], assignedCategory?: DocumentCategory, replaceDocId?: string) => void;
  onLoadSampleCase: () => void;
  onChangeDocCategory: (docId: string, category: DocumentCategory) => void;
  onReprocessDoc: (docId: string) => void;
  onRemoveDoc: (docId: string) => void;
  onManualInputChange: (key: keyof ManualInputsData, value: string) => void;
  onEditPlaceholderValue: (placeholderKey: string, newDisplayValue: string) => void;
  onResolveConflict: (placeholderKey: string, chosenValue: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ManualInputsTab({
  documents,
  fields,
  manualInputs,
  calculations,
  conflicts,
  isBatchProcessing,
  onUploadFiles,
  onLoadSampleCase,
  onChangeDocCategory,
  onReprocessDoc,
  onRemoveDoc,
  onManualInputChange,
  onEditPlaceholderValue,
  onResolveConflict,
}: ManualInputsTabProps) {
  const batchInputRef = useRef<HTMLInputElement | null>(null);
  const categoryInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const [pendingCategory, setPendingCategory] = useState<DocumentCategory | null>(null);
  const [pendingReplaceId, setPendingReplaceId] = useState<string | null>(null);
  const [isDraggingBatch, setIsDraggingBatch] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fieldList = Object.values(fields).sort(
    (a, b) => Number(a.key.replace(/#/g, '')) - Number(b.key.replace(/#/g, ''))
  );

  const filteredFields = fieldList.filter((f) => {
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      return (
        f.key.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.displayValue.toLowerCase().includes(q) ||
        f.sourceLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const readyCategoryCount = new Set(
    documents.filter((d) => d.status === 'ready').map((d) => d.category)
  ).size;

  const populatedCount = fieldList.filter((f) => !f.isMissing).length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Workspace 1 · Document Ingestion &amp; Financial Verification
          </div>
          <h2 className="font-heading text-xl font-bold text-slate-950">
            Source Documents &amp; Manual Inputs
          </h2>
          <p className="text-xs text-slate-600">
            {readyCategoryCount} of 7 document categories loaded · {populatedCount} of {fieldList.length} fields populated · All currency figures formatted in Million BDT (3 decimal places)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onLoadSampleCase}
            disabled={isBatchProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-800/30 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <FolderUp className="w-4 h-4" />
            Load Sample Case (J.A. Enterprise)
          </button>

          <button
            type="button"
            onClick={() => batchInputRef.current?.click()}
            disabled={isBatchProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isBatchProcessing ? 'Processing Batch...' : 'Batch Upload Documents'}
          </button>
        </div>

        <input
          ref={batchInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files) : [];
            if (list.length > 0) onUploadFiles(list);
            e.target.value = '';
          }}
        />
        <input
          ref={categoryInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files) : [];
            if (list.length > 0 && pendingCategory) {
              onUploadFiles(list, pendingCategory);
            }
            setPendingCategory(null);
            e.target.value = '';
          }}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files) : [];
            if (list.length > 0 && pendingReplaceId) {
              const targetDoc = documents.find((d) => d.id === pendingReplaceId);
              onUploadFiles([list[0]], targetDoc?.category, pendingReplaceId);
            }
            setPendingReplaceId(null);
            e.target.value = '';
          }}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingBatch(true);
        }}
        onDragLeave={() => setIsDraggingBatch(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingBatch(false);
          const dropped = Array.from(e.dataTransfer.files || []);
          if (dropped.length > 0) onUploadFiles(dropped);
        }}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          isDraggingBatch
            ? 'border-emerald-700 bg-emerald-50/70'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <FilePlus2 className="w-6 h-6 text-emerald-800 shrink-0" />
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900">
              Drag &amp; drop multiple banking documents here for automatic content classification
            </div>
            <div className="text-xs text-slate-500">
              Supports PDF, DOCX, XLSX, XLS, CSV, TXT, and scanned images · Upload multiple files at once or use the 7 category slots below
            </div>
          </div>
          <button
            type="button"
            onClick={() => batchInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            Browse Files
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {DOCUMENT_CATEGORIES.map((cat) => {
          const catDocs = documents.filter((d) => d.category === cat.id);
          const hasReady = catDocs.some((d) => d.status === 'ready');
          const hasError = catDocs.some((d) => d.status === 'error');
          const isProcessing = catDocs.some((d) => d.status === 'processing' || d.status === 'uploading');

          return (
            <div
              key={cat.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dropped = Array.from(e.dataTransfer.files || []);
                if (dropped.length > 0) onUploadFiles(dropped, cat.id);
              }}
              className={`bg-white border rounded-xl p-4 flex flex-col justify-between gap-3 ${
                hasError
                  ? 'border-red-300'
                  : hasReady
                  ? 'border-emerald-700/40'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-slate-900">{cat.label}</h3>
                    <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                      {isProcessing
                        ? 'Processing...'
                        : hasError
                        ? 'Attention required'
                        : hasReady
                        ? `${catDocs.length} file${catDocs.length === 1 ? '' : 's'} · Ready`
                        : 'Pending upload'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingCategory(cat.id);
                      categoryInputRef.current?.click();
                    }}
                    className="px-2.5 py-1 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    + Upload
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{cat.description}</p>
              </div>

              {catDocs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {catDocs.map((doc) => (
                    <div key={doc.id} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate" title={doc.fileName}>
                            {doc.fileName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {formatFileSize(doc.fileSize)} · {doc.method === 'ai_ocr' ? 'AI OCR' : doc.method === 'mixed' ? 'Hybrid AI' : doc.method === 'deterministic' ? 'Deterministic' : 'Queued'} · {doc.extractedCount} fields
                          </div>
                        </div>
                        {doc.status === 'ready' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        ) : doc.status === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0 mt-0.5" />
                        )}
                      </div>

                      {(doc.status === 'uploading' || doc.status === 'processing') && (
                        <div className="w-full h-1.5 bg-slate-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-emerald-700 transition-all duration-300"
                            style={{ width: `${doc.progress}%` }}
                          />
                        </div>
                      )}

                      {doc.errorMessage && (
                        <div className="text-[11px] text-red-700">{doc.errorMessage}</div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <select
                          aria-label={`Category for ${doc.fileName}`}
                          value={doc.category}
                          onChange={(e) => onChangeDocCategory(doc.id, e.target.value as DocumentCategory)}
                          className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 max-w-[130px]"
                        >
                          {DOCUMENT_CATEGORIES.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.shortLabel}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onReprocessDoc(doc.id)}
                            title="Reprocess file"
                            className="p-1 rounded hover:bg-slate-200/70 text-slate-600 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingReplaceId(doc.id);
                              replaceInputRef.current?.click();
                            }}
                            title="Replace file"
                            className="px-1.5 py-0.5 rounded hover:bg-slate-200/70 text-[11px] font-medium text-slate-700 cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveDoc(doc.id)}
                            title="Remove file"
                            className="p-1 rounded hover:bg-red-100 text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Cross-Document Discrepancies Detected ({conflicts.length})</span>
          </div>
          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div
                key={conflict.placeholderKey}
                className="bg-white border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="text-xs">
                  <span className="font-mono font-semibold text-slate-900">{conflict.placeholderKey}</span>
                  <span className="mx-1.5 text-slate-400">·</span>
                  <span className="font-semibold text-slate-800">{conflict.label}</span>
                  <span className="ml-2 text-slate-500">
                    Active value: <strong className="text-slate-900">{fields[conflict.placeholderKey]?.displayValue}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {conflict.candidates.map((cand, i) => (
                    <button
                      key={`${cand.sourceFileName}-${i}`}
                      type="button"
                      onClick={() => onResolveConflict(conflict.placeholderKey, cand.value)}
                      className={`px-2.5 py-1 rounded border text-xs font-medium cursor-pointer ${
                        fields[conflict.placeholderKey]?.displayValue === cand.value
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold'
                          : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Use "{cand.value}" ({cand.sourceFileName})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Required Manual Inputs (6 Fields)
              </h3>
              <p className="text-xs text-slate-500">
                Enter proposal &amp; settlement parameters in Million BDT (3 decimal places applied automatically)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="font-mono text-emerald-800 mr-1.5">#1#</span>
                Proposal Date
              </label>
              <input
                type="text"
                placeholder="e.g. 17.11.2026"
                value={manualInputs.proposalDate}
                onChange={(e) => onManualInputChange('proposalDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="font-mono text-emerald-800 mr-1.5">#4#</span>
                Proposed Waiver Amount (Million BDT)
              </label>
              <input
                type="text"
                placeholder="e.g. 1.020"
                value={manualInputs.waiverAmount}
                onChange={(e) => onManualInputChange('waiverAmount', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="font-mono text-emerald-800 mr-1.5">#27#</span>
                Settlement Amount (Million BDT)
              </label>
              <input
                type="text"
                placeholder="e.g. 4.350"
                value={manualInputs.settlementAmount}
                onChange={(e) => onManualInputChange('settlementAmount', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="font-mono text-emerald-800 mr-1.5">#28#</span>
                Settlement Period / Deadline
              </label>
              <input
                type="text"
                placeholder="e.g. Within 31.12.2026"
                value={manualInputs.settlementPeriod}
                onChange={(e) => onManualInputChange('settlementPeriod', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="font-mono text-emerald-800 mr-1.5">#45#</span>
                Waiver Recommended by Client &amp; Branch (Million BDT)
              </label>
              <input
                type="text"
                placeholder="e.g. 1.020"
                value={manualInputs.waiverRecommendedClientBranch}
                onChange={(e) => onManualInputChange('waiverRecommendedClientBranch', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="font-mono text-emerald-800 mr-1.5">#47#</span>
                Waiver Recommended by H/O SAMD (Million BDT)
              </label>
              <input
                type="text"
                placeholder="e.g. 1.020"
                value={manualInputs.waiverRecommendedHo}
                onChange={(e) => onManualInputChange('waiverRecommendedHo', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-4 h-4 text-emerald-800 shrink-0" />
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                Deterministic IC Memo Calculations
              </h3>
              <p className="text-xs text-slate-500">Computed from unrounded inputs, displayed to 3 decimals</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                key: '#32#',
                title: 'Breakup Total (Principal + Charges + COF)',
                res: calculations.breakupTotal32,
              },
              {
                key: '#42#',
                title: 'Total [Profit + Charges + Comp. + Uncharged Comp.]',
                res: calculations.totalChargesProfitComp42,
              },
              {
                key: '#44#',
                title: 'Maximum Waiver Considering COF [a - b]',
                res: calculations.maxWaiverConsideringCof44,
              },
            ].map((item) => (
              <div
                key={item.key}
                className={`p-3 rounded-lg border ${
                  item.res.isMissing ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-800">
                    <span className="font-mono text-emerald-800 mr-1.5">{item.key}</span>
                    {item.title}
                  </div>
                  <div className="text-base font-mono font-bold text-slate-950 shrink-0">
                    {item.res.isMissing ? 'Missing' : `Tk. ${item.res.display}M`}
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">
                  Formula: {item.res.formulaText}
                  {item.res.isMissing && (
                    <span className="ml-2 text-amber-800 font-sans">
                      · Needs: {item.res.missingInputs.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900">
              Extracted &amp; Mapped Placeholder Review Table
            </h3>
            <p className="text-xs text-slate-500">
              Edit any field value directly below; derived formulas recalculate immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual Inputs</option>
              <option value="calculated">Calculated</option>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search #N# or label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 focus:outline-none focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-4 w-20">Tag</th>
                <th className="py-2.5 px-4">Field Label</th>
                <th className="py-2.5 px-4">Source / Provenance</th>
                <th className="py-2.5 px-4">Raw Extracted</th>
                <th className="py-2.5 px-4 w-48">Formatted Value (Editable)</th>
                <th className="py-2.5 px-4 w-24">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFields.map((field) => {
                const isCalc = field.category === 'calculated';
                return (
                  <tr key={field.key} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-900">{field.key}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{field.label}</td>
                    <td className="py-2.5 px-4 text-slate-600">{field.sourceLabel}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {field.rawValue ? `${field.rawValue} ${field.rawUnit === 'BDT' ? 'BDT' : ''}` : '—'}
                    </td>
                    <td className="py-2 px-4">
                      {isCalc ? (
                        <span className="font-mono font-bold text-slate-950">
                          {field.displayValue || '—'}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={field.displayValue}
                          placeholder={field.valueType === 'currency_million' ? '0.000' : 'Enter value'}
                          onChange={(e) => onEditPlaceholderValue(field.key, e.target.value)}
                          className={`w-full px-2 py-1 rounded border text-xs ${
                            field.valueType === 'currency_million' ? 'font-mono' : ''
                          } border-slate-300 focus:outline-none focus:border-emerald-700 bg-white`}
                        />
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[11px] font-medium">
                      {field.hasConflict ? (
                        <span className="text-amber-800 font-semibold">Conflict</span>
                      ) : field.isMissing ? (
                        <span className="text-amber-700">Missing</span>
                      ) : field.isEdited ? (
                        <span className="text-sky-800">Edited</span>
                      ) : (
                        <span className="text-emerald-800">Ready</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
