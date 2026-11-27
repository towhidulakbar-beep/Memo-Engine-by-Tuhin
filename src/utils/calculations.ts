import type {
  CalculationResult,
  CategoryMeta,
  IcMemoSectionsData,
  ManualInputsData,
  PlaceholderField,
} from '../types/memo.ts';

export const DOCUMENT_CATEGORIES: CategoryMeta[] = [
  {
    id: 'branch_proposal',
    label: 'Branch Proposal',
    shortLabel: 'Proposal',
    description: 'Facility proposal, collateral details, audit status, legal action & branch recommendation.',
    acceptedExtensions: ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt'],
  },
  {
    id: 'outstanding',
    label: 'Outstanding',
    shortLabel: 'Outstanding',
    description: 'Customer Outstanding Report with Grand Total principal, charges, profit & compensation.',
    acceptedExtensions: ['.pdf', '.xlsx', '.xls', '.docx', '.csv'],
  },
  {
    id: 'party_performance',
    label: 'Party Performance',
    shortLabel: 'Performance',
    description: 'Performance report containing product mode, recovery amount & print date.',
    acceptedExtensions: ['.pdf', '.xlsx', '.xls', '.docx', '.csv'],
  },
  {
    id: 'overdue',
    label: 'Overdue',
    shortLabel: 'Overdue',
    description: 'Statement of Overdue (Non-Installment / Installment) with Grand Total overdue.',
    acceptedExtensions: ['.pdf', '.xlsx', '.xls', '.docx', '.csv'],
  },
  {
    id: 'account_statement',
    label: 'Account Statement',
    shortLabel: 'A/C Statement',
    description: 'Current / AWCD / MSD statement with A/C Name, Branch, CIS ID, A/C No. & closing balance.',
    acceptedExtensions: ['.pdf', '.xlsx', '.xls', '.docx', '.csv'],
  },
  {
    id: 'cib_report',
    label: 'CIB Report',
    shortLabel: 'CIB Report',
    description: 'Bangladesh Bank CIB report for funded/non-funded borrower and guarantor status.',
    acceptedExtensions: ['.pdf', '.xlsx', '.xls', '.docx'],
  },
  {
    id: 'cost_of_fund',
    label: 'Cost of Fund',
    shortLabel: 'Cost of Fund',
    description: 'Cost of Fund schedule showing Surplus/Deficit of realization over cost of fund.',
    acceptedExtensions: ['.pdf', '.xlsx', '.xls', '.docx', '.csv'],
  },
];

