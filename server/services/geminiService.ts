import { GoogleGenAI, Type } from '@google/genai';
import type { DocumentCategory, ExtractedDocumentPayload, IcMemoSectionsData } from '../../src/types/memo.ts';
import { bdtToMillion, formatMillionBdt, parseNumericString } from '../../src/utils/calculations.ts';

const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getSafeInlineMimeType(mimeType: string, fileName: string): string {
  const lower = fileName.toLowerCase();
  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) return 'application/pdf';
  if (mimeType.startsWith('image/')) return mimeType;
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'text/plain';
}

export async function extractDocumentWithGemini(params: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  textPreview: string;
  hintedCategory?: DocumentCategory;
}): Promise<Partial<ExtractedDocumentPayload>> {
  const ai = getAiClient();
  const safeMime = getSafeInlineMimeType(params.mimeType, params.fileName);

  const prompt = `You are a senior commercial banking credit analyst at Sammilito Islami Bank PLC (SAMD).
Analyze the uploaded banking document "${params.fileName}"${params.hintedCategory ? ` (user assigned category: ${params.hintedCategory})` : ''}.

Classify it into exactly one category:
- branch_proposal
- outstanding
- party_performance
- overdue
- account_statement
- cib_report
- cost_of_fund

Extract ONLY values that explicitly exist in this document. Do NOT invent or guess missing values.
For BDT amounts (rawUnit: "BDT"), preserve the raw numeric string without converting units.
For Million BDT amounts already stated in millions (rawUnit: "Million BDT"), preserve the million value.
For Cost of Fund (#31#), preserve negative sign if it is a negative/bracketed deficit.
For Account Statement (#3#), extract only the branch city/name (e.g. "KUMIRA BRANCH" -> "Kumira").

Possible keys to extract if present in this document:
- #2# (A/C Name / Client Name)
- #3# (Branch Name)
- #5# (Mode / Product Name)
- #6# (Original Limit in Million BDT)
- #7# (Principal Outstanding in BDT)
- #8# (Charges in BDT)
- #10# (Charged Profit in BDT)
- #11# (Compensation in BDT)
- #12# (Unapplied Profit / Uncharged Compensation in BDT)
- #25# (NET Outstanding Grand Total in BDT)
- #31# (Surplus/Deficit of realization over cost of fund in BDT)
- #33# (Collateral Security MV in Million BDT)
- #34# (Collateral Security FSV in Million BDT)
- #35# (Last Balance in Account Statement in BDT)
- #36# (Account Number)
- #55# (Mode of Investment)
- #58# (Validity / Expiry Date)
- #59# (Overdue Grand Total in BDT)
- #60# (Customer Total Recovery Amt in BDT)
- #64# (Branch Proposal Reference No.)
- #65# (Branch Proposal Date)
- #68# (Print Date / Cut-off Date in DD.MM.YYYY)
- #69# (Customer ID / CIS ID)

Extracted text preview (if any):
${params.textPreview.slice(0, 8000)}
`;

  const contents: Array<Record<string, unknown>> = [{ text: prompt }];
  if (safeMime === 'application/pdf' || safeMime.startsWith('image/')) {
    contents.push({
      inlineData: {
        mimeType: safeMime,
        data: params.buffer.toString('base64'),
      },
    });
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedCategory: { type: Type.STRING },
          classificationConfidence: { type: Type.NUMBER },
          summaryText: { type: Type.STRING },
          extractedFields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING },
                rawValue: { type: Type.STRING },
                rawUnit: { type: Type.STRING },
                sourceLabel: { type: Type.STRING },
              },
              required: ['key', 'rawValue', 'rawUnit'],
            },
          },
        },
        required: ['detectedCategory', 'classificationConfidence', 'summaryText', 'extractedFields'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}') as {
    detectedCategory?: string;
    classificationConfidence?: number;
    summaryText?: string;
    extractedFields?: Array<{ key: string; rawValue: string; rawUnit: string; sourceLabel?: string }>;
  };

  const validCategories: DocumentCategory[] = [
    'branch_proposal',
    'outstanding',
    'party_performance',
    'overdue',
    'account_statement',
    'cib_report',
    'cost_of_fund',
  ];

  const detectedCategory = validCategories.includes(parsed.detectedCategory as DocumentCategory)
    ? (parsed.detectedCategory as DocumentCategory)
    : params.hintedCategory || 'branch_proposal';

  const fields: ExtractedDocumentPayload['fields'] = {};
  for (const item of parsed.extractedFields || []) {
    if (!item.key || !item.rawValue) continue;
    const key = item.key.startsWith('#') ? item.key : `#${item.key.replace(/#/g, '')}#`;
    const unit =
      item.rawUnit === 'BDT' || item.rawUnit === 'Million BDT' || item.rawUnit === 'Date'
        ? item.rawUnit
        : 'Text';

    let millionValue: number | null = null;
    let displayValue = item.rawValue.trim();

    if (unit === 'BDT') {
      const num = parseNumericString(item.rawValue);
      millionValue = bdtToMillion(num);
      if (millionValue !== null) {
        displayValue = formatMillionBdt(millionValue);
      }
    } else if (unit === 'Million BDT') {
      const num = parseNumericString(item.rawValue);
      millionValue = num;
      if (num !== null) {
        displayValue = formatMillionBdt(num);
      }
    }

    fields[key] = {
      rawValue: item.rawValue.trim(),
      rawUnit: unit,
      millionValue,
      displayValue,
      sourceLabel: item.sourceLabel || `${params.fileName} (AI OCR)`,
    };
  }

  return {
    detectedCategory,
    classificationConfidence: parsed.classificationConfidence ?? 0.85,
    method: 'ai_ocr',
    summaryText: parsed.summaryText || 'Extracted via Gemini multimodal analysis.',
    fields,
  };
}

