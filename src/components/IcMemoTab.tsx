import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type {
  IcMemoSectionsData,
  PlaceholderField,
  TemplateMetadata,
  UploadedDocumentItem,
} from '../types/memo.ts';
import { DocxPreviewPane } from './DocxPreviewPane.tsx';

interface IcMemoTabProps {
  template: TemplateMetadata | null;
  fields: Record<string, PlaceholderField>;
  sections: IcMemoSectionsData;
  documents: UploadedDocumentItem[];
  docxBytes: ArrayBuffer | null;
  replacedCount: number | null;
  isGeneratingDocx: boolean;
  isScrutinizing: boolean;
  scrutinyError: string | null;
  docxError: string | null;
  onUploadTemplate: (file: File) => void;
  onLoadDefaultTemplate: () => void;
  onScrutinizeWithAi: () => void;
  onUpdateSections: (updater: (prev: IcMemoSectionsData) => IcMemoSectionsData) => void;
  onEditPlaceholderValue: (key: string, value: string) => void;
  onRegenerateDocx: () => void;
}

type EditorSubTab = 'header' | 'narrative' | 'cib_audit' | 'security' | 'client_samd';

export function IcMemoTab({
  template,
  fields,
  sections,
  documents,
  docxBytes,
  replacedCount,
  isGeneratingDocx,
  isScrutinizing,
  scrutinyError,
  docxError,
  onUploadTemplate,
  onLoadDefaultTemplate,
  onScrutinizeWithAi,
  onUpdateSections,
  onEditPlaceholderValue,
  onRegenerateDocx,
}: IcMemoTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editorTab, setEditorTab] = useState<EditorSubTab>('header');

  const branchProposalReady = documents.some(
    (d) => d.category === 'branch_proposal' && d.status === 'ready'
  );

  const clientName = fields['#2#']?.displayValue || 'Client';
  const downloadFileName = `IC Memo - ${clientName.replace(/[\\/:*?"<>|]/g, '')}.docx`;

  const matchedTemplateTags = template
    ? template.placeholders.filter((tp) => fields[tp.key] && !fields[tp.key].isMissing).length
    : 0;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Workspace 2 · Investment Committee (IC) Memorandum
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-slate-950">
              {template ? template.fileName : 'IC Memo Template'}
            </h2>
            {template && (
              <span className="text-xs text-slate-500 font-mono">
                · {template.placeholders.length} placeholders detected ({matchedTemplateTags} populated)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <input
            ref={fileInputRef}
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
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload .docx Template
          </button>

          <button
            type="button"
            onClick={onLoadDefaultTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Use Standard SAMD Template
          </button>

          <a
            href="/api/templates/default/ic_memo?download=1"
            download="IC Memo Standard SAMD Template.docx"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download Blank Template
          </a>

          <button
            type="button"
            onClick={onScrutinizeWithAi}
            disabled={isScrutinizing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-950 disabled:opacity-60 text-white text-xs font-semibold shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isScrutinizing ? 'animate-pulse' : ''}`} />
            {isScrutinizing ? 'Scrutinizing Proposal...' : 'Scrutinize and Fill up through AI'}
          </button>
        </div>
      </div>

      {scrutinyError && (
        <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 font-medium">
          {scrutinyError}
        </div>
      )}

      {!branchProposalReady && (
        <div className="px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
          Upload a <strong>Branch Proposal</strong> in the Manual Inputs tab before clicking "Scrutinize and Fill up through AI". Numeric financial fields extracted from other documents merge immediately.
        </div>
      )}

      {sections.scritinizedAt && (
        <div className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs text-emerald-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              AI Scrutiny populated narrative tables, audit responses, collateral security, client particulars, and 5-line SAMD observation. Review or edit any section below before exporting.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[78vh] min-h-[600px]">
          <div className="border-b border-slate-200 bg-slate-50 px-3 pt-2.5 flex flex-wrap gap-1">
            {[
              { id: 'header' as const, label: 'Key Figures' },
              { id: 'narrative' as const, label: 'Justification & Notes' },
              { id: 'cib_audit' as const, label: 'CIB, Legal & Audit' },
              { id: 'security' as const, label: 'Security & Sanctions' },
              { id: 'client_samd' as const, label: 'Client & SAMD (5-Line)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEditorTab(tab.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  editorTab === tab.id
                    ? 'border-emerald-800 text-emerald-950 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {editorTab === 'header' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Memo No.</label>
                  <input
                    type="text"
                    placeholder="Optional Memo Reference No."
                    value={sections.memoNumber}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, memoNumber: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    '#1#',
                    '#2#',
                    '#3#',
                    '#69#',
                    '#36#',
                    '#68#',
                    '#5#',
                    '#6#',
                    '#7#',
                    '#8#',
                    '#10#',
                    '#11#',
                    '#12#',
                    '#25#',
                    '#4#',
                    '#27#',
                    '#28#',
                    '#31#',
                    '#32#',
                    '#33#',
                    '#34#',
                    '#35#',
                    '#42#',
                    '#44#',
                    '#45#',
                    '#47#',
                    '#58#',
                    '#59#',
                    '#60#',
                  ].map((key) => {
                    const f = fields[key];
                    if (!f) return null;
                    const isCalc = f.category === 'calculated';
                    return (
                      <div key={key}>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1 truncate">
                          <span className="font-mono text-emerald-800 mr-1">{f.key}</span>
                          {f.label}
                        </label>
                        <input
                          type="text"
                          readOnly={isCalc}
                          value={f.displayValue}
                          onChange={(e) => onEditPlaceholderValue(key, e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                            f.valueType === 'currency_million' ? 'font-mono' : ''
                          } ${
                            isCalc
                              ? 'bg-slate-100 border-slate-200 text-slate-800 font-semibold'
                              : 'bg-white border-slate-300 focus:outline-none focus:border-emerald-700'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {editorTab === 'narrative' && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-900">
                    Justification of The Proposed Facility
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      1. Client Application &amp; Business Loss Verification
                    </label>
                    <textarea
                      rows={3}
                      value={sections.justificationPoint1}
                      onChange={(e) =>
                        onUpdateSections((prev) => ({ ...prev, justificationPoint1: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      2. Down Payment &amp; Willingness to Settle
                    </label>
                    <textarea
                      rows={2}
                      value={sections.justificationPoint2}
                      onChange={(e) =>
                        onUpdateSections((prev) => ({ ...prev, justificationPoint2: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      3. Early Exit Recovery &amp; Litigation Avoidance
                    </label>
                    <textarea
                      rows={2}
                      value={sections.justificationPoint3}
                      onChange={(e) =>
                        onUpdateSections((prev) => ({ ...prev, justificationPoint3: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Locked Regulatory Compliance Statements (Unaltered in Template)
                    </div>
                    <div>4. Investment was not created against any fraud and forgery.</div>
                    <div>5. The client is not a willful defaulter.</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Previous Board Decision(s) Regarding Rescheduling/Waiver/Written-Off
                  </label>
                  <input
                    type="text"
                    value={sections.previousBoardDecision}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, previousBoardDecision: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Nature of Business
                  </label>
                  <input
                    type="text"
                    value={sections.natureOfBusiness}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, natureOfBusiness: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    8. Source of Repayment
                  </label>
                  <input
                    type="text"
                    value={sections.sourceOfRepayment}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, sourceOfRepayment: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    12. Recommendation of The Branch
                  </label>
                  <textarea
                    rows={4}
                    value={sections.recommendationOfBranch}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, recommendationOfBranch: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    13. Branch Visit Report
                  </label>
                  <textarea
                    rows={3}
                    value={sections.branchVisitReport}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, branchVisitReport: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>
            )}

            {editorTab === 'cib_audit' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900">4. CIB Status</div>
                    <input
                      type="text"
                      placeholder="Report Date"
                      value={sections.cibReportDate}
                      onChange={(e) =>
                        onUpdateSections((prev) => ({ ...prev, cibReportDate: e.target.value }))
                      }
                      className="px-2 py-1 rounded border border-slate-300 text-xs w-36"
                    />
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-1.5 text-left">Status</th>
                          <th className="p-1.5">UB Borrower</th>
                          <th className="p-1.5">UB Guar.</th>
                          <th className="p-1.5">Other Borr.</th>
                          <th className="p-1.5">Other Guar.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sections.cibRows.map((row, idx) => (
                          <tr key={row.status}>
                            <td className="p-1.5 font-semibold text-slate-800">{row.status}</td>
                            {(['siblBorrower', 'siblGuarantor', 'otherBorrower', 'otherGuarantor'] as const).map(
                              (col) => (
                                <td key={col} className="p-1">
                                  <input
                                    type="text"
                                    value={row[col]}
                                    onChange={(e) =>
                                      onUpdateSections((prev) => {
                                        const nextRows = [...prev.cibRows];
                                        nextRows[idx] = { ...nextRows[idx], [col]: e.target.value };
                                        return { ...prev, cibRows: nextRows };
                                      })
                                    }
                                    className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-center font-mono"
                                  />
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="CIB Remarks (Concern-wise breakup)"
                    value={sections.cibRemarks}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, cibRemarks: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900">5. Legal Action Status</div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSections((prev) => ({
                          ...prev,
                          legalActionRows: [
                            ...prev.legalActionRows,
                            {
                              sl: String(prev.legalActionRows.length + 1),
                              typeOfCase: '',
                              caseNo: '',
                              filingDate: '',
                              amount: '',
                              previousDate: '',
                              nextDate: '',
                              presentStatus: '',
                            },
                          ],
                        }))
                      }
                      className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      + Add Row
                    </button>
                  </div>
                  {sections.legalActionRows.map((row, idx) => (
                    <div key={idx} className="p-2.5 border border-slate-200 rounded-lg space-y-2 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Type of Case"
                          value={row.typeOfCase}
                          onChange={(e) =>
                            onUpdateSections((prev) => {
                              const next = [...prev.legalActionRows];
                              next[idx] = { ...next[idx], typeOfCase: e.target.value };
                              return { ...prev, legalActionRows: next };
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Case No."
                          value={row.caseNo}
                          onChange={(e) =>
                            onUpdateSections((prev) => {
                              const next = [...prev.legalActionRows];
                              next[idx] = { ...next[idx], caseNo: e.target.value };
                              return { ...prev, legalActionRows: next };
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Filing Date"
                          value={row.filingDate}
                          onChange={(e) =>
                            onUpdateSections((prev) => {
                              const next = [...prev.legalActionRows];
                              next[idx] = { ...next[idx], filingDate: e.target.value };
                              return { ...prev, legalActionRows: next };
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Present Status"
                          value={row.presentStatus}
                          onChange={(e) =>
                            onUpdateSections((prev) => {
                              const next = [...prev.legalActionRows];
                              next[idx] = { ...next[idx], presentStatus: e.target.value };
                              return { ...prev, legalActionRows: next };
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900">
                    6. Audit, Compliance and Regulatory Status
                  </div>
                  {sections.auditRows.map((row, idx) => (
                    <div key={row.sl} className="p-2.5 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-800">
                        <span>
                          {row.sl}. {row.authority}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Inspection Date"
                            value={row.lastInspectionDate}
                            onChange={(e) =>
                              onUpdateSections((prev) => {
                                const next = [...prev.auditRows];
                                next[idx] = { ...next[idx], lastInspectionDate: e.target.value };
                                return { ...prev, auditRows: next };
                              })
                            }
                            className="px-2 py-0.5 rounded border border-slate-300 text-[11px] w-28 font-normal"
                          />
                          <input
                            type="text"
                            placeholder="Yes/No"
                            value={row.objectionStatus}
                            onChange={(e) =>
                              onUpdateSections((prev) => {
                                const next = [...prev.auditRows];
                                next[idx] = { ...next[idx], objectionStatus: e.target.value };
                                return { ...prev, auditRows: next };
                              })
                            }
                            className="px-2 py-0.5 rounded border border-slate-300 text-[11px] w-14 font-normal text-center"
                          />
                        </div>
                      </div>
                      {(row.objectionStatus.toLowerCase() === 'yes' || row.objections || row.branchReply) && (
                        <div className="grid grid-cols-1 gap-2">
                          <textarea
                            rows={2}
                            placeholder="Objections"
                            value={row.objections}
                            onChange={(e) =>
                              onUpdateSections((prev) => {
                                const next = [...prev.auditRows];
                                next[idx] = { ...next[idx], objections: e.target.value };
                                return { ...prev, auditRows: next };
                              })
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 text-[11px]"
                          />
                          <textarea
                            rows={2}
                            placeholder="Branch Reply / Current Position"
                            value={row.branchReply}
                            onChange={(e) =>
                              onUpdateSections((prev) => {
                                const next = [...prev.auditRows];
                                next[idx] = { ...next[idx], branchReply: e.target.value };
                                return { ...prev, branchReply: next };
                              })
                            }
                            className="w-full px-2 py-1 rounded border border-slate-300 text-[11px]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editorTab === 'security' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Security Value (Stock / Machinery / Margin)
                  </label>
                  <input
                    type="text"
                    value={sections.primarySecurityValue}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, primarySecurityValue: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collateral Land Owner(s)
                  </label>
                  <input
                    type="text"
                    value={sections.collateralOwner}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, collateralOwner: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collateral Schedule Details
                  </label>
                  <textarea
                    rows={6}
                    value={sections.collateralDescription}
                    onChange={(e) =>
                      onUpdateSections((prev) => ({ ...prev, collateralDescription: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900">9. Sequence of HO Sanctions</div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSections((prev) => ({
                          ...prev,
                          hoSanctionRows: [
                            ...prev.hoSanctionRows,
                            {
                              sl: `0${prev.hoSanctionRows.length + 1}.`,
                              referenceNo: '',
                              date: '',
                              limit: '',
                              remarks: '',
                            },
                          ],
                        }))
                      }
                      className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      + Add Sanction
                    </button>
                  </div>
                  {sections.hoSanctionRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                      <input
                        type="text"
                        value={row.sl}
                        onChange={(e) =>
                          onUpdateSections((prev) => {
                            const next = [...prev.hoSanctionRows];
                            next[idx] = { ...next[idx], sl: e.target.value };
                            return { ...prev, hoSanctionRows: next };
                          })
                        }
                        className="col-span-2 px-1.5 py-1 border border-slate-300 rounded text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="HO Ref No."
                        value={row.referenceNo}
                        onChange={(e) =>
                          onUpdateSections((prev) => {
                            const next = [...prev.hoSanctionRows];
                            next[idx] = { ...next[idx], referenceNo: e.target.value };
                            return { ...prev, hoSanctionRows: next };
                          })
                        }
                        className="col-span-5 px-1.5 py-1 border border-slate-300 rounded text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Date"
                        value={row.date}
                        onChange={(e) =>
                          onUpdateSections((prev) => {
                            const next = [...prev.hoSanctionRows];
                            next[idx] = { ...next[idx], date: e.target.value };
                            return { ...prev, hoSanctionRows: next };
                          })
                        }
                        className="col-span-3 px-1.5 py-1 border border-slate-300 rounded text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Limit"
                        value={row.limit}
                        onChange={(e) =>
                          onUpdateSections((prev) => {
                            const next = [...prev.hoSanctionRows];
                            next[idx] = { ...next[idx], limit: e.target.value };
                            return { ...prev, hoSanctionRows: next };
                          })
                        }
                        className="col-span-2 px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editorTab === 'client_samd' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      14. Observation and Recommendation of SAMD (Exactly 5 Concise Lines)
                    </div>
                    <p className="text-[11px] text-slate-600">
                      1) Justification · 2) Client History · 3) Collateral Security · 4) Legal Cases · 5) SAMD Recommendation
                    </p>
                  </div>
                  {[0, 1, 2, 3, 4].map((lineIdx) => (
                    <div key={lineIdx}>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Line {lineIdx + 1}
                      </label>
                      <textarea
                        rows={2}
                        value={sections.samdObservationLines[lineIdx]}
                        onChange={(e) =>
                          onUpdateSections((prev) => {
                            const nextLines: [string, string, string, string, string] = [
                              ...prev.samdObservationLines,
                            ] as [string, string, string, string, string];
                            nextLines[lineIdx] = e.target.value;
                            return { ...prev, samdObservationLines: nextLines };
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900">10. Brief Particulars of the Client (01–21)</div>
                  <div className="space-y-1.5">
                    {sections.briefParticulars.map((row, idx) => (
                      <div key={row.sl} className="grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-5 text-[11px] font-medium text-slate-700 truncate">
                          {row.sl}. {row.particular}
                        </span>
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) =>
                            onUpdateSections((prev) => {
                              const next = [...prev.briefParticulars];
                              next[idx] = { ...next[idx], value: e.target.value };
                              return { ...prev, briefParticulars: next };
                            })
                          }
                          className="col-span-7 px-2 py-1 rounded border border-slate-300 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
