import { Building2, GraduationCap, X } from 'lucide-react';

interface DeveloperModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeveloperModal({ open, onClose }: DeveloperModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Developer Profile"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              About &amp; Developer Profile
            </div>
            <h2 className="font-heading text-lg font-bold">Memo Engine by Tuhin</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Developer Profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-32 h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img
                src="/assets/aistudio/Tuhin_Pic_6c5894de.jpeg"
                alt="Mohammad Towhidul Akbar Tuhin"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Developed by
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-950">
                Mohammad Towhidul Akbar Tuhin
              </h3>
              <div className="flex items-start justify-center sm:justify-start gap-2 text-sm text-slate-800 font-medium">
                <Building2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <div>
                  <div>Officer, Sammilito Islami Bank PLC</div>
                  <div className="text-xs font-normal text-slate-600 mt-0.5">
                    (Transferee of Assets &amp; Liabilities of Union Bank PLC)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <GraduationCap className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>BBA, Heriot Watt University, UK</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <GraduationCap className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>MBA, University of Chittagong</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Commercial Banking Memo Automation Suite</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
