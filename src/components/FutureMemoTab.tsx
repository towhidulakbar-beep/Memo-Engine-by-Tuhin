import { Download, FileSpreadsheet, Info, Upload } from 'lucide-react';
import { useRef } from 'react';
import type { MemoType, PlaceholderField, TemplateMetadata } from '../types/memo.ts';
import { DocxPreviewPane } from './DocxPreviewPane.tsx';

interface FutureMemoTabProps {
  memoType: Exclude<MemoType, 'ic_memo'>;
  title: string;
  subtitle: string;
  template: TemplateMetadata | null;
  fields: Record<string, PlaceholderField>;
  localOverrides: Record<string, string>;
  docxBytes: ArrayBuffer | null;
  replacedCount: number | null;
  isGeneratingDocx: boolean;
  docxError: string | null;
  onUploadTemplate: (file: File) => void;
  onLoadStarterTemplate: () => void;
  onOverrideChange: (key: string, value: string) => void;
  onRegenerateDocx: () => void;
}

export function FutureMemoTab({
  memoType,
  title,
  subtitle,
  template,
  fields,
  localOverrides,
  docxBytes,
  replacedCount,
  isGeneratingDocx,
  docxError,
  onUploadTemplate,
  onLoadStarterTemplate,
  onOverrideChange,
  onRegenerateDocx,
}: FutureMemoTabProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const clientName = localOverrides['#2#'] || fields['#2#']?.displayValue || 'Client';
  const prefixMap: Record<Exclude<MemoType, 'ic_memo'>, string> = {
    mec_memo: 'MEC Memo',
    board_memo: 'Board Memo',
    sanction: 'Sanction',
  };
  const downloadFileName = `${prefixMap[memoType]} - ${clientName.replace(/[\\/:*?"<>|]/g, '')}.docx`;

  const activePlaceholders = template?.placeholders || [];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Modular Document Workspace · {title}
          </div>
          <h2 className="font-heading text-lg font-bold text-slate-950">{subtitle}</h2>
          <p className="text-xs text-slate-600">
            Ready to bind extracted fields from Manual Inputs into any uploaded {title} Word (.docx) template.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadTemplate(f);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload {title} .docx Template
          </button>

          <button
            type="button"
            onClick={onLoadStarterTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Load Starter Template
          </button>

          <a
            href={`/api/templates/default/${memoType}?download=1`}
            download={`${prefixMap[memoType]} Starter Template.docx`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download Starter .docx
          </a>
        </div>
      </div>

      <div className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
        <div>
          <strong>Architecture Ready for Future Rules:</strong> Upload any institutional{' '}
          <span className="font-mono">.docx</span> template containing <span className="font-mono">#N#</span>{' '}
          placeholders for {title}. Shared client &amp; financial values flow automatically from Manual Inputs, and you can customize any detected placeholder below without affecting other tabs. Memo-specific calculation and narrative rules will plug cleanly into this workspace when specified.
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[78vh] min-h-[600px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-heading text-sm font-bold text-slate-900">
              Template Placeholder Mapping
            </h3>
            <p className="text-[11px] text-slate-500">
              {template
                ? `${template.fileName} · ${activePlaceholders.length} placeholders found`
                : 'Upload a template or load the starter template to edit placeholders'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activePlaceholders.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">
                No template loaded yet. Click "Load Starter Template" or upload your custom Word (.docx) file.
              </div>
            ) : (
              activePlaceholders.map((tp) => {
                const baseField = fields[tp.key];
                const effectiveValue =
                  localOverrides[tp.key] !== undefined
                    ? localOverrides[tp.key]
                    : baseField?.displayValue || '';
                return (
                  <div key={tp.key} className="p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        <span className="font-mono text-emerald-800 mr-1.5">{tp.key}</span>
                        {baseField?.label || 'Template Field'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {tp.occurrences}×
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate" title={tp.context}>
                      Context: {tp.context}
                    </div>
                    <input
                      type="text"
                      value={effectiveValue}
                      placeholder="Enter value..."
                      onChange={(e) => onOverrideChange(tp.key, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="xl:col-span-7">
          <DocxPreviewPane
            docxBytes={docxBytes}
            downloadFileName={downloadFileName}
            isGenerating={isGeneratingDocx}
            replacedCount={replacedCount}
            errorMessage={docxError}
            hasTemplate={Boolean(template)}
            onRegenerate={onRegenerateDocx}
          />
        </div>
      </div>
    </div>
  );
}
