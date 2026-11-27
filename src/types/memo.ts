export type DocumentCategory =
  | 'branch_proposal'
  | 'outstanding'
  | 'party_performance'
  | 'overdue'
  | 'account_statement'
  | 'cib_report'
  | 'cost_of_fund';

export type MemoType = 'ic_memo' | 'mec_memo' | 'board_memo' | 'sanction';

export interface CategoryMeta {
  id: DocumentCategory;
  label: string;
  shortLabel: string;
  description: string;
  acceptedExtensions: string[];
}

export interface UploadedDocumentItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  detectedCategory: DocumentCategory | null;
  classificationConfidence: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  method: 'deterministic' | 'ai_ocr' | 'mixed' | 'pending';
  errorMessage?: string;
  extractedCount: number;
  summaryText?: string;
  processedAt?: string;
}

export interface PlaceholderField {
  id: string;
  key: string;
  label: string;
  category: DocumentCategory | 'manual' | 'calculated' | 'branch_proposal';
  valueType: 'text' | 'currency_million' | 'date';
  rawValue: string;
  rawUnit: 'BDT' | 'Million BDT' | 'Text' | 'Date';
  millionValue: number | null;
  displayValue: string;
  sourceDocId?: string;
  sourceFileName?: string;
  sourceLabel: string;
  isEdited: boolean;
  isMissing: boolean;
  hasConflict: boolean;
  conflictDetails?: string;
}

export interface ExtractionConflict {
  placeholderKey: string;
  label: string;
  candidates: Array<{
    value: string;
    sourceFileName: string;
    category: DocumentCategory;
  }>;
  resolvedValue?: string;
}

export interface ManualInputsData {
  proposalDate: string;
  waiverAmount: string;
  settlementAmount: string;
  settlementPeriod: string;
  waiverRecommendedClientBranch: string;
  waiverRecommendedHo: string;
}

export interface CibStatusRow {
  status: string;
  siblBorrower: string;
  siblGuarantor: string;
  otherBorrower: string;
  otherGuarantor: string;
  remarks: string;
}

export interface LegalActionRow {
  sl: string;
  typeOfCase: string;
  caseNo: string;
  filingDate: string;
  amount: string;
  previousDate: string;
  nextDate: string;
  presentStatus: string;
}

export interface AuditStatusRow {
  sl: string;
  authority: string;
  lastInspectionDate: string;
  objectionStatus: string;
  objections: string;
  branchReply: string;
}

export interface HoSanctionRow {
  sl: string;
  referenceNo: string;
  date: string;
  limit: string;
  remarks: string;
}

export interface ClientParticularRow {
  sl: string;
  particular: string;
  value: string;
}

export interface ProprietorRow {
  name: string;
  age: string;
  education: string;
  designation: string;
  sharePercent: string;
  experience: string;
}

export interface DirectorOtherBankRow {
  name: string;
  bankName: string;
  designation: string;
  sharePercent: string;
  numberOfShares: string;
}

export interface FinancialsRow {
  year: string;
  grossSales: string;
  grossProfit: string;
  netProfit: string;
  totalAsset: string;
  totalLiabilities: string;
  netWorth: string;
}

export interface CollateralValuationRow {
  schedule: string;
  branchOriginalMv: string;
  branchOriginalFsv: string;
  surveyorOriginalMv: string;
  surveyorOriginalFsv: string;
  presentNote: string;
}

export interface SisterConcernLiabilityRow {
  sl: string;
  concernName: string;
  bankName: string;
  natureOfFacility: string;
  limit: string;
  outstanding: string;
  overdue: string;
  expiryDate: string;
  clStatus: string;
}

export interface IcMemoSectionsData {
  justificationPoint1: string;
  justificationPoint2: string;
  justificationPoint3: string;
  previousBoardDecision: string;
  natureOfBusiness: string;
  sisterConcernsSibAsOn: string;
  sisterConcernsSibRows: SisterConcernLiabilityRow[];
  cibReportDate: string;
  cibRows: CibStatusRow[];
  cibRemarks: string;
  legalActionRows: LegalActionRow[];
  auditRows: AuditStatusRow[];
  primarySecurityStockNote: string;
  primarySecurityValue: string;
  collateralOwner: string;
  collateralDescription: string;
  collateralValuationRows: CollateralValuationRow[];
  collateralBranchDate: string;
  collateralSurveyorDate: string;
  sourceOfRepayment: string;
  hoSanctionRows: HoSanctionRow[];
  briefParticulars: ClientParticularRow[];
  proprietors: ProprietorRow[];
  directorOtherBankNote: string;
  directorOtherBanks: DirectorOtherBankRow[];
  financialsNote: string;
  financialsRows: FinancialsRow[];
  recommendationOfBranch: string;
  branchVisitReport: string;
  samdObservationLines: [string, string, string, string, string];
  memoNumber: string;
  scritinizedAt?: string;
}

export interface TemplateMetadata {
  memoType: MemoType;
  fileName: string;
  isDefaultStandard: boolean;
  uploadedAt: string;
  placeholders: Array<{
    key: string;
    context: string;
    occurrences: number;
  }>;
  detectedSections: string[];
  fileBase64: string;
}

export interface CalculationResult {
  breakupTotal32: {
    value: number | null;
    display: string;
    isMissing: boolean;
    missingInputs: string[];
    formulaText: string;
  };
  totalChargesProfitComp42: {
    value: number | null;
    display: string;
    isMissing: boolean;
    missingInputs: string[];
    formulaText: string;
  };
  maxWaiverConsideringCof44: {
    value: number | null;
    display: string;
    isMissing: boolean;
    missingInputs: string[];
    formulaText: string;
  };
}

export interface ExtractedDocumentPayload {
  fileName: string;
  detectedCategory: DocumentCategory;
  classificationConfidence: number;
  method: 'deterministic' | 'ai_ocr' | 'mixed';
  summaryText: string;
  fields: Record<
    string,
    {
      rawValue: string;
      rawUnit: 'BDT' | 'Million BDT' | 'Text' | 'Date';
      millionValue: number | null;
      displayValue: string;
      sourceLabel: string;
    }
  >;
}
