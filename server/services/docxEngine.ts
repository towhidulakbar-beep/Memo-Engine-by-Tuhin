import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type { Document as XmlDocument, Element as XmlElement } from '@xmldom/xmldom';
import JSZip from 'jszip';
import type { IcMemoSectionsData } from '../../src/types/memo.ts';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export interface InspectedPlaceholder {
  key: string;
  context: string;
  occurrences: number;
}

export interface TemplateInspectionResult {
  placeholders: InspectedPlaceholder[];
  detectedSections: string[];
}

function getParagraphText(p: XmlElement): string {
  const texts: string[] = [];
  const tNodes = p.getElementsByTagName('w:t');
  for (let i = 0; i < tNodes.length; i += 1) {
    texts.push(tNodes[i].textContent || '');
  }
  return texts.join('');
}

function replaceParagraphPlaceholders(p: XmlElement, replacements: Record<string, string>): number {
  let replacedCount = 0;
  const runNodes = Array.from(p.getElementsByTagName('w:r'));
  if (runNodes.length === 0) return 0;

  interface Segment {
    tNode: XmlElement;
    start: number;
    end: number;
    text: string;
  }

  const collectSegments = (): { fullText: string; segments: Segment[] } => {
    const segments: Segment[] = [];
    let cursor = 0;
    for (const r of runNodes) {
      const tNodes = Array.from(r.getElementsByTagName('w:t'));
      for (const tNode of tNodes) {
        const txt = tNode.textContent || '';
        segments.push({ tNode, start: cursor, end: cursor + txt.length, text: txt });
        cursor += txt.length;
      }
    }
    return { fullText: segments.map((s) => s.text).join(''), segments };
  };

  let { fullText, segments } = collectSegments();
  if (!/#\d+#/.test(fullText)) return 0;

  const matches: Array<{ start: number; end: number; key: string; value: string }> = [];
  const regex = /#(\d+)#/g;
  let m: RegExpExecArray | null = regex.exec(fullText);
  while (m !== null) {
    const key = m[0];
    if (Object.prototype.hasOwnProperty.call(replacements, key)) {
      matches.push({
        start: m.index,
        end: m.index + key.length,
        key,
        value: replacements[key],
      });
    }
    m = regex.exec(fullText);
  }

  if (matches.length === 0) return 0;

  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i];
    let wroteValue = false;

    for (const seg of segments) {
      if (seg.end <= match.start || seg.start >= match.end) continue;
      const curText = seg.tNode.textContent || '';
      const overlapStart = Math.max(0, match.start - seg.start);
      const overlapEnd = Math.min(curText.length, match.end - seg.start);

      const prefix = curText.slice(0, overlapStart);
      const suffix = curText.slice(overlapEnd);

      if (!wroteValue) {
        seg.tNode.textContent = prefix + match.value + suffix;
        if (seg.tNode.textContent.startsWith(' ') || seg.tNode.textContent.endsWith(' ')) {
          seg.tNode.setAttribute('xml:space', 'preserve');
        }
        wroteValue = true;
      } else {
        seg.tNode.textContent = prefix + suffix;
      }
    }

    replacedCount += 1;
    const updated = collectSegments();
    fullText = updated.fullText;
    segments = updated.segments;
  }

  return replacedCount;
}

function setParagraphTextPreservingStyle(doc: XmlDocument, p: XmlElement, newText: string): void {
  const runs = Array.from(p.getElementsByTagName('w:r'));
  let firstRPr: XmlElement | null = null;
  if (runs.length > 0) {
    const rPrs = runs[0].getElementsByTagName('w:rPr');
    if (rPrs.length > 0) {
      firstRPr = rPrs[0].cloneNode(true) as XmlElement;
    }
  }
  for (const r of runs) {
    if (r.parentNode === p) {
      p.removeChild(r);
    }
  }
  const newRun = doc.createElementNS(W_NS, 'w:r');
  if (firstRPr) {
    newRun.appendChild(firstRPr);
  } else {
    const rPr = doc.createElementNS(W_NS, 'w:rPr');
    const rFonts = doc.createElementNS(W_NS, 'w:rFonts');
    rFonts.setAttribute('w:ascii', 'Times New Roman');
    rFonts.setAttribute('w:hAnsi', 'Times New Roman');
    const sz = doc.createElementNS(W_NS, 'w:sz');
    sz.setAttribute('w:val', '19');
    rPr.appendChild(rFonts);
    rPr.appendChild(sz);
    newRun.appendChild(rPr);
  }

  const lines = newText.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (idx > 0) {
      newRun.appendChild(doc.createElementNS(W_NS, 'w:br'));
    }
    const t = doc.createElementNS(W_NS, 'w:t');
    t.setAttribute('xml:space', 'preserve');
    t.textContent = line;
    newRun.appendChild(t);
  });

  p.appendChild(newRun);
}

