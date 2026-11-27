import { ArrowRight, Building2, FileSpreadsheet, FileText, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 text-white flex items-center justify-center font-heading font-bold text-sm tracking-tight">
              ME
            </div>
            <div>
              <span className="font-heading font-bold text-slate-900 tracking-tight text-base">
                Memo Engine by Tuhin
              </span>
              <span className="hidden sm:inline text-slate-400 mx-2">·</span>
              <span className="hidden sm:inline text-xs font-medium text-slate-500">
                Commercial Banking Automation Suite
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLaunch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Launch Memo Engine
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-6 w-full space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                Special Asset Management Division · Banking Workflow Software
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-950 tracking-tight leading-[1.12]">
                Memo Engine by Tuhin
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Automated preparation of commercial banking investment settlement memos, financial
                breakup analysis, AI-assisted credit scrutiny, and template-faithful Microsoft Word
                (.docx) outputs directly from source bank statements and proposals.
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onLaunch}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white text-base font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Launch Memo Engine
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  5 Workspaces · IC Memo · MEC Memo · Board Memo · Sanction
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>1. Batch Extraction</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Upload 7 banking document types with automatic classification and Million BDT precision.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>2. AI Credit Scrutiny</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Populate audit compliance, collateral security, CIB tables, and 5-line SAMD observations.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileText className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>3. Word (.docx) Output</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Preview exact pagination in-browser and export editable Word files preserving layouts.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between text-white">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                    Developer Profile
                  </span>
                  <Building2 className="w-4 h-4 text-emerald-200" />
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center sm:items-start gap-5">
                    <div className="w-36 h-44 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src="/assets/aistudio/Tuhin_Pic_6c5894de.jpeg"
                        alt="Mohammad Towhidul Akbar Tuhin"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    <div className="space-y-2 text-center sm:text-left lg:text-center xl:text-left">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Developed by
                      </div>
                      <h2 className="font-heading text-xl font-bold text-slate-950 leading-snug">
                        Mohammad Towhidul Akbar Tuhin
                      </h2>
                      <div className="text-sm font-medium text-slate-800 leading-snug">
                        Officer, Sammilito Islami Bank PLC
                      </div>
                      <div className="text-xs text-slate-600 leading-snug">
                        (Transferee of Assets &amp; Liabilities of Union Bank PLC)
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 space-y-2 text-sm text-slate-700">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Undergraduate
                      </span>
                      <span className="font-medium text-slate-900 text-right">
                        BBA, Heriot Watt University, UK
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Postgraduate
                      </span>
                      <span className="font-medium text-slate-900 text-right">
                        MBA, University of Chittagong
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