export const PLACEHOLDER_CATALOG: Array<{
  key: string;
  label: string;
  category: PlaceholderField['category'];
  valueType: PlaceholderField['valueType'];
  defaultUnit: PlaceholderField['rawUnit'];
}> = [
  { key: '#1#', label: 'Proposal / Memo Date', category: 'manual', valueType: 'date', defaultUnit: 'Date' },
  { key: '#2#', label: 'Client / Account Name', category: 'account_statement', valueType: 'text', defaultUnit: 'Text' },
  { key: '#3#', label: 'Branch Name', category: 'account_statement', valueType: 'text', defaultUnit: 'Text' },
  { key: '#4#', label: 'Proposed Waiver Amount', category: 'manual', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#5#', label: 'Mode / Product Name (Settlement Table)', category: 'party_performance', valueType: 'text', defaultUnit: 'Text' },
  { key: '#6#', label: 'Original Limit', category: 'branch_proposal', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#7#', label: 'Principal Outstanding (Princ Out)', category: 'outstanding', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#8#', label: 'Charges (Legal & Others)', category: 'outstanding', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#10#', label: 'Charged Profit (Profit Out)', category: 'outstanding', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#11#', label: 'Compensation', category: 'outstanding', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#12#', label: 'Uncharged Compensation (Unapplied Pro)', category: 'outstanding', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#25#', label: 'Grand Total Outstanding (NET Out)', category: 'outstanding', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#27#', label: 'Settlement Amount', category: 'manual', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#28#', label: 'Settlement Period / Deadline', category: 'manual', valueType: 'text', defaultUnit: 'Text' },
  { key: '#31#', label: 'Cost of Fund (Surplus/Deficit)', category: 'cost_of_fund', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#32#', label: 'Breakup Total (Principal + Charges + COF)', category: 'calculated', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#33#', label: 'Collateral Security Market Value (MV)', category: 'branch_proposal', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#34#', label: 'Collateral Security Forced Sale Value (FSV)', category: 'branch_proposal', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#35#', label: 'Down Payment / Account Balance', category: 'account_statement', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#36#', label: 'Account Number (AWCD/MSD)', category: 'account_statement', valueType: 'text', defaultUnit: 'Text' },
  { key: '#42#', label: 'Total [Profit + Charges + Comp. + Uncharged Comp.]', category: 'calculated', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#44#', label: 'Maximum Waiver Considering COF [a - b]', category: 'calculated', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#45#', label: 'Waiver Recommended by Client & Branch', category: 'manual', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#47#', label: 'Waiver Recommended by SAMD, HO', category: 'manual', valueType: 'currency_million', defaultUnit: 'Million BDT' },
  { key: '#55#', label: 'Mode of Investment (Liability Table)', category: 'party_performance', valueType: 'text', defaultUnit: 'Text' },
  { key: '#56#', label: 'Sanction / Limit Validity Reference', category: 'branch_proposal', valueType: 'text', defaultUnit: 'Text' },
  { key: '#58#', label: 'Facility Validity / Expiry Date', category: 'branch_proposal', valueType: 'text', defaultUnit: 'Date' },
  { key: '#59#', label: 'Total Overdue Amount', category: 'overdue', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#60#', label: 'Recovery in Existing Deals', category: 'party_performance', valueType: 'currency_million', defaultUnit: 'BDT' },
  { key: '#64#', label: 'Branch Proposal Reference No.', category: 'branch_proposal', valueType: 'text', defaultUnit: 'Text' },
  { key: '#65#', label: 'Branch Proposal Date', category: 'branch_proposal', valueType: 'date', defaultUnit: 'Date' },
  { key: '#68#', label: 'Liability / Report Cut-off Date (Print Date)', category: 'party_performance', valueType: 'date', defaultUnit: 'Date' },
  { key: '#69#', label: 'Customer ID (CIS)', category: 'account_statement', valueType: 'text', defaultUnit: 'Text' },
];

export function parseNumericString(input: string | number | null | undefined): number | null {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'nil' || trimmed.toLowerCase() === 'n/a') {
    return null;
  }
  let negative = false;
  let cleaned = trimmed;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }
  cleaned = cleaned.replace(/,/g, '').replace(/tk\.?/gi, '').replace(/bdt/gi, '').replace(/million/gi, '').trim();
  const match = cleaned.match(/^[-+]?\d*\.?\d+/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
}

export function formatMillionBdt(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(3);
}

export function bdtToMillion(bdtAmount: number | null): number | null {
  if (bdtAmount === null || !Number.isFinite(bdtAmount)) return null;
  return bdtAmount / 1_000_000;
}

export function createInitialPlaceholderFields(): Record<string, PlaceholderField> {
  const fields: Record<string, PlaceholderField> = {};
  for (const item of PLACEHOLDER_CATALOG) {
    fields[item.key] = {
      id: item.key,
      key: item.key,
      label: item.label,
      category: item.category,
      valueType: item.valueType,
      rawValue: '',
      rawUnit: item.defaultUnit,
      millionValue: null,
      displayValue: '',
      sourceLabel: item.category === 'manual' ? 'Manual Entry' : item.category === 'calculated' ? 'System Formula' : 'Awaiting Upload',
      isEdited: false,
      isMissing: item.category !== 'calculated',
      hasConflict: false,
    };
  }
  return fields;
}

export function createDefaultManualInputs(): ManualInputsData {
  return {
    proposalDate: '',
    waiverAmount: '',
    settlementAmount: '',
    settlementPeriod: '',
    waiverRecommendedClientBranch: '',
    waiverRecommendedHo: '',
  };
}

export function createDefaultIcMemoSections(): IcMemoSectionsData {
  return {
    justificationPoint1: '',
    justificationPoint2: '',
    justificationPoint3: '',
    previousBoardDecision: 'Nil',
    natureOfBusiness: '',
    sisterConcernsSibAsOn: '',
    sisterConcernsSibRows: [
      {
        sl: '1',
        concernName: 'N/A',
        bankName: '-',
        natureOfFacility: '-',
        limit: '-',
        outstanding: '-',
        overdue: '-',
        expiryDate: '-',
        clStatus: '-',
      },
    ],
    cibReportDate: '',
    cibRows: [
      { status: 'STD', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'SMA', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'SS', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'DF', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'BL', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'Willful Default (WD)', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'Write-Off', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'Non-Funded', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'Stay Order', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
      { status: 'TOTAL', siblBorrower: '-', siblGuarantor: '-', otherBorrower: '-', otherGuarantor: '-', remarks: '' },
    ],
    cibRemarks: '',
    legalActionRows: [],
    auditRows: [
      { sl: '01', authority: 'IC & CD', lastInspectionDate: '', objectionStatus: 'No', objections: '', branchReply: '' },
      { sl: '02', authority: 'DBI, Bangladesh Bank', lastInspectionDate: 'Not done', objectionStatus: 'No', objections: '', branchReply: '' },
      { sl: '03', authority: 'DOS, Bangladesh Bank', lastInspectionDate: 'Not done', objectionStatus: 'No', objections: '', branchReply: '' },
      { sl: '04', authority: 'BFIU, Bangladesh Bank', lastInspectionDate: 'Not done', objectionStatus: 'No', objections: '', branchReply: '' },
      { sl: '05', authority: 'BRD, Bangladesh Bank', lastInspectionDate: 'Not done', objectionStatus: 'No', objections: '', branchReply: '' },
      { sl: '06', authority: 'ACC(Anti-Corruption Commission)', lastInspectionDate: 'Not done', objectionStatus: 'No', objections: '', branchReply: '' },
    ],
    primarySecurityStockNote: '',
    primarySecurityValue: 'Nil',
    collateralOwner: '',
    collateralDescription: '',
    collateralValuationRows: [],
    collateralBranchDate: '',
    collateralSurveyorDate: '',
    sourceOfRepayment: '',
    hoSanctionRows: [],
    briefParticulars: [
      { sl: '01', particular: 'Name of the Client', value: '' },
      { sl: '02', particular: 'Unique Customer ID', value: '' },
      { sl: '03', particular: 'AWCD/MSD Account with opening date', value: '' },
      { sl: '04', particular: 'Business Type/Nature', value: '' },
      { sl: '05', particular: 'Business Management Type', value: '' },
      { sl: '06', particular: 'Client Type', value: '' },
      { sl: '07', particular: 'Key Person with Phone No. & Address', value: '' },
      { sl: '08', particular: 'Office/Business Address & Factory Address', value: '' },
      { sl: '09', particular: 'Purpose of Investment', value: '' },
      { sl: '10', particular: 'Limit of Investment', value: '' },
      { sl: '11', particular: 'Mode of Investment', value: '' },
      { sl: '12', particular: 'Last Visit Date', value: '' },
      { sl: '13', particular: 'Stock Position', value: '' },
      { sl: '14', particular: 'Fixed Asset', value: '' },
      { sl: '15', particular: 'Business Net Worth', value: '' },
      { sl: '16', particular: 'Insurance Coverage', value: '' },
      { sl: '17', particular: 'Trade License & Validity', value: '' },
      { sl: '18', particular: 'Other Regulatory Documents', value: '' },
      { sl: '19', particular: 'Date of Original Investment', value: '' },
      { sl: '20', particular: '1st Disbursement Manager', value: '' },
      { sl: '21', particular: 'First Date of Classification with Status', value: '' },
    ],
    proprietors: [],
    directorOtherBankNote: 'N/A',
    directorOtherBanks: [],
    financialsNote: 'Nil',
    financialsRows: [],
    recommendationOfBranch: '',
    branchVisitReport: '',
    samdObservationLines: ['', '', '', '', ''],
    memoNumber: '',
  };
}

export function getNumericMillion(field: PlaceholderField | undefined): number | null {
  if (!field) return null;
  if (field.millionValue !== null && Number.isFinite(field.millionValue)) {
    return field.millionValue;
  }
  const parsed = parseNumericString(field.displayValue);
  return parsed;
}

export function computeIcCalculations(fields: Record<string, PlaceholderField>): CalculationResult {
  const f7 = getNumericMillion(fields['#7#']);
  const f8 = getNumericMillion(fields['#8#']);
  const f10 = getNumericMillion(fields['#10#']);
  const f11 = getNumericMillion(fields['#11#']);
  const f12 = getNumericMillion(fields['#12#']);
  const f31 = getNumericMillion(fields['#31#']);

  const missing32: string[] = [];
  if (f7 === null) missing32.push('#7# Principal');
  if (f8 === null) missing32.push('#8# Charges');
  if (f31 === null) missing32.push('#31# Cost of Fund');

  const val32 = missing32.length === 0 ? (f7 as number) + (f8 as number) + (f31 as number) : null;

  const missing42: string[] = [];
  if (f10 === null) missing42.push('#10# Charged Profit');
  if (f8 === null) missing42.push('#8# Charges');
  if (f11 === null) missing42.push('#11# Compensation');
  if (f12 === null) missing42.push('#12# Uncharged Compensation');

  const val42 =
    missing42.length === 0 ? (f10 as number) + (f8 as number) + (f11 as number) + (f12 as number) : null;

  const missing44: string[] = [...missing42];
  if (f31 === null && !missing44.includes('#31# Cost of Fund')) {
    missing44.push('#31# Cost of Fund');
  }

  const val44 = val42 !== null && f31 !== null ? val42 - f31 : null;

  return {
    breakupTotal32: {
      value: val32,
      display: val32 !== null ? formatMillionBdt(val32) : '',
      isMissing: missing32.length > 0,
      missingInputs: missing32,
      formulaText: '#7# + #8# + #31#',
    },
    totalChargesProfitComp42: {
      value: val42,
      display: val42 !== null ? formatMillionBdt(val42) : '',
      isMissing: missing42.length > 0,
      missingInputs: missing42,
      formulaText: '#10# + #8# + #11# + #12#',
    },
    maxWaiverConsideringCof44: {
      value: val44,
      display: val44 !== null ? formatMillionBdt(val44) : '',
      isMissing: missing44.length > 0,
      missingInputs: missing44,
      formulaText: '#42# - #31#',
    },
  };
}

export function applyManualInputsAndCalculations(
  prevFields: Record<string, PlaceholderField>,
  manual: ManualInputsData
): Record<string, PlaceholderField> {
  const next: Record<string, PlaceholderField> = { ...prevFields };

  const setManualField = (key: string, rawInput: string, isNumeric: boolean) => {
    const existing = next[key];
    if (!existing) return;
    const trimmed = rawInput.trim();
    if (!trimmed) {
      next[key] = {
        ...existing,
        rawValue: '',
        millionValue: null,
        displayValue: '',
        sourceLabel: 'Manual Entry',
        isMissing: true,
        isEdited: true,
      };
      return;
    }
    if (isNumeric) {
      const parsed = parseNumericString(trimmed);
      next[key] = {
        ...existing,
        rawValue: trimmed,
        rawUnit: 'Million BDT',
        millionValue: parsed,
        displayValue: parsed !== null ? formatMillionBdt(parsed) : trimmed,
        sourceLabel: 'Manual Entry',
        isMissing: parsed === null,
        isEdited: true,
      };
    } else {
      next[key] = {
        ...existing,
        rawValue: trimmed,
        rawUnit: existing.valueType === 'date' ? 'Date' : 'Text',
        millionValue: null,
        displayValue: trimmed,
        sourceLabel: 'Manual Entry',
        isMissing: false,
        isEdited: true,
      };
    }
  };

  setManualField('#1#', manual.proposalDate, false);
  setManualField('#4#', manual.waiverAmount, true);
  setManualField('#27#', manual.settlementAmount, true);
  setManualField('#28#', manual.settlementPeriod, false);
  setManualField('#45#', manual.waiverRecommendedClientBranch, true);
  setManualField('#47#', manual.waiverRecommendedHo, true);

  const calc = computeIcCalculations(next);

  next['#32#'] = {
    ...next['#32#'],
    rawValue: calc.breakupTotal32.value !== null ? String(calc.breakupTotal32.value) : '',
    millionValue: calc.breakupTotal32.value,
    displayValue: calc.breakupTotal32.display,
    sourceLabel: 'Formula (#7# + #8# + #31#)',
    isMissing: calc.breakupTotal32.isMissing,
  };

  next['#42#'] = {
    ...next['#42#'],
    rawValue: calc.totalChargesProfitComp42.value !== null ? String(calc.totalChargesProfitComp42.value) : '',
    millionValue: calc.totalChargesProfitComp42.value,
    displayValue: calc.totalChargesProfitComp42.display,
    sourceLabel: 'Formula (#10# + #8# + #11# + #12#)',
    isMissing: calc.totalChargesProfitComp42.isMissing,
  };

  next['#44#'] = {
    ...next['#44#'],
    rawValue: calc.maxWaiverConsideringCof44.value !== null ? String(calc.maxWaiverConsideringCof44.value) : '',
    millionValue: calc.maxWaiverConsideringCof44.value,
    displayValue: calc.maxWaiverConsideringCof44.display,
    sourceLabel: 'Formula (#42# - #31#)',
    isMissing: calc.maxWaiverConsideringCof44.isMissing,
  };

  return next;
}