function setCellText(doc: XmlDocument, tc: XmlElement, text: string): void {
  const paragraphs = Array.from(tc.getElementsByTagName('w:p'));
  if (paragraphs.length === 0) {
    const p = doc.createElementNS(W_NS, 'w:p');
    tc.appendChild(p);
    setParagraphTextPreservingStyle(doc, p, text);
    return;
  }
  setParagraphTextPreservingStyle(doc, paragraphs[0], text);
  for (let i = paragraphs.length - 1; i >= 1; i -= 1) {
    if (paragraphs[i].parentNode === tc) {
      tc.removeChild(paragraphs[i]);
    }
  }
}

function populateTableRows(
  doc: XmlDocument,
  tbl: XmlElement,
  headerRowsCount: number,
  dataRows: string[][],
  preserveTrailingRowsCount = 0
): void {
  const allRows = Array.from(tbl.childNodes).filter(
    (n): n is XmlElement => n.nodeType === 1 && n.nodeName === 'w:tr'
  );
  if (allRows.length <= headerRowsCount + preserveTrailingRowsCount) return;

  const templateRow = allRows[headerRowsCount];
  const trailingStart = allRows.length - preserveTrailingRowsCount;

  for (let i = trailingStart - 1; i >= headerRowsCount; i -= 1) {
    tbl.removeChild(allRows[i]);
  }

  const insertBeforeNode = preserveTrailingRowsCount > 0 ? allRows[trailingStart] : null;
  const rowsToWrite = dataRows.length > 0 ? dataRows : [Array(templateRow.getElementsByTagName('w:tc').length).fill('-')];

  for (const rowValues of rowsToWrite) {
    const clonedRow = templateRow.cloneNode(true) as XmlElement;
    const cells = Array.from(clonedRow.childNodes).filter(
      (n): n is XmlElement => n.nodeType === 1 && n.nodeName === 'w:tc'
    );
    cells.forEach((cell, idx) => {
      if (idx < rowValues.length) {
        setCellText(doc, cell, rowValues[idx] ?? '');
      }
    });
    if (insertBeforeNode) {
      tbl.insertBefore(clonedRow, insertBeforeNode);
    } else {
      tbl.appendChild(clonedRow);
    }
  }
}

