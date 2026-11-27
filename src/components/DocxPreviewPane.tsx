import { renderAsync } from 'docx-preview';
import { Download, FileText, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DocxPreviewPaneProps {
  docxBytes: ArrayBuffer | null;
  downloadFileName: string;
  isGenerating: boolean;
  replacedCount: number | null;
  errorMessage: string | null;
  hasTemplate: boolean;
  onRegenerate: () => void;
}

export function DocxPreviewPane({
  docxBytes,
  downloadFileName,
  isGenerating,
  replacedCount,
  errorMessage,
  hasTemplate,
  onRegenerate,
}: DocxPreviewPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(0.82);
  const [pageCount, setPageCount] = useState<number>(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    if (!docxBytes) {
      host.innerHTML = '';
      setPageCount(0);
      return;
    }

    let cancelled = false;
    setRenderError(null);

    const runRender = async () => {
      try {
        host.innerHTML = '';
        await renderAsync(docxBytes.slice(0), host, undefined, {
          className: 'docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
        });
        if (!cancelled) {
          const sections = host.querySelectorAll('section.docx');
          setPageCount(sections.length);
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : 'Unable to preview Word document.');
        }
      }
    };

    void runRender();

    return () => {
      cancelled = true;
    };
  }, [docxBytes]);

  const handleDownload = () => {
    if (!docxBytes) return;
    const blob = new Blob([docxBytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-[78vh] min-h-[600px] overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 text-emerald-800 shrink-0" />
          <div className="truncate">
            <span className="text-sm font-semibold text-slate-900">Live Word (.docx) Preview</span>
            {pageCount > 0 && (
              <span className="ml-2 text-xs text-slate-500 font-mono">
                {pageCount} page{pageCount === 1 ? '' : 's'}
                {replacedCount !== null ? ` · ${replacedCount} fields merged` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center border border-slate-200 rounded-lg bg-white">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRegenerate}
            disabled={!hasTemplate || isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!docxBytes || isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-950 disabled:opacity-50 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download .docx
          </button>
        </div>
      </div>

      {(errorMessage || renderError) && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 text-xs text-red-800 font-medium">
          {errorMessage || renderError}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-slate-200/75 p-2">
        {!hasTemplate ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <FileText className="w-10 h-10 text-slate-400 mb-3" />
            <h3 className="font-heading text-base font-semibold text-slate-800">
              No Word Template Loaded
            </h3>
            <p className="mt-1 text-xs text-slate-600 max-w-sm">
              Upload your custom Word (.docx) template or load the Standard SAMD Template above to render a live document preview.
            </p>
          </div>
        ) : !docxBytes && isGenerating ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-600 font-medium">
            Rendering paginated Word document...
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: `${100 / zoom}%`,
            }}
          >
            <div ref={containerRef} className="docx-preview-host" />
          </div>
        )}
      </div>
    </div>
  );
}
