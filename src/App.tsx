import { UserCircle2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeveloperModal } from './components/DeveloperModal.tsx';
import { FutureMemoTab } from './components/FutureMemoTab.tsx';
import { IcMemoTab } from './components/IcMemoTab.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { ManualInputsTab } from './components/ManualInputsTab.tsx';
import type {
  DocumentCategory,
  ExtractedDocumentPayload,
  ExtractionConflict,
  IcMemoSectionsData,
  ManualInputsData,
  MemoType,
  PlaceholderField,
  TemplateMetadata,
  UploadedDocumentItem,
} from './types/memo.ts';
import {
  applyManualInputsAndCalculations,
  computeIcCalculations,
  createDefaultIcMemoSections,
  createDefaultManualInputs,
  createInitialPlaceholderFields,
  formatMillionBdt,
  parseNumericString,
} from './utils/calculations.ts';

type PrimaryTab = 'manual_inputs' | MemoType;

interface StoredDocRecord {
  item: UploadedDocumentItem;
  file: File;
  serverDocId?: string;
  extracted?: ExtractedDocumentPayload;
}

const SAMPLE_FILES: Array<{ url: string; fileName: string; category: DocumentCategory }> = [
  { url: '/assets/aistudio/Branch_Proposal_07ded1a7.pdf', fileName: 'Branch Proposal.pdf', category: 'branch_proposal' },
  { url: '/assets/aistudio/Outstanding_b677e647.pdf', fileName: 'Outstanding.pdf', category: 'outstanding' },
  { url: '/assets/aistudio/Party_Performance_9704bea0.pdf', fileName: 'Party Performance.pdf', category: 'party_performance' },
  { url: '/assets/aistudio/Overdue_66124da3.pdf', fileName: 'Overdue.pdf', category: 'overdue' },
  { url: '/assets/aistudio/Account_Statement_1841b416.pdf', fileName: 'Account Statement.pdf', category: 'account_statement' },
  { url: '/assets/aistudio/CIB_Report_a5c9d970.pdf', fileName: 'CIB Report.pdf', category: 'cib_report' },
  { url: '/assets/aistudio/Cost_of_Fund_c971688c.pdf', fileName: 'Cost of Fund.pdf', category: 'cost_of_fund' },
];

const CATEGORY_PRIORITY: Record<string, DocumentCategory[]> = {
  '#2#': ['account_statement', 'outstanding', 'branch_proposal'],
  '#3#': ['account_statement', 'overdue', 'branch_proposal'],
  '#69#': ['account_statement', 'outstanding'],
  '#5#': ['party_performance'],
  '#55#': ['party_performance'],
};