function injectIcMemoSections(doc: XmlDocument, sections: IcMemoSectionsData): void {
  const bodyNodes = doc.getElementsByTagName('w:body')[0];
  if (!bodyNodes) return;

  const topChildren = Array.from(bodyNodes.childNodes).filter((n): n is XmlElement => n.nodeType === 1);

  for (const node of topChildren) {
    if (node.nodeName === 'w:tbl') {
      const firstRowCells = Array.from(node.getElementsByTagName('w:tr')[0]?.getElementsByTagName('w:tc') || []);
      const tableText = firstRowCells.map((c) => getParagraphText(c)).join(' ').toLowerCase();
      const fullTblText = Array.from(node.getElementsByTagName('w:p'))
        .map((p) => getParagraphText(p))
        .join(' ')
        .toLowerCase();

      if (fullTblText.includes('memo no') && fullTblText.includes('investment committee') && sections.memoNumber) {
        const rows = Array.from(node.getElementsByTagName('w:tr'));
        const memoRow = rows.find((r) => getParagraphText(r).toLowerCase().includes('memo no'));
        if (memoRow) {
          const cells = Array.from(memoRow.getElementsByTagName('w:tc'));
          if (cells.length >= 2) {
            setCellText(doc, cells[cells.length - 1], sections.memoNumber);
          }
        }
      }

      if (tableText.includes('name of the banks/nbfis') && tableText.includes('cl status')) {
        if (sections.sisterConcernsSibRows.length > 0) {
          const rowsData = sections.sisterConcernsSibRows.map((r) => [
            r.sl,
            r.concernName,
            r.bankName,
            r.natureOfFacility,
            r.limit,
            r.outstanding,
            r.overdue,
            r.expiryDate,
            r.clStatus,
          ]);
          populateTableRows(doc, node, 1, rowsData, 2);
        }
      }

      if (tableText.includes('with union bank unit') || fullTblText.includes('willful default (wd)')) {
        if (sections.cibRows.length > 0) {
          const rows = Array.from(node.childNodes).filter(
            (n): n is XmlElement => n.nodeType === 1 && n.nodeName === 'w:tr'
          );
          for (let rIdx = 2; rIdx < rows.length; rIdx += 1) {
            const cells = Array.from(rows[rIdx].getElementsByTagName('w:tc'));
            const statusLabel = getParagraphText(cells[0] || rows[rIdx]).trim();
            const match = sections.cibRows.find(
              (cr) => cr.status.toLowerCase() === statusLabel.toLowerCase()
            );
            if (match && cells.length >= 6) {
              setCellText(doc, cells[1], match.siblBorrower || '-');
              setCellText(doc, cells[2], match.siblGuarantor || '-');
              setCellText(doc, cells[3], match.otherBorrower || '-');
              setCellText(doc, cells[4], match.otherGuarantor || '-');
              if (rIdx === 2 && sections.cibRemarks) {
                setCellText(doc, cells[5], sections.cibRemarks);
              } else if (match.remarks) {
                setCellText(doc, cells[5], match.remarks);
              }
            }
          }
        }
      }

      if (tableText.includes('type of case') && tableText.includes('case no.')) {
        if (sections.legalActionRows.length > 0) {
          const rowsData = sections.legalActionRows.map((r) => [
            r.sl,
            r.typeOfCase,
            r.caseNo,
            r.filingDate,
            r.amount,
            r.previousDate,
            r.nextDate,
            r.presentStatus,
          ]);
          populateTableRows(doc, node, 1, rowsData, 0);
        }
      }

      if (tableText.includes('name of the authority') && tableText.includes('objection status')) {
        if (sections.auditRows.length > 0) {
          const rowsData = sections.auditRows.map((r) => [
            r.sl,
            r.authority,
            r.lastInspectionDate,
            r.objectionStatus,
            r.objections,
            r.branchReply,
          ]);
          populateTableRows(doc, node, 1, rowsData, 0);
        }
      }

      if (fullTblText.includes('hypothecation of stock') && fullTblText.includes('total value of primary security')) {
        const rows = Array.from(node.getElementsByTagName('w:tr'));
        rows.forEach((tr, idx) => {
          const cells = Array.from(tr.getElementsByTagName('w:tc'));
          if (cells.length >= 2) {
            if (idx === 1) {
              if (sections.primarySecurityStockNote) {
                setCellText(doc, cells[0], `i) Hypothecation of Stock as on ${sections.primarySecurityStockNote}`);
              }
              setCellText(doc, cells[1], sections.primarySecurityValue || 'Nil');
            } else if (idx >= 2 && idx <= 4) {
              setCellText(doc, cells[1], sections.primarySecurityValue || 'Nil');
            } else if (idx === rows.length - 1) {
              setCellText(doc, cells[1], sections.primarySecurityValue || 'Nil');
            }
          }
        });
      }

      if (tableText.includes('ho sanction reference no.')) {
        if (sections.hoSanctionRows.length > 0) {
          const rowsData = sections.hoSanctionRows.map((r) => [r.sl, r.referenceNo, r.date, r.limit, r.remarks]);
          populateTableRows(doc, node, 1, rowsData, 0);
        }
      }

      if (fullTblText.includes('awcd/msd account') && fullTblText.includes('first date of classification')) {
        if (sections.briefParticulars.length > 0) {
          const rows = Array.from(node.getElementsByTagName('w:tr'));
          rows.forEach((tr, idx) => {
            const cells = Array.from(tr.getElementsByTagName('w:tc'));
            const match = sections.briefParticulars[idx];
            if (match && cells.length >= 4) {
              setCellText(doc, cells[3], match.value || '-');
            }
          });
        }
      }

      if (tableText.includes('name of the proprietor') && tableText.includes('share (%)')) {
        if (sections.proprietors.length > 0) {
          const rowsData = sections.proprietors.map((r) => [
            r.name,
            r.age,
            r.education,
            r.designation,
            r.sharePercent,
            r.experience,
          ]);
          populateTableRows(doc, node, 1, rowsData, 0);
        }
      }

      if (tableText.includes('name of the director') && tableText.includes('percentage of shares')) {
        if (sections.directorOtherBanks.length > 0) {
          const rowsData = sections.directorOtherBanks.map((r) => [
            r.name,
            r.bankName,
            r.designation,
            r.sharePercent,
            r.numberOfShares,
          ]);
          populateTableRows(doc, node, 1, rowsData, 0);
        }
      }

      if (tableText.includes('gross sales') && tableText.includes('net worth')) {
        if (sections.financialsRows.length > 0) {
          const rowsData = sections.financialsRows.map((r) => [
            r.year,
            r.grossSales,
            r.grossProfit,
            r.netProfit,
            r.totalAsset,
            r.totalLiabilities,
            r.netWorth,
          ]);
          populateTableRows(doc, node, 1, rowsData, 0);
        }
      }
    }
  }

  const allParas = Array.from(bodyNodes.childNodes).filter(
    (n): n is XmlElement => n.nodeType === 1 && n.nodeName === 'w:p'
  );

  for (let i = 0; i < allParas.length; i += 1) {
    const p = allParas[i];
    const txt = getParagraphText(p).trim();
    const lower = txt.toLowerCase();

    if (/^1\.\s*$/.test(txt) && i > 0 && getParagraphText(allParas[i - 1]).toLowerCase().includes('justification')) {
      if (sections.justificationPoint1) setParagraphTextPreservingStyle(doc, p, `1. ${sections.justificationPoint1}`);
    } else if (/^2\.\s*$/.test(txt)) {
      if (sections.justificationPoint2) setParagraphTextPreservingStyle(doc, p, `2. ${sections.justificationPoint2}`);
    } else if (/^3\.\s*$/.test(txt)) {
      if (sections.justificationPoint3) setParagraphTextPreservingStyle(doc, p, `3. ${sections.justificationPoint3}`);
    } else if (lower.startsWith('previous board decision')) {
      setParagraphTextPreservingStyle(
        doc,
        p,
        `Previous Board Decision(s) Regarding Rescheduling/Waiver/Written-Off: ${sections.previousBoardDecision || 'Nil'}`
      );
    } else if (lower.startsWith('1. nature of business')) {
      if (sections.natureOfBusiness) {
        setParagraphTextPreservingStyle(doc, p, `1. Nature of Business: ${sections.natureOfBusiness}`);
      }
    } else if (lower.startsWith('3. liability of the client') && sections.sisterConcernsSibAsOn) {
      setParagraphTextPreservingStyle(
        doc,
        p,
        `3. Liability of the Client & Its Sister/Allied Concerns with Other Units of SIB: as on ${sections.sisterConcernsSibAsOn}`
      );
    } else if (lower.startsWith('4. cib status:') && sections.cibReportDate) {
      setParagraphTextPreservingStyle(
        doc,
        p,
        `4. CIB Status: Report dated ${sections.cibReportDate} shows:`
      );
    } else if (lower === '(ii) collateral:') {
      const nextP = allParas[i + 1];
      if (nextP) {
        const colParts: string[] = [];
        if (sections.collateralOwner) colParts.push(`Owner of the land: ${sections.collateralOwner}`);
        if (sections.collateralDescription) colParts.push(sections.collateralDescription);
        if (sections.collateralValuationRows.length > 0) {
          colParts.push(
            `Valuation (${sections.collateralBranchDate ? `Branch: ${sections.collateralBranchDate}` : 'Original'}): ` +
              sections.collateralValuationRows
                .map((v) => `${v.schedule}: MV ${v.branchOriginalMv}, FSV ${v.branchOriginalFsv}`)
                .join(' | ')
          );
        }
        if (colParts.length > 0) {
          setParagraphTextPreservingStyle(doc, nextP, colParts.join('\n'));
        }
      }
    } else if (lower.startsWith('8. source of repayment')) {
      if (sections.sourceOfRepayment) {
        setParagraphTextPreservingStyle(doc, p, `8. Source of Repayment: ${sections.sourceOfRepayment}`);
      }
    } else if (lower.startsWith('11. financials of the client')) {
      if (sections.financialsNote) {
        setParagraphTextPreservingStyle(doc, p, `11. Financials of The Client: ${sections.financialsNote}`);
      }
    } else if (lower.startsWith('12. recommendation of the branch')) {
      if (sections.recommendationOfBranch) {
        setParagraphTextPreservingStyle(
          doc,
          p,
          `12. Recommendation of The Branch:\n${sections.recommendationOfBranch}`
        );
      }
    } else if (lower.startsWith('13. branch visit report')) {
      if (sections.branchVisitReport) {
        setParagraphTextPreservingStyle(doc, p, `13. Branch Visit Report:\n${sections.branchVisitReport}`);
      }
    } else if (lower.startsWith('14. observation and recommendation of samd')) {
      const validLines = sections.samdObservationLines
        .map((l, idx) => {
          const clean = l.trim().replace(/^\d+\.\s*/, '');
          return clean ? `${idx + 1}. ${clean}` : '';
        })
        .filter(Boolean);
      if (validLines.length > 0) {
        setParagraphTextPreservingStyle(
          doc,
          p,
          `14. Observation and Recommendation of SAMD:\n${validLines.join('\n')}`
        );
      }
    }
  }
}

