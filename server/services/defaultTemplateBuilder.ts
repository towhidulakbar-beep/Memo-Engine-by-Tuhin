import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { MemoType } from '../../src/types/memo.ts';

const DOTTED_BORDER = {
  style: BorderStyle.DOTTED,
  size: 4,
  color: '334155',
};

const SOLID_BORDER = {
  style: BorderStyle.SINGLE,
  size: 6,
  color: '1E293B',
};

function makeCell(
  text: string | Array<{ text: string; bold?: boolean; size?: number; italics?: boolean }>,
  options?: {
    widthPct?: number;
    columnSpan?: number;
    rowSpan?: number;
    bold?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    shading?: string;
    borderStyle?: 'dotted' | 'solid' | 'none';
    size?: number;
  }
): TableCell {
  const runs =
    typeof text === 'string'
      ? [
          new TextRun({
            text,
            bold: options?.bold ?? false,
            size: options?.size ?? 19,
            font: 'Times New Roman',
          }),
        ]
      : text.map(
          (part) =>
            new TextRun({
              text: part.text,
              bold: part.bold ?? false,
              italics: part.italics ?? false,
              size: part.size ?? options?.size ?? 19,
              font: 'Times New Roman',
            })
        );

  const b =
    options?.borderStyle === 'none'
      ? { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
      : options?.borderStyle === 'solid'
      ? SOLID_BORDER
      : DOTTED_BORDER;

  return new TableCell({
    columnSpan: options?.columnSpan,
    rowSpan: options?.rowSpan,
    width: options?.widthPct ? { size: options.widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: options?.shading ? { type: ShadingType.CLEAR, fill: options.shading } : undefined,
    borders: {
      top: b,
      bottom: b,
      left: b,
      right: b,
    },
    margins: {
      top: 45,
      bottom: 45,
      left: 80,
      right: 80,
    },
    children: [
      new Paragraph({
        alignment: options?.align ?? AlignmentType.LEFT,
        spacing: { before: 20, after: 20 },
        children: runs,
      }),
    ],
  });
}

function buildHeaderBlock(badgeText: string): Header {
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'SAMMILITO ISLAMI BANK PLC.',
                        bold: true,
                        underline: {},
                        size: 24,
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '(State-owned Shariah-based Bank)',
                        bold: true,
                        underline: {},
                        size: 20,
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'UNION BANK UNIT',
                        bold: true,
                        underline: {},
                        size: 20,
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Special Asset Management Division Head Office, Dhaka',
                        underline: {},
                        size: 18,
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: {
                  top: SOLID_BORDER,
                  bottom: SOLID_BORDER,
                  left: SOLID_BORDER,
                  right: SOLID_BORDER,
                },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: badgeText,
                        bold: true,
                        size: 18,
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildFooterBlock(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: 'Page ', size: 18, font: 'Times New Roman' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Times New Roman' }),
          new TextRun({ text: ' of ', size: 18, font: 'Times New Roman' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: 'Times New Roman' }),
        ],
      }),
    ],
  });
}

function pHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 140, after: 50 },
    children: [
      new TextRun({
        text,
        bold: true,
        underline: {},
        size: 20,
        font: 'Times New Roman',
      }),
    ],
  });
}

function pBody(text: string, options?: { bold?: boolean; indent?: number }): Paragraph {
  return new Paragraph({
    spacing: { before: 30, after: 40 },
    indent: options?.indent ? { left: options.indent } : undefined,
    children: [
      new TextRun({
        text,
        bold: options?.bold ?? false,
        size: 19,
        font: 'Times New Roman',
      }),
    ],
  });
}