export default function App() {
  const [launched, setLaunched] = useState(false);
  const [activeTab, setActiveTab] = useState<PrimaryTab>('manual_inputs');
  const [developerModalOpen, setDeveloperModalOpen] = useState(false);

  const [docRecords, setDocRecords] = useState<StoredDocRecord[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [manualInputs, setManualInputs] = useState<ManualInputsData>(createDefaultManualInputs);
  const [fields, setFields] = useState<Record<string, PlaceholderField>>(() =>
    applyManualInputsAndCalculations(createInitialPlaceholderFields(), createDefaultManualInputs())
  );
  const [editedOverrides, setEditedOverrides] = useState<Record<string, string>>({});
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState<ExtractionConflict[]>([]);

  const [icSections, setIcSections] = useState<IcMemoSectionsData>(createDefaultIcMemoSections);
  const [isScrutinizing, setIsScrutinizing] = useState(false);
  const [scrutinyError, setScrutinyError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<Record<MemoType, TemplateMetadata | null>>({
    ic_memo: null,
    mec_memo: null,
    board_memo: null,
    sanction: null,
  });

  const [futureOverrides, setFutureOverrides] = useState<
    Record<Exclude<MemoType, 'ic_memo'>, Record<string, string>>
  >({
    mec_memo: {},
    board_memo: {},
    sanction: {},
  });

  const [docxPreviewBytes, setDocxPreviewBytes] = useState<Record<MemoType, ArrayBuffer | null>>({
    ic_memo: null,
    mec_memo: null,
    board_memo: null,
    sanction: null,
  });
  const [replacedCounts, setReplacedCounts] = useState<Record<MemoType, number | null>>({
    ic_memo: null,
    mec_memo: null,
    board_memo: null,
    sanction: null,
  });
  const [generatingMap, setGeneratingMap] = useState<Record<MemoType, boolean>>({
    ic_memo: false,
    mec_memo: false,
    board_memo: false,
    sanction: false,
  });
  const [docxErrorMap, setDocxErrorMap] = useState<Record<MemoType, string | null>>({
    ic_memo: null,
    mec_memo: null,
    board_memo: null,
    sanction: null,
  });

  const rebuildMergedFields = useCallback(
    (
      records: StoredDocRecord[],
      nextManual: ManualInputsData,
      overrides: Record<string, string>,
      resolutions: Record<string, string>
    ) => {
      const base = createInitialPlaceholderFields();
      const candidatesByTag = new Map<
        string,
        Array<{
          value: string;
          rawValue: string;
          rawUnit: 'BDT' | 'Million BDT' | 'Text' | 'Date';
          millionValue: number | null;
          sourceLabel: string;
          sourceFileName: string;
          category: DocumentCategory;
        }>
      >();

      for (const rec of records) {
        if (rec.item.status !== 'ready' || !rec.extracted) continue;
        for (const [key, val] of Object.entries(rec.extracted.fields)) {
          if (!base[key]) continue;
          const list = candidatesByTag.get(key) || [];
          list.push({
            value: val.displayValue,
            rawValue: val.rawValue,
            rawUnit: val.rawUnit,
            millionValue: val.millionValue,
            sourceLabel: val.sourceLabel,
            sourceFileName: rec.item.fileName,
            category: rec.item.category,
          });
          candidatesByTag.set(key, list);
        }
      }

      const detectedConflicts: ExtractionConflict[] = [];

      for (const [key, candidates] of candidatesByTag.entries()) {
        const distinctValues = Array.from(
          new Map(candidates.map((c) => [c.value.trim().toLowerCase(), c])).values()
        );

        let chosen = candidates[0];
        const prefOrder = CATEGORY_PRIORITY[key];
        if (prefOrder) {
          for (const cat of prefOrder) {
            const match = candidates.find((c) => c.category === cat);
            if (match) {
              chosen = match;
              break;
            }
          }
        }

        if (resolutions[key]) {
          const resolvedCand = candidates.find((c) => c.value === resolutions[key]);
          if (resolvedCand) chosen = resolvedCand;
        }

        const hasConflict = distinctValues.length > 1 && !resolutions[key];
        if (hasConflict) {
          detectedConflicts.push({
            placeholderKey: key,
            label: base[key].label,
            candidates: distinctValues.map((d) => ({
              value: d.value,
              sourceFileName: d.sourceFileName,
              category: d.category,
            })),
          });
        }

        base[key] = {
          ...base[key],
          rawValue: chosen.rawValue,
          rawUnit: chosen.rawUnit,
          millionValue: chosen.millionValue,
          displayValue: chosen.value,
          sourceLabel: chosen.sourceLabel,
          sourceFileName: chosen.sourceFileName,
          isMissing: !chosen.value,
          hasConflict,
        };
      }

      for (const [key, manualEdit] of Object.entries(overrides)) {
        if (!base[key] || base[key].category === 'manual' || base[key].category === 'calculated') {
          continue;
        }
        const trimmed = manualEdit.trim();
        if (base[key].valueType === 'currency_million') {
          const num = parseNumericString(trimmed);
          base[key] = {
            ...base[key],
            displayValue: trimmed === '' ? '' : num !== null ? formatMillionBdt(num) : trimmed,
            millionValue: num,
            sourceLabel: 'User Edit',
            isEdited: true,
            isMissing: trimmed === '' || num === null,
            hasConflict: false,
          };
        } else {
          base[key] = {
            ...base[key],
            displayValue: trimmed,
            millionValue: null,
            sourceLabel: 'User Edit',
            isEdited: true,
            isMissing: trimmed === '',
            hasConflict: false,
          };
        }
      }

      setConflicts(detectedConflicts);
      setFields(applyManualInputsAndCalculations(base, nextManual));
    },
    []
  );

  const loadDefaultTemplate = useCallback(async (memoType: MemoType) => {
    try {
      const res = await fetch(`/api/templates/default/${memoType}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load default template');
      setTemplates((prev) => ({
        ...prev,
        [memoType]: {
          memoType,
          fileName: json.fileName,
          isDefaultStandard: true,
          uploadedAt: new Date().toISOString(),
          placeholders: json.placeholders || [],
          detectedSections: json.detectedSections || [],
          fileBase64: json.fileBase64,
        },
      }));
      setDocxErrorMap((prev) => ({ ...prev, [memoType]: null }));
    } catch (err) {
      setDocxErrorMap((prev) => ({
        ...prev,
        [memoType]: err instanceof Error ? err.message : 'Unable to load default template.',
      }));
    }
  }, []);

  useEffect(() => {
    if (launched && !templates.ic_memo) {
      void loadDefaultTemplate('ic_memo');
    }
  }, [launched, templates.ic_memo, loadDefaultTemplate]);

  const handleUploadTemplate = async (memoType: MemoType, file: File) => {
    try {
      const formData = new FormData();
      formData.append('template', file);
      const res = await fetch('/api/templates/inspect', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Template upload failed');
      setTemplates((prev) => ({
        ...prev,
        [memoType]: {
          memoType,
          fileName: json.fileName,
          isDefaultStandard: false,
          uploadedAt: new Date().toISOString(),
          placeholders: json.placeholders || [],
          detectedSections: json.detectedSections || [],
          fileBase64: json.fileBase64,
        },
      }));
      setDocxErrorMap((prev) => ({ ...prev, [memoType]: null }));
    } catch (err) {
      setDocxErrorMap((prev) => ({
        ...prev,
        [memoType]: err instanceof Error ? err.message : 'Failed to inspect uploaded template.',
      }));
    }
  };

  const generateDocxForType = useCallback(
    async (memoType: MemoType) => {
      const tmpl = templates[memoType];
      if (!tmpl) return;

      setGeneratingMap((prev) => ({ ...prev, [memoType]: true }));
      setDocxErrorMap((prev) => ({ ...prev, [memoType]: null }));

      try {
        const placeholderMap: Record<string, string> = {};
        for (const [key, field] of Object.entries(fields)) {
          if (field.displayValue) {
            placeholderMap[key] = field.displayValue;
          }
        }
        if (memoType !== 'ic_memo') {
          for (const [key, val] of Object.entries(futureOverrides[memoType])) {
            if (val !== undefined) placeholderMap[key] = val;
          }
        }

        const res = await fetch('/api/templates/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateBase64: tmpl.fileBase64,
            placeholders: placeholderMap,
            sections: memoType === 'ic_memo' ? icSections : undefined,
            memoType,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to generate Word document.');
        }

        const countHeader = res.headers.get('X-Replaced-Count');
        const arrayBuf = await res.arrayBuffer();
        setDocxPreviewBytes((prev) => ({ ...prev, [memoType]: arrayBuf }));
        setReplacedCounts((prev) => ({
          ...prev,
          [memoType]: countHeader ? Number(countHeader) : null,
        }));
      } catch (err) {
        setDocxErrorMap((prev) => ({
          ...prev,
          [memoType]: err instanceof Error ? err.message : 'Document generation error.',
        }));
      } finally {
        setGeneratingMap((prev) => ({ ...prev, [memoType]: false }));
      }
    },
    [templates, fields, icSections, futureOverrides]
  );

  const regenTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!launched || activeTab === 'manual_inputs') return;
    const memoType = activeTab;
    if (!templates[memoType]) return;

    if (regenTimerRef.current) {
      window.clearTimeout(regenTimerRef.current);
    }
    regenTimerRef.current = window.setTimeout(() => {
      void generateDocxForType(memoType);
    }, 350);

    return () => {
      if (regenTimerRef.current) window.clearTimeout(regenTimerRef.current);
    };
  }, [launched, activeTab, templates, fields, icSections, futureOverrides, generateDocxForType]);

  const handleUploadFiles = async (
    files: File[],
    assignedCategory?: DocumentCategory,
    replaceDocId?: string
  ) => {
    if (files.length === 0) return;
    setIsBatchProcessing(true);

    const newEntries: Array<{ id: string; file: File; assignedCategory?: DocumentCategory }> = files.map(
      (file, idx) => ({
        id: replaceDocId && idx === 0 ? replaceDocId : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        assignedCategory,
      })
    );

    setDocRecords((prev) => {
      const next = [...prev];
      for (const entry of newEntries) {
        const placeholderItem: UploadedDocumentItem = {
          id: entry.id,
          fileName: entry.file.name,
          fileSize: entry.file.size,
          mimeType: entry.file.type || 'application/octet-stream',
          category: entry.assignedCategory || 'branch_proposal',
          detectedCategory: null,
          classificationConfidence: 0,
          status: 'processing',
          progress: 45,
          method: 'pending',
          extractedCount: 0,
        };
        const existingIdx = next.findIndex((r) => r.item.id === entry.id);
        if (existingIdx !== -1) {
          next[existingIdx] = { item: placeholderItem, file: entry.file };
        } else {
          next.push({ item: placeholderItem, file: entry.file });
        }
      }
      return next;
    });

    try {
      const formData = new FormData();
      const categoriesPayload: Array<DocumentCategory | undefined> = [];
      for (const entry of newEntries) {
        formData.append('files', entry.file);
        categoriesPayload.push(entry.assignedCategory);
      }
      formData.append('categories', JSON.stringify(categoriesPayload));

      const res = await fetch('/api/documents/extract', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Batch extraction failed.');

      const results = (json.results || []) as Array<
        ExtractedDocumentPayload & { serverDocId?: string }
      >;

      setDocRecords((prev) => {
        const updated = prev.map((rec) => {
          const matchIdx = newEntries.findIndex((e) => e.id === rec.item.id);
          if (matchIdx === -1) return rec;
          const payload = results[matchIdx];
          if (!payload) {
            return {
              ...rec,
              item: {
                ...rec.item,
                status: 'error' as const,
                progress: 100,
                errorMessage: 'No extraction output returned.',
              },
            };
          }
          const finalCategory = newEntries[matchIdx].assignedCategory || payload.detectedCategory;
          return {
            ...rec,
            serverDocId: payload.serverDocId,
            extracted: { ...payload, detectedCategory: finalCategory },
            item: {
              ...rec.item,
              category: finalCategory,
              detectedCategory: payload.detectedCategory,
              classificationConfidence: payload.classificationConfidence,
              status: 'ready' as const,
              progress: 100,
              method: payload.method,
              extractedCount: Object.keys(payload.fields || {}).length,
              summaryText: payload.summaryText,
              processedAt: new Date().toISOString(),
            },
          };
        });
        rebuildMergedFields(updated, manualInputs, editedOverrides, conflictResolutions);
        return updated;
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Upload processing failed.';
      setDocRecords((prev) =>
        prev.map((rec) =>
          newEntries.some((e) => e.id === rec.item.id)
            ? {
                ...rec,
                item: {
                  ...rec.item,
                  status: 'error',
                  progress: 100,
                  errorMessage: errMsg,
                },
              }
            : rec
        )
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleLoadSampleCase = async () => {
    setIsBatchProcessing(true);
    try {
      const fetchedFiles: Array<{ file: File; category: DocumentCategory }> = await Promise.all(
        SAMPLE_FILES.map(async (sample) => {
          const resp = await fetch(sample.url);
          if (!resp.ok) throw new Error(`Unable to fetch ${sample.fileName}`);
          const blob = await resp.blob();
          return {
            file: new File([blob], sample.fileName, { type: 'application/pdf' }),
            category: sample.category,
          };
        })
      );

      const sampleManual: ManualInputsData = {
        proposalDate: '17.11.2026',
        waiverAmount: '1.020',
        settlementAmount: '4.350',
        settlementPeriod: 'Within 31.12.2026',
        waiverRecommendedClientBranch: '1.020',
        waiverRecommendedHo: '1.020',
      };
      setManualInputs(sampleManual);

      setDocRecords([]);
      setEditedOverrides({});
      setConflictResolutions({});

      const formData = new FormData();
      const cats: DocumentCategory[] = [];
      fetchedFiles.forEach(({ file, category }) => {
        formData.append('files', file);
        cats.push(category);
      });
      formData.append('categories', JSON.stringify(cats));

      const extractRes = await fetch('/api/documents/extract', {
        method: 'POST',
        body: formData,
      });
      const json = await extractRes.json();
      if (!extractRes.ok) throw new Error(json.error || 'Sample case extraction failed.');

      const results = (json.results || []) as Array<
        ExtractedDocumentPayload & { serverDocId?: string }
      >;

      const nextRecords: StoredDocRecord[] = fetchedFiles.map(({ file, category }, idx) => {
        const payload = results[idx];
        return {
          file,
          serverDocId: payload?.serverDocId,
          extracted: payload ? { ...payload, detectedCategory: category } : undefined,
          item: {
            id: `sample-${idx}-${Date.now()}`,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            category,
            detectedCategory: payload?.detectedCategory || category,
            classificationConfidence: payload?.classificationConfidence || 0.99,
            status: payload ? 'ready' : 'error',
            progress: 100,
            method: payload?.method || 'deterministic',
            extractedCount: payload ? Object.keys(payload.fields || {}).length : 0,
            summaryText: payload?.summaryText,
            processedAt: new Date().toISOString(),
          },
        };
      });

      setDocRecords(nextRecords);
      rebuildMergedFields(nextRecords, sampleManual, {}, {});
    } catch (err) {
      setScrutinyError(err instanceof Error ? err.message : 'Failed to load sample case.');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleChangeDocCategory = async (docId: string, category: DocumentCategory) => {
    const target = docRecords.find((r) => r.item.id === docId);
    if (!target) return;
    await handleUploadFiles([target.file], category, docId);
  };

  const handleReprocessDoc = async (docId: string) => {
    const target = docRecords.find((r) => r.item.id === docId);
    if (!target) return;
    await handleUploadFiles([target.file], target.item.category, docId);
  };

  const handleRemoveDoc = (docId: string) => {
    setDocRecords((prev) => {
      const next = prev.filter((r) => r.item.id !== docId);
      rebuildMergedFields(next, manualInputs, editedOverrides, conflictResolutions);
      return next;
    });
  };

  const handleManualInputChange = (key: keyof ManualInputsData, value: string) => {
    const nextManual = { ...manualInputs, [key]: value };
    setManualInputs(nextManual);
    setFields((prev) => applyManualInputsAndCalculations(prev, nextManual));
  };

  const handleEditPlaceholderValue = (placeholderKey: string, newDisplayValue: string) => {
    if (placeholderKey === '#1#') return handleManualInputChange('proposalDate', newDisplayValue);
    if (placeholderKey === '#4#') return handleManualInputChange('waiverAmount', newDisplayValue);
    if (placeholderKey === '#27#') return handleManualInputChange('settlementAmount', newDisplayValue);
    if (placeholderKey === '#28#') return handleManualInputChange('settlementPeriod', newDisplayValue);
    if (placeholderKey === '#45#')
      return handleManualInputChange('waiverRecommendedClientBranch', newDisplayValue);
    if (placeholderKey === '#47#') return handleManualInputChange('waiverRecommendedHo', newDisplayValue);

    const nextOverrides = { ...editedOverrides, [placeholderKey]: newDisplayValue };
    setEditedOverrides(nextOverrides);

    setFields((prev) => {
      const target = prev[placeholderKey];
      if (!target || target.category === 'calculated') return prev;
      const trimmed = newDisplayValue.trim();
      const num = target.valueType === 'currency_million' ? parseNumericString(trimmed) : null;
      const updated = {
        ...prev,
        [placeholderKey]: {
          ...target,
          displayValue: newDisplayValue,
          millionValue: num,
          sourceLabel: 'User Edit',
          isEdited: true,
          isMissing: trimmed === '',
          hasConflict: false,
        },
      };
      return applyManualInputsAndCalculations(updated, manualInputs);
    });
  };

  const handleResolveConflict = (placeholderKey: string, chosenValue: string) => {
    const nextRes = { ...conflictResolutions, [placeholderKey]: chosenValue };
    setConflictResolutions(nextRes);
    rebuildMergedFields(docRecords, manualInputs, editedOverrides, nextRes);
  };

  const handleScrutinizeWithAi = async () => {
    const bpDoc = docRecords.find(
      (r) => r.item.category === 'branch_proposal' && r.item.status === 'ready'
    );
    if (!bpDoc) {
      setScrutinyError('Please upload a Branch Proposal document in Manual Inputs first.');
      return;
    }

    setIsScrutinizing(true);
    setScrutinyError(null);

    try {
      const cibDoc = docRecords.find(
        (r) => r.item.category === 'cib_report' && r.item.status === 'ready'
      );
      const currentMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v.displayValue) currentMap[k] = `${v.label}: ${v.displayValue}`;
      }

      const formData = new FormData();
      formData.append('branchProposal', bpDoc.file);
      if (bpDoc.serverDocId) formData.append('branchProposalDocId', bpDoc.serverDocId);
      if (cibDoc?.serverDocId) formData.append('cibDocId', cibDoc.serverDocId);
      if (cibDoc?.extracted?.summaryText) {
        formData.append('cibSummaryText', cibDoc.extracted.summaryText);
      }
      formData.append('currentPlaceholders', JSON.stringify(currentMap));

      const res = await fetch('/api/ic-memo/scrutinize', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'AI scrutiny failed.');

      if (json.sections) {
        setIcSections((prev) => ({
          ...json.sections,
          memoNumber: prev.memoNumber || json.sections.memoNumber || '',
        }));
      }
    } catch (err) {
      setScrutinyError(err instanceof Error ? err.message : 'AI scrutiny failed.');
    } finally {
      setIsScrutinizing(false);
    }
  };

  const calculations = useMemo(() => computeIcCalculations(fields), [fields]);

  if (!launched) {
    return <LandingPage onLaunch={() => setLaunched(true)} />;
  }

  const tabs: Array<{ id: PrimaryTab; label: string }> = [
    { id: 'manual_inputs', label: 'Manual Inputs' },
    { id: 'ic_memo', label: 'IC Memo' },
    { id: 'mec_memo', label: 'MEC Memo' },
    { id: 'board_memo', label: 'Board Memo' },
    { id: 'sanction', label: 'Sanction' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-white flex items-center justify-center font-heading font-bold text-xs">
              ME
            </div>
            <div className="leading-tight">
              <div className="font-heading font-bold text-sm sm:text-base text-slate-950 whitespace-nowrap">
                Memo Engine by Tuhin
              </div>
              <div className="hidden md:block text-[11px] text-slate-500 whitespace-nowrap">
                Sammilito Islami Bank PLC · SAMD
              </div>
            </div>
          </div>

          <nav
            aria-label="Primary Workspaces"
            className="flex items-center gap-1 overflow-x-auto no-scrollbar"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'manual_inputs' && !templates[tab.id]) {
                      void loadDefaultTemplate(tab.id);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-900 text-white'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setDeveloperModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserCircle2 className="w-4 h-4 text-emerald-800" />
            <span className="hidden sm:inline">Developer Profile</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'manual_inputs' && (
          <ManualInputsTab
            documents={docRecords.map((r) => r.item)}
            fields={fields}
            manualInputs={manualInputs}
            calculations={calculations}
            conflicts={conflicts}
            isBatchProcessing={isBatchProcessing}
            onUploadFiles={handleUploadFiles}
            onLoadSampleCase={handleLoadSampleCase}
            onChangeDocCategory={handleChangeDocCategory}
            onReprocessDoc={handleReprocessDoc}
            onRemoveDoc={handleRemoveDoc}
            onManualInputChange={handleManualInputChange}
            onEditPlaceholderValue={handleEditPlaceholderValue}
            onResolveConflict={handleResolveConflict}
          />
        )}

        {activeTab === 'ic_memo' && (
          <IcMemoTab
            template={templates.ic_memo}
            fields={fields}
            sections={icSections}
            documents={docRecords.map((r) => r.item)}
            docxBytes={docxPreviewBytes.ic_memo}
            replacedCount={replacedCounts.ic_memo}
            isGeneratingDocx={generatingMap.ic_memo}
            isScrutinizing={isScrutinizing}
            scrutinyError={scrutinyError}
            docxError={docxErrorMap.ic_memo}
            onUploadTemplate={(file) => void handleUploadTemplate('ic_memo', file)}
            onLoadDefaultTemplate={() => void loadDefaultTemplate('ic_memo')}
            onScrutinizeWithAi={handleScrutinizeWithAi}
            onUpdateSections={setIcSections}
            onEditPlaceholderValue={handleEditPlaceholderValue}
            onRegenerateDocx={() => void generateDocxForType('ic_memo')}
          />
        )}

        {activeTab === 'mec_memo' && (
          <FutureMemoTab
            memoType="mec_memo"
            title="MEC Memo"
            subtitle="Management Executive Committee (MEC) Memorandum"
            template={templates.mec_memo}
            fields={fields}
            localOverrides={futureOverrides.mec_memo}
            docxBytes={docxPreviewBytes.mec_memo}
            replacedCount={replacedCounts.mec_memo}
            isGeneratingDocx={generatingMap.mec_memo}
            docxError={docxErrorMap.mec_memo}
            onUploadTemplate={(file) => void handleUploadTemplate('mec_memo', file)}
            onLoadStarterTemplate={() => void loadDefaultTemplate('mec_memo')}
            onOverrideChange={(key, val) =>
              setFutureOverrides((prev) => ({
                ...prev,
                mec_memo: { ...prev.mec_memo, [key]: val },
              }))
            }
            onRegenerateDocx={() => void generateDocxForType('mec_memo')}
          />
        )}

        {activeTab === 'board_memo' && (
          <FutureMemoTab
            memoType="board_memo"
            title="Board Memo"
            subtitle="Board of Directors Memorandum"
            template={templates.board_memo}
            fields={fields}
            localOverrides={futureOverrides.board_memo}
            docxBytes={docxPreviewBytes.board_memo}
            replacedCount={replacedCounts.board_memo}
            isGeneratingDocx={generatingMap.board_memo}
            docxError={docxErrorMap.board_memo}
            onUploadTemplate={(file) => void handleUploadTemplate('board_memo', file)}
            onLoadStarterTemplate={() => void loadDefaultTemplate('board_memo')}
            onOverrideChange={(key, val) =>
              setFutureOverrides((prev) => ({
                ...prev,
                board_memo: { ...prev.board_memo, [key]: val },
              }))
            }
            onRegenerateDocx={() => void generateDocxForType('board_memo')}
          />
        )}

        {activeTab === 'sanction' && (
          <FutureMemoTab
            memoType="sanction"
            title="Sanction"
            subtitle="Final Sanction Advice Workspace"
            template={templates.sanction}
            fields={fields}
            localOverrides={futureOverrides.sanction}
            docxBytes={docxPreviewBytes.sanction}
            replacedCount={replacedCounts.sanction}
            isGeneratingDocx={generatingMap.sanction}
            docxError={docxErrorMap.sanction}
            onUploadTemplate={(file) => void handleUploadTemplate('sanction', file)}
            onLoadStarterTemplate={() => void loadDefaultTemplate('sanction')}
            onOverrideChange={(key, val) =>
              setFutureOverrides((prev) => ({
                ...prev,
                sanction: { ...prev.sanction, [key]: val },
              }))
            }
            onRegenerateDocx={() => void generateDocxForType('sanction')}
          />
        )}
      </main>

      <DeveloperModal open={developerModalOpen} onClose={() => setDeveloperModalOpen(false)} />
    </div>
  );
}