export async function inspectDocxTemplate(buffer: Buffer): Promise<TemplateInspectionResult> {
  const zip = await JSZip.loadAsync(buffer);
  const parser = new DOMParser();

  const placeholderCounts = new Map<string, { count: number; context: string }>();
  const sectionCandidates = new Set<string>();

  const xmlPaths = Object.keys(zip.files).filter(
    (name) => name === 'word/document.xml' || /^word\/(header|footer)\d+\.xml$/.test(name)
  );

  for (const xmlPath of xmlPaths) {
    const file = zip.file(xmlPath);
    if (!file) continue;
    const content = await file.async('string');
    const doc = parser.parseFromString(content, 'text/xml');
    const paragraphs = Array.from(doc.getElementsByTagName('w:p'));

    for (const p of paragraphs) {
      const txt = getParagraphText(p).trim();
      if (!txt) continue;

      if (/^(\d+\.|Justification|Key Points|Previous Board Decision)/i.test(txt) && txt.length < 130) {
        sectionCandidates.add(txt.slice(0, 90));
      }

      const regex = /#(\d+)#/g;
      let match: RegExpExecArray | null = regex.exec(txt);
      while (match !== null) {
        const key = match[0];
        const prev = placeholderCounts.get(key);
        const start = Math.max(0, match.index - 24);
        const end = Math.min(txt.length, match.index + key.length + 24);
        const snippet = txt.slice(start, end).replace(/\s+/g, ' ');
        placeholderCounts.set(key, {
          count: (prev?.count || 0) + 1,
          context: prev?.context || snippet,
        });
        match = regex.exec(txt);
      }
    }
  }

  const placeholders: InspectedPlaceholder[] = Array.from(placeholderCounts.entries())
    .sort((a, b) => Number(a[0].replace(/#/g, '')) - Number(b[0].replace(/#/g, '')))
    .map(([key, info]) => ({
      key,
      context: info.context,
      occurrences: info.count,
    }));

  return {
    placeholders,
    detectedSections: Array.from(sectionCandidates),
  };
}

export async function generateDocxFromTemplate(params: {
  templateBuffer: Buffer;
  placeholders: Record<string, string>;
  sections?: IcMemoSectionsData;
}): Promise<{ buffer: Buffer; replacedPlaceholders: number }> {
  const zip = await JSZip.loadAsync(params.templateBuffer);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  let replacedPlaceholders = 0;

  const xmlPaths = Object.keys(zip.files).filter(
    (name) => name === 'word/document.xml' || /^word\/(header|footer)\d+\.xml$/.test(name)
  );

  for (const xmlPath of xmlPaths) {
    const file = zip.file(xmlPath);
    if (!file) continue;
    const content = await file.async('string');
    const doc = parser.parseFromString(content, 'text/xml');

    const paragraphs = Array.from(doc.getElementsByTagName('w:p'));
    for (const p of paragraphs) {
      replacedPlaceholders += replaceParagraphPlaceholders(p, params.placeholders);
    }

    if (xmlPath === 'word/document.xml' && params.sections) {
      injectIcMemoSections(doc, params.sections);
    }

    zip.file(xmlPath, serializer.serializeToString(doc));
  }

  const out = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return { buffer: out, replacedPlaceholders };
}