export async function scrutinizeBranchProposalWithGemini(params: {
  branchProposalBuffer?: Buffer;
  branchProposalMimeType?: string;
  branchProposalFileName?: string;
  branchProposalText: string;
  cibSummaryText: string;
  currentPlaceholders: Record<string, string>;
}): Promise<IcMemoSectionsData> {
  const ai = getAiClient();

  const prompt = `You are a Senior Credit Officer at the Special Asset Management Division (SAMD), Head Office, Sammilito Islami Bank PLC (Union Bank PLC Unit).
Scrutinize the attached Branch Proposal and CIB Report summary along with the verified financial placeholders below to populate every narrative and structured table section of the Investment Committee (IC) Memo accurately.

Verified Financial & Account Placeholders (All currency figures in Million BDT):
${JSON.stringify(params.currentPlaceholders, null, 2)}

CIB Report Summary Data:
${params.cibSummaryText || 'Not uploaded — extract CIB details from Branch Proposal if stated.'}

Branch Proposal Extracted Text:
${params.branchProposalText ? params.branchProposalText.slice(0, 18000) : 'See attached PDF.'}

STRICT BANKING & TEMPLATE RULES:
1. Justification of The Proposed Facility:
   - Generate concise, factual bank-style text for point 1 (client application date & reason for business failure + branch visit confirmation), point 2 (down payment willingness and % of settlement amount), and point 3 (early exit cash recovery benefit, avoidance of litigation/auction delay, pending legal case summary, classified portfolio reduction).
   - NEVER generate or alter points 4 and 5 (they are fixed compliance statements in the template).
2. Audit, Compliance and Regulatory Authority Related Status (Section 6 / Audit table):
   - Note: In the Branch Proposal PDF, Bengali text in IC & CD Objections / Branch Reply may appear garbled in raw text because of SutonnyMJ font encoding. READ THE PDF PAGES VISUALLY to read the Bengali accurately! Provide accurate, clean Unicode Bengali OR concise English translation clearly preserving every single audit objection item (1..N) and the corresponding branch reply. Keep rows for 01 IC & CD, 02 DBI Bangladesh Bank, 03 DOS Bangladesh Bank, 04 BFIU Bangladesh Bank, 05 BRD Bangladesh Bank, 06 ACC(Anti-Corruption Commission).
3. Security (Section 7):
   - Primary security stock/machinery/bills/margin value (e.g., "Nil").
   - Collateral owner name(s), detailed property schedule description (land area, mouza, khatian, plot, boundaries, building sft), and schedule-wise MV & FSV valuation table rows (plus Grand Total row).
4. Brief Particulars of the Client (Section 10):
   - Return all 21 numbered rows (01 to 21) accurately from Branch Proposal.
5. Recommendation of The Branch (Section 12) and Branch Visit Report (Section 13):
   - Reference proposal Ref (#64#), proposal date (#65#), branch visit officers, visit date, and findings.
6. Observation and Recommendation of SAMD (Section 14):
   - CRITICAL: Output EXACTLY 5 concise numbered/distinct lines in "samdObservationLines" (an array of exactly 5 strings, without redundant "1." prefixes if not needed, or concise clean sentences):
     - Line 1: Client identity, proprietorship/entity, business nature & location.
     - Line 2: Justification of business failure & branch visit plausibility.
     - Line 3: Facility limit, expiry, classification date/status, outstanding, overdue & legal case status.
     - Line 4: Collateral security FSV coverage ratio vs outstanding, valuation vintage, third-party ownership/primary security & IC&CD audit note.
     - Line 5: Down payment in A/C, settlement recovery vs principal/charges, waiver scope (profit/compensation only) & clear SAMD recommendation for IC consideration.
7. Do NOT invent figures not present in the sources; use "Nil", "N/A", or "-" where the source states none.
`;

  const contents: Array<Record<string, unknown>> = [{ text: prompt }];
  if (params.branchProposalBuffer && params.branchProposalMimeType) {
    const safeMime = getSafeInlineMimeType(
      params.branchProposalMimeType,
      params.branchProposalFileName || 'branch_proposal.pdf'
    );
    if (safeMime === 'application/pdf' || safeMime.startsWith('image/')) {
      contents.push({
        inlineData: {
          mimeType: safeMime,
          data: params.branchProposalBuffer.toString('base64'),
        },
      });
    }
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          justificationPoint1: { type: Type.STRING },
          justificationPoint2: { type: Type.STRING },
          justificationPoint3: { type: Type.STRING },
          previousBoardDecision: { type: Type.STRING },
          natureOfBusiness: { type: Type.STRING },
          sisterConcernsSibAsOn: { type: Type.STRING },
          sisterConcernsSibRows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sl: { type: Type.STRING },
                concernName: { type: Type.STRING },
                bankName: { type: Type.STRING },
                natureOfFacility: { type: Type.STRING },
                limit: { type: Type.STRING },
                outstanding: { type: Type.STRING },
                overdue: { type: Type.STRING },
                expiryDate: { type: Type.STRING },
                clStatus: { type: Type.STRING },
              },
            },
          },
          cibReportDate: { type: Type.STRING },
          cibRows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING },
                siblBorrower: { type: Type.STRING },
                siblGuarantor: { type: Type.STRING },
                otherBorrower: { type: Type.STRING },
                otherGuarantor: { type: Type.STRING },
                remarks: { type: Type.STRING },
              },
            },
          },
          cibRemarks: { type: Type.STRING },
          legalActionRows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sl: { type: Type.STRING },
                typeOfCase: { type: Type.STRING },
                caseNo: { type: Type.STRING },
                filingDate: { type: Type.STRING },
                amount: { type: Type.STRING },
                previousDate: { type: Type.STRING },
                nextDate: { type: Type.STRING },
                presentStatus: { type: Type.STRING },
              },
            },
          },
          auditRows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sl: { type: Type.STRING },
                authority: { type: Type.STRING },
                lastInspectionDate: { type: Type.STRING },
                objectionStatus: { type: Type.STRING },
                objections: { type: Type.STRING },
                branchReply: { type: Type.STRING },
              },
            },
          },
          primarySecurityStockNote: { type: Type.STRING },
          primarySecurityValue: { type: Type.STRING },
          collateralOwner: { type: Type.STRING },
          collateralDescription: { type: Type.STRING },
          collateralBranchDate: { type: Type.STRING },
          collateralSurveyorDate: { type: Type.STRING },
          collateralValuationRows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                schedule: { type: Type.STRING },
                branchOriginalMv: { type: Type.STRING },
                branchOriginalFsv: { type: Type.STRING },
                surveyorOriginalMv: { type: Type.STRING },
                surveyorOriginalFsv: { type: Type.STRING },
                presentNote: { type: Type.STRING },
              },
            },
          },
          sourceOfRepayment: { type: Type.STRING },
          hoSanctionRows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sl: { type: Type.STRING },
                referenceNo: { type: Type.STRING },
                date: { type: Type.STRING },
                limit: { type: Type.STRING },
                remarks: { type: Type.STRING },
              },
            },
          },
          briefParticulars: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sl: { type: Type.STRING },
                particular: { type: Type.STRING },
                value: { type: Type.STRING },
              },
            },
          },
          proprietors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                age: { type: Type.STRING },
                education: { type: Type.STRING },
                designation: { type: Type.STRING },
                sharePercent: { type: Type.STRING },
                experience: { type: Type.STRING },
              },
            },
          },
          directorOtherBankNote: { type: Type.STRING },
          directorOtherBanks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                bankName: { type: Type.STRING },
                designation: { type: Type.STRING },
                sharePercent: { type: Type.STRING },
                numberOfShares: { type: Type.STRING },
              },
            },
          },
          financialsNote: { type: Type.STRING },
          financialsRows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.STRING },
                grossSales: { type: Type.STRING },
                grossProfit: { type: Type.STRING },
                netProfit: { type: Type.STRING },
                totalAsset: { type: Type.STRING },
                totalLiabilities: { type: Type.STRING },
                netWorth: { type: Type.STRING },
              },
            },
          },
          recommendationOfBranch: { type: Type.STRING },
          branchVisitReport: { type: Type.STRING },
          samdObservationLines: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
    },
  });

  const data = JSON.parse(response.text || '{}') as Partial<IcMemoSectionsData>;
  const rawLines = Array.isArray(data.samdObservationLines) ? data.samdObservationLines : [];
  const fiveLines: [string, string, string, string, string] = [
    rawLines[0] || '',
    rawLines[1] || '',
    rawLines[2] || '',
    rawLines[3] || '',
    rawLines[4] || '',
  ];

  return {
    justificationPoint1: data.justificationPoint1 || '',
    justificationPoint2: data.justificationPoint2 || '',
    justificationPoint3: data.justificationPoint3 || '',
    previousBoardDecision: data.previousBoardDecision || 'Nil',
    natureOfBusiness: data.natureOfBusiness || '',
    sisterConcernsSibAsOn: data.sisterConcernsSibAsOn || '',
    sisterConcernsSibRows: data.sisterConcernsSibRows || [],
    cibReportDate: data.cibReportDate || '',
    cibRows: data.cibRows || [],
    cibRemarks: data.cibRemarks || '',
    legalActionRows: data.legalActionRows || [],
    auditRows: data.auditRows || [],
    primarySecurityStockNote: data.primarySecurityStockNote || '',
    primarySecurityValue: data.primarySecurityValue || 'Nil',
    collateralOwner: data.collateralOwner || '',
    collateralDescription: data.collateralDescription || '',
    collateralValuationRows: data.collateralValuationRows || [],
    collateralBranchDate: data.collateralBranchDate || '',
    collateralSurveyorDate: data.collateralSurveyorDate || '',
    sourceOfRepayment: data.sourceOfRepayment || '',
    hoSanctionRows: data.hoSanctionRows || [],
    briefParticulars: data.briefParticulars || [],
    proprietors: data.proprietors || [],
    directorOtherBankNote: data.directorOtherBankNote || 'N/A',
    directorOtherBanks: data.directorOtherBanks || [],
    financialsNote: data.financialsNote || 'Nil',
    financialsRows: data.financialsRows || [],
    recommendationOfBranch: data.recommendationOfBranch || '',
    branchVisitReport: data.branchVisitReport || '',
    samdObservationLines: fiveLines,
    memoNumber: '',
    scritinizedAt: new Date().toISOString(),
  };
}