export async function buildDefaultIcMemoDocx(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1450, bottom: 850, left: 950, right: 950, header: 450, footer: 450 },
          },
        },
        headers: { default: buildHeaderBlock('Exit under BRPD 1 Circular Letter No. 23') },
        footers: { default: buildFooterBlock() },
        children: [
          new Table({
            width: { size: 52, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Dated', { widthPct: 35, bold: true, borderStyle: 'solid' }),
                  makeCell(':', { widthPct: 8, align: AlignmentType.CENTER, borderStyle: 'solid' }),
                  makeCell('#1#', { widthPct: 57, bold: true, borderStyle: 'solid' }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Memo no', { bold: true, borderStyle: 'solid' }),
                  makeCell(':', { align: AlignmentType.CENTER, borderStyle: 'solid' }),
                  makeCell('', { borderStyle: 'solid' }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('To', { bold: true, borderStyle: 'solid' }),
                  makeCell(':', { align: AlignmentType.CENTER, borderStyle: 'solid' }),
                  makeCell('Investment Committee', { bold: true, borderStyle: 'solid' }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('From', { bold: true, borderStyle: 'solid' }),
                  makeCell(':', { align: AlignmentType.CENTER, borderStyle: 'solid' }),
                  makeCell('SAMD', { bold: true, borderStyle: 'solid' }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('A/C: #2# (CIS: #69#)', { widthPct: 55, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Branch: #3#', { widthPct: 45, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: 'Subject: The customer proposed for full and final settlement of their liability by allowing waiver of Tk.#4# Million along with profit/compensation to be accrued up to the date of full and final settlement as follows:',
                bold: true,
                size: 19,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 20, after: 30 },
            children: [
              new TextRun({
                text: '[All Figures in this Memo are in Million BDT Unless Stated Otherwise]',
                bold: true,
                size: 18,
                font: 'Times New Roman',
              }),
            ],
          }),
          pBody('[Proposal for Full & Final Settlement with Waiver]', { bold: true }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Mode', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Limit', { widthPct: 14, columnSpan: 2, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Particulars', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
                  makeCell('O/S as on #68#', { widthPct: 11, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Proposed Waiver', { widthPct: 11, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Settlement Amount', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Remarks', { widthPct: 18, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('', { align: AlignmentType.CENTER }),
                  makeCell('Original', { bold: true, align: AlignmentType.CENTER, size: 17 }),
                  makeCell('RSD', { bold: true, align: AlignmentType.CENTER, size: 17 }),
                  makeCell('', { align: AlignmentType.CENTER }),
                  makeCell('01', { align: AlignmentType.CENTER, size: 17 }),
                  makeCell('02', { align: AlignmentType.CENTER, size: 17 }),
                  makeCell('03(01-02)', { align: AlignmentType.CENTER, size: 17 }),
                  makeCell('1)Settlement Deadline: #28#', { bold: true, size: 17 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('#5#', { rowSpan: 8, align: AlignmentType.CENTER }),
                  makeCell('#6#', { rowSpan: 8, align: AlignmentType.CENTER }),
                  makeCell('-', { rowSpan: 8, align: AlignmentType.CENTER }),
                  makeCell('Principal'),
                  makeCell('#7#', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('#7#', { align: AlignmentType.CENTER }),
                  makeCell('2) Break up', { bold: true, size: 17 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Charges (Legal & Others)'),
                  makeCell('#8#', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('#8#', { align: AlignmentType.CENTER }),
                  makeCell('Principal: #7#', { size: 17 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Gestation Rent'),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('Charges: #8#', { size: 17 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Charged Profit'),
                  makeCell('#10#', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('#10#', { align: AlignmentType.CENTER }),
                  makeCell('COF: #31#', { size: 17 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Compensation'),
                  makeCell('#11#', { align: AlignmentType.CENTER }),
                  makeCell('', { align: AlignmentType.CENTER }),
                  makeCell('', { align: AlignmentType.CENTER }),
                  makeCell('Total: #32#', { bold: true, size: 17 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Uncharged Compensation'),
                  makeCell('#12#', { align: AlignmentType.CENTER }),
                  makeCell('', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('3)Security Value:', { bold: true, size: 17 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Uncharged Profit (for T/L)'),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('MV: #33#', { size: 17 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Grand-Total', { bold: true }),
                  makeCell('#25#', { bold: true, align: AlignmentType.CENTER }),
                  makeCell('#4#', { bold: true, align: AlignmentType.CENTER }),
                  makeCell('#27#', { bold: true, align: AlignmentType.CENTER }),
                  makeCell('FSV: #34#', { size: 17 }),
                ],
              }),
            ],
          }),
          pBody('Note: Information Regarding Down payment (Balance Tk.#35# Million in A/C: #36# on #68#.)', {
            bold: true,
          }),
          pHeading('Key Points:'),
          pBody(
            'This Memo is placed in conformity with BRPD 1 Circular Letter No. 23 dated 29.06.2026 under the following contexts:',
            { bold: true }
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Particulars', { widthPct: 48, columnSpan: 3, bold: true }),
                  makeCell('Waiver recommended by:', { widthPct: 52, columnSpan: 3, bold: true }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('a. Total [Profit+ Charges+ Compensation+ Uncharged Comp.]', { widthPct: 35 }),
                  makeCell(':', { widthPct: 3, align: AlignmentType.CENTER }),
                  makeCell('#42#', { widthPct: 10, align: AlignmentType.CENTER }),
                  makeCell('d. Client', { widthPct: 34 }),
                  makeCell(':', { widthPct: 3, align: AlignmentType.CENTER }),
                  makeCell('#45#', { widthPct: 15, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('b. Cost of Fund [After deducting realized profit & comp.]'),
                  makeCell(':', { align: AlignmentType.CENTER }),
                  makeCell('#31#', { align: AlignmentType.CENTER }),
                  makeCell('e. Branch'),
                  makeCell(':', { align: AlignmentType.CENTER }),
                  makeCell('#45#', { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('c. Maximum Waiver Considering COF [a-b]', { bold: true }),
                  makeCell(':', { align: AlignmentType.CENTER }),
                  makeCell('#44#', { bold: true, align: AlignmentType.CENTER }),
                  makeCell('f. SAMD, HO'),
                  makeCell(':', { align: AlignmentType.CENTER }),
                  makeCell('#47#', { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('', { rowSpan: 3 }),
                  makeCell('', { rowSpan: 3 }),
                  makeCell('', { rowSpan: 3 }),
                  makeCell('g. HOIC'),
                  makeCell(':', { align: AlignmentType.CENTER }),
                  makeCell('……', { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('h. MEC'),
                  makeCell(':', { align: AlignmentType.CENTER }),
                  makeCell('……', { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('i. IC & CD'),
                  makeCell(':', { align: AlignmentType.CENTER }),
                  makeCell('……', { align: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),
          pHeading('Justification of The Proposed Facility:'),
          pBody('1. '),
          pBody('2. '),
          pBody('3. '),
          pBody('4. Investment was not created against any fraud and forgery.'),
          pBody('5. The client is not a willful defaulter.'),
          pBody('Previous Board Decision(s) Regarding Rescheduling/Waiver/Written-Off: Nil', { bold: true }),
          pHeading('1. Nature of Business:'),
          pHeading('2. Liability Position of the Clients and Its Sister Concerns with Our Bank as on #68#:'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Name of the Concern', { widthPct: 16, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Mode of Investment', { widthPct: 20, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Limit', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Outstanding', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Validity', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Overdue', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Recovery in existing deals [Mode wise]', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Remarks', { widthPct: 8, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('#2#', { rowSpan: 3, align: AlignmentType.CENTER }),
                  makeCell('#55#', { align: AlignmentType.CENTER }),
                  makeCell('#6#', { align: AlignmentType.CENTER }),
                  makeCell('#25#', { align: AlignmentType.CENTER }),
                  makeCell('#58#', { align: AlignmentType.CENTER }),
                  makeCell('#59#', { align: AlignmentType.CENTER }),
                  makeCell('#60#', { align: AlignmentType.CENTER }),
                  makeCell('', { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Funded'),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Non Funded'),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Total', { columnSpan: 2, bold: true, align: AlignmentType.RIGHT }),
                  makeCell('#6#', { bold: true, align: AlignmentType.CENTER }),
                  makeCell('#25#', { bold: true, align: AlignmentType.CENTER }),
                  makeCell(''),
                  makeCell('#59#', { bold: true, align: AlignmentType.CENTER }),
                  makeCell('#60#', { bold: true, align: AlignmentType.CENTER }),
                  makeCell(''),
                ],
              }),
            ],
          }),
          pHeading('3. Liability of the Client & Its Sister/Allied Concerns with Other Units of SIB: as on …….'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('SL', { widthPct: 6, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Name of Concern', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Name of the Banks/NBFIs', { widthPct: 16, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Nature of Facility', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Limit', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Outstanding with profit/Interest', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Overdue/EOL', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Expiry Date', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
                  makeCell('CL Status', { widthPct: 8, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('1', { align: AlignmentType.CENTER }),
                  makeCell('N/A', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Sub-Total', { columnSpan: 4, bold: true, align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Grand Total', { columnSpan: 4, bold: true, align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),
          pHeading('4. CIB Status: Report dated …….. shows:'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('STATUS', { widthPct: 20, bold: true, align: AlignmentType.CENTER }),
                  makeCell('With Union Bank Unit', { widthPct: 24, columnSpan: 2, bold: true, align: AlignmentType.CENTER }),
                  makeCell('With Other Bank', { widthPct: 24, columnSpan: 2, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Remarks (Pls. give concern wise Breakup)', { widthPct: 32, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell(''),
                  makeCell('Borrower', { bold: true, align: AlignmentType.CENTER, size: 17 }),
                  makeCell('Guarantor', { bold: true, align: AlignmentType.CENTER, size: 17 }),
                  makeCell('Borrower', { bold: true, align: AlignmentType.CENTER, size: 17 }),
                  makeCell('Guarantor', { bold: true, align: AlignmentType.CENTER, size: 17 }),
                  makeCell(''),
                ],
              }),
              ...['STD', 'SMA', 'SS', 'DF', 'BL', 'Willful Default (WD)', 'Write-Off', 'Non-Funded', 'Stay Order', 'TOTAL'].map(
                (st) =>
                  new TableRow({
                    children: [
                      makeCell(st, { bold: st === 'TOTAL' }),
                      makeCell('', { align: AlignmentType.CENTER }),
                      makeCell('', { align: AlignmentType.CENTER }),
                      makeCell('', { align: AlignmentType.CENTER }),
                      makeCell('', { align: AlignmentType.CENTER }),
                      makeCell(''),
                    ],
                  })
              ),
            ],
          }),
          pHeading('5. Legal Action Status as on Memo Date:'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Sl', { widthPct: 6, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Type of Case', { widthPct: 16, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Case No.', { widthPct: 18, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Filling date', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Amount', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Previous date', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Next date', { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Present status', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                  makeCell(''),
                ],
              }),
            ],
          }),
          pHeading('6. Audit, Compliance and Regulatory Authority Related Status:'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Sl', { widthPct: 6, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Name of the Authority', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Last Inspection / Report Date', { widthPct: 16, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Objection Status (Yes/No)', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Objections (If yes)', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Branch Reply/ Current Position', { widthPct: 20, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              ...[
                ['01', 'IC & CD'],
                ['02', 'DBI, Bangladesh Bank'],
                ['03', 'DOS, Bangladesh Bank'],
                ['04', 'BFIU, Bangladesh Bank'],
                ['05', 'BRD, Bangladesh Bank'],
                ['06', 'ACC(Anti-Corruption Commission)'],
              ].map(
                ([sl, auth]) =>
                  new TableRow({
                    children: [
                      makeCell(sl, { align: AlignmentType.CENTER }),
                      makeCell(auth),
                      makeCell(''),
                      makeCell(''),
                      makeCell(''),
                      makeCell(''),
                    ],
                  })
              ),
            ],
          }),
          pHeading('7. Security:'),
          pBody('(i) Primary:', { bold: true }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Particulars', { widthPct: 75, bold: true }),
                  makeCell('Value', { widthPct: 25, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [makeCell('i) Hypothecation of Stock as on …..'), makeCell('', { align: AlignmentType.CENTER })],
              }),
              new TableRow({
                children: [makeCell('ii) Hypothecation of Machinery'), makeCell('', { align: AlignmentType.CENTER })],
              }),
              new TableRow({
                children: [makeCell('iii) Assignment of Bills against Work Order'), makeCell('', { align: AlignmentType.CENTER })],
              }),
              new TableRow({
                children: [makeCell('iv) Margin held against existing LC & BG liability as on……..'), makeCell('', { align: AlignmentType.CENTER })],
              }),
              new TableRow({
                children: [makeCell('Total value of primary security', { bold: true }), makeCell('', { align: AlignmentType.CENTER })],
              }),
            ],
          }),
          pBody('(ii) Collateral:', { bold: true }),
          pBody(''),
          pBody('(iii) Others:', { bold: true }),
          pBody('a. Usual Charge documents.', { indent: 360 }),
          pBody('b. Acceptance of Branch Sanction by the Client.', { indent: 360 }),
          pHeading('8. Source of Repayment:'),
          pHeading('9. Sequence of Head Office Sanction(S):'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('SL', { widthPct: 8, bold: true, align: AlignmentType.CENTER }),
                  makeCell('HO Sanction Reference No.', { widthPct: 40, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Date', { widthPct: 16, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Limit', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Remarks', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [makeCell(''), makeCell(''), makeCell(''), makeCell(''), makeCell('')],
              }),
            ],
          }),
          pHeading('10. Brief Particulars of the Client:'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              ['01', 'Name of the Client'],
              ['02', 'Unique Customer ID'],
              ['03', 'AWCD/MSD Account with opening date'],
              ['04', 'Business Type/Nature'],
              ['05', 'Business Management Type'],
              ['06', 'Client Type'],
              ['07', 'Key Person with Phone No. & Address'],
              ['08', 'Office/Business Address & Factory Address'],
              ['09', 'Purpose of Investment'],
              ['10', 'Limit of Investment'],
              ['11', 'Mode of Investment'],
              ['12', 'Last Visit Date'],
              ['13', 'Stock Position'],
              ['14', 'Fixed Asset'],
              ['15', 'Business Net Worth'],
              ['16', 'Insurance Coverage'],
              ['17', 'Trade License & Validity'],
              ['18', 'Other Regulatory Documents'],
              ['19', 'Date of Original Investment'],
              ['20', '1st Disbursement Manager'],
              ['21', 'First Date of Classification with Status'],
            ].map(
              ([sl, label]) =>
                new TableRow({
                  children: [
                    makeCell(sl, { widthPct: 8, align: AlignmentType.CENTER }),
                    makeCell(label, { widthPct: 36 }),
                    makeCell(':', { widthPct: 4, align: AlignmentType.CENTER }),
                    makeCell('', { widthPct: 52 }),
                  ],
                })
            ),
          }),
          pBody('• Particular of the Proprietor/Partner/Directors:', { bold: true }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Name of the Proprietor', { widthPct: 26, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Age', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Education', { widthPct: 16, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Designation', { widthPct: 16, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Share (%)', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Experience', { widthPct: 18, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [makeCell(''), makeCell(''), makeCell(''), makeCell(''), makeCell(''), makeCell('')],
              }),
            ],
          }),
          pBody('• Remarks: Director of any Bank/ FI/ Insurance company:', { bold: true }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Name of the Director', { widthPct: 24, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Name of the bank/NBFIs', { widthPct: 24, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Designation/ Position', { widthPct: 18, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Percentage of Shares', { widthPct: 17, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Number of Shares', { widthPct: 17, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('N/A', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),
          pHeading('11. Financials of The Client:'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Year', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Gross Sales', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Gross Profit', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Net Profit', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Total Asset', { widthPct: 14, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Total liabilities', { widthPct: 15, bold: true, align: AlignmentType.CENTER }),
                  makeCell('Net Worth', { widthPct: 15, bold: true, align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                  makeCell('-', { align: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),
          pHeading('12. Recommendation of The Branch:'),
          pHeading('13. Branch Visit Report:'),
          pHeading('14. Observation and Recommendation of SAMD:'),
          pHeading('15. Particulars of the facility:'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              ['1.', 'Facility', 'Exit with Waiver under BRPD 1 Circular Letter No. 23 dated 29.06.2026'],
              ['2.', 'Outstanding', 'Tk. #25# million as on #68#.'],
              ['3.', 'Down Payment', 'Down-payment of Tk. #35# Million is kept in A/C #36#'],
              ['4.', 'Waiver', 'Tk. #4# million as on #68#'],
              ['5.', 'Settlement/Exit amount', 'Tk. #27# Million as on #68#'],
              ['6.', 'Settlement period', '#28#'],
              ['7.', 'Profit/Rent rate', 'Without charging further profit.'],
              ['8.', 'Repayment Method', 'Lump sum.'],
            ].map(
              ([sl, label, val]) =>
                new TableRow({
                  children: [
                    makeCell(sl, { widthPct: 8, align: AlignmentType.CENTER }),
                    makeCell(label, { widthPct: 30, bold: true }),
                    makeCell(val, { widthPct: 62, bold: sl === '1.' }),
                  ],
                })
            ),
          }),
          pHeading('16. Special Term(s) & Condition(s):'),
          pBody('If the proposal approved, the branch is advised to comply the following special terms and conditions:', {
            indent: 180,
          }),
          ...[
            'i. The final settlement amount will be determined at the date of execution of settlement considering up to date liability position.',
            'ii. The Branch must ensure adjustment of all non-funded liabilities (L/C, Bank Guarantee, Credit Card etc.) before allowing final redemption of the mortgaged collateral security(s). The Branch must also ensure that any encashable security (Margin for Bank Guarantee, L/C, MTDR, Scheme deposit in the name of the client) including collateral is properly mentioned in the proposal. If any encashable security is found not mentioned in the proposal and later encashed in favor of the client, the Manager will be held responsible.',
            'iii. Branch should be utmost sincere to protect bank interest in the course of execution partial redemption.',
            'iv. The client shall settle the approved settlement amount in full from its own source within 7 days from receiving the sanction advice.',
            'v. No portion of the principal amount and Other Govt. Charges/Taxes shall be waived.',
            'vi. The waiver shall be effective only upon realization of the full approved settlement amount within the stipulated period.',
            'vii. Accrued Compensation/unapplied profit up to final adjustment shall be dealt with as per sanction terms and Bangladesh Bank instructions.',
            'viii. The branch shall ensure recovery of legal costs, excise duties, etc. from the client’s account. No NOC shall be issued until full realization of all such dues.',
            'ix. If the customer fails to repay the dues within the stipulated time, the bank will take necessary legal action to recover the investment outstanding.',
            'x. In the event of failure to settle the outstanding liability as per the sanctioned terms, the waiver facility shall cease to be effective, and recovery shall continue in accordance with the applicable rules, regulations, and policies of the Bank.',
            'xi. The approval shall be effective subject to the branch’s compliance with all applicable regulatory norms, including directives of Bangladesh Bank and guidelines, circulars, letters, and instructions issued by Union Bank Unit of Sammilito Islami Bank PLC from time to time.',
            'xii. The Branch shall complete all necessary accounting, classification, documentation and compliance formalities after full settlement of the liability.',
            'xiii. The exit formalities shall be completed under the guidance of the FAD, ICT, and CIB cell under IAD division of Union Bank Unit of Sammilito Islami Bank PLC.',
            'xiv. The branch shall release the original title deed and other property-related documents only after full settlement of all investment and other liabilities with the branch and any other branches of Union Bank Unit of Sammilito Islami Bank PLC.',
          ].map((t) => pBody(t, { indent: 360 })),
          new Paragraph({ spacing: { before: 140, after: 140 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('The proposal is hereby placed before the Investment Committee for kind recommendation.', {
                    bold: true,
                    align: AlignmentType.CENTER,
                    borderStyle: 'solid',
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 320, after: 320 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell(
                    [
                      { text: 'Mohammad Towhidul Akbar Tuhin\n', bold: true },
                      { text: 'Officer, SAMD, HO' },
                    ],
                    { widthPct: 50, borderStyle: 'none' }
                  ),
                  makeCell(
                    [
                      { text: 'Md. Mizanur Rahman\n', bold: true },
                      { text: 'FAVP, SAMD, HO' },
                    ],
                    { widthPct: 50, borderStyle: 'none' }
                  ),
                ],
              }),
              new TableRow({
                children: [
                  makeCell(
                    [
                      { text: '\n\nMohammed Abdul Kader Bhuyan\n', bold: true },
                      { text: 'AVP, Head of SAMD & Member, IC' },
                    ],
                    { widthPct: 50, borderStyle: 'none' }
                  ),
                  makeCell(
                    [
                      { text: '\n\nMd. Rofiqul Islam\n', bold: true },
                      { text: 'VP & Chairman, IC' },
                    ],
                    { widthPct: 50, borderStyle: 'none' }
                  ),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function buildStarterTemplateForFutureMemo(memoType: Exclude<MemoType, 'ic_memo'>): Promise<Buffer> {
  const titles: Record<Exclude<MemoType, 'ic_memo'>, { recipient: string; badge: string; heading: string }> = {
    mec_memo: {
      recipient: 'Management Executive Committee (MEC)',
      badge: 'MEC Memorandum',
      heading: 'Management Executive Committee (MEC) Memorandum',
    },
    board_memo: {
      recipient: 'Board of Directors / Executive Committee',
      badge: 'Board Memorandum',
      heading: 'Board Memorandum — Special Asset Management Division',
    },
    sanction: {
      recipient: 'The Head of Branch / Manager (#3# Branch)',
      badge: 'Sanction Advice',
      heading: 'Sanction Advice — Full & Final Settlement with Waiver',
    },
  };

  const meta = titles[memoType];
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1400, bottom: 900, left: 950, right: 950, header: 450, footer: 450 },
          },
        },
        headers: { default: buildHeaderBlock(meta.badge) },
        footers: { default: buildFooterBlock() },
        children: [
          pHeading(meta.heading),
          new Table({
            width: { size: 65, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Dated', { widthPct: 35, bold: true, borderStyle: 'solid' }),
                  makeCell('#1#', { widthPct: 65, bold: true, borderStyle: 'solid' }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Ref / Memo No.', { bold: true, borderStyle: 'solid' }),
                  makeCell('#64#', { borderStyle: 'solid' }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('To', { bold: true, borderStyle: 'solid' }),
                  makeCell(meta.recipient, { bold: true, borderStyle: 'solid' }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('From', { bold: true, borderStyle: 'solid' }),
                  makeCell('Special Asset Management Division (SAMD), HO', { borderStyle: 'solid' }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 100, after: 60 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('A/C: #2# (CIS: #69#)', { widthPct: 55, bold: true }),
                  makeCell('Branch: #3#', { widthPct: 45, bold: true }),
                ],
              }),
            ],
          }),
          pBody(
            'Subject: Proposal / Sanction regarding #5# facility of #2# (A/C #36#) with total outstanding of Tk. #25# Million as on #68#, proposed waiver Tk. #4# Million, and settlement amount Tk. #27# Million within #28#.',
            { bold: true }
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Key Financial Summary (Million BDT)', { columnSpan: 2, bold: true }),
                ],
              }),
              ...[
                ['Original Limit', '#6#'],
                ['Principal Outstanding', '#7#'],
                ['Charges (Legal & Others)', '#8#'],
                ['Charged Profit', '#10#'],
                ['Compensation', '#11#'],
                ['Uncharged Compensation', '#12#'],
                ['Grand Total Outstanding', '#25#'],
                ['Cost of Fund', '#31#'],
                ['Maximum Waiver Considering COF', '#44#'],
                ['Collateral MV / FSV', 'MV: #33# / FSV: #34#'],
                ['Down Payment Balance (A/C #36#)', '#35#'],
                ['Overdue Amount', '#59#'],
              ].map(
                ([k, v]) =>
                  new TableRow({
                    children: [makeCell(k, { widthPct: 50, bold: true }), makeCell(v, { widthPct: 50 })],
                  })
              ),
            ],
          }),
          pBody(
            '\n[Template Ready — Upload your final institutional Word (.docx) template to replace this starter structure cleanly.]',
            { bold: false }
          ),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
