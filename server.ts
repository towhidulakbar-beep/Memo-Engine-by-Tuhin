import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import http from 'http';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DocumentCategory, MemoType } from './src/types/memo.ts';
import {
  buildDefaultIcMemoDocx,
  buildStarterTemplateForFutureMemo,
} from './server/services/defaultTemplateBuilder.ts';
import { extractRawTextFromBuffer, processUploadedDocument } from './server/services/documentParser.ts';
import { generateDocxFromTemplate, inspectDocxTemplate } from './server/services/docxEngine.ts';
import { scrutinizeBranchProposalWithGemini } from './server/services/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_DOC_EXTENSIONS = new Set(['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt', '.png', '.jpg', '.jpeg']);
const ALLOWED_TEMPLATE_EXTENSIONS = new Set(['.docx']);

interface CachedDocEntry {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  textPreview: string;
}

const docCache = new Map<string, CachedDocEntry>();

function storeCachedDoc(entry: CachedDocEntry): string {
  const id = crypto.randomBytes(12).toString('hex');
  if (docCache.size >= 40) {
    const oldestKey = docCache.keys().next().value;
    if (oldestKey) docCache.delete(oldestKey);
  }
  docCache.set(id, entry);
  return id;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 35 * 1024 * 1024,
    files: 20,
  },
});

function hasAllowedExtension(fileName: string, allowed: Set<string>): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return allowed.has(ext);
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/documents/extract', upload.array('files', 20), async (req, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        res.status(400).json({ error: 'No files uploaded.' });
        return;
      }

      let categories: Array<DocumentCategory | undefined> = [];
      if (typeof req.body?.categories === 'string') {
        try {
          const parsed = JSON.parse(req.body.categories);
          if (Array.isArray(parsed)) {
            categories = parsed;
          }
        } catch {
          categories = [req.body.categories as DocumentCategory];
        }
      } else if (Array.isArray(req.body?.categories)) {
        categories = req.body.categories;
      }

      for (const f of files) {
        if (!hasAllowedExtension(f.originalname, ALLOWED_DOC_EXTENSIONS)) {
          res.status(400).json({
            error: `Unsupported file format: ${f.originalname}. Allowed: PDF, DOCX, XLSX, XLS, CSV, TXT, PNG, JPG.`,
          });
          return;
        }
      }

      const results = await Promise.all(
        files.map(async (file, idx) => {
          const assignedCategory = categories[idx];
          const extracted = await processUploadedDocument({
            buffer: file.buffer,
            fileName: file.originalname,
            mimeType: file.mimetype,
            assignedCategory,
          });

          let textPreview = '';
          if (
            extracted.detectedCategory === 'branch_proposal' ||
            extracted.detectedCategory === 'cib_report'
          ) {
            const raw = await extractRawTextFromBuffer(
              file.buffer,
              file.originalname,
              file.mimetype,
              extracted.detectedCategory === 'cib_report' ? 4 : 8
            );
            textPreview = raw.fullText;
          }

          const serverDocId = storeCachedDoc({
            buffer: file.buffer,
            fileName: file.originalname,
            mimeType: file.mimetype,
            textPreview,
          });

          return {
            ...extracted,
            serverDocId,
          };
        })
      );

      res.json({ results });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Document extraction failed.',
      });
    }
  });

  app.post('/api/ic-memo/scrutinize', upload.single('branchProposal'), async (req, res) => {
    try {
      const branchProposalDocId =
        typeof req.body?.branchProposalDocId === 'string' ? req.body.branchProposalDocId : '';
      const cibDocId = typeof req.body?.cibDocId === 'string' ? req.body.cibDocId : '';
      const cibSummaryTextFromBody =
        typeof req.body?.cibSummaryText === 'string' ? req.body.cibSummaryText : '';

      let currentPlaceholders: Record<string, string> = {};
      if (typeof req.body?.currentPlaceholders === 'string') {
        currentPlaceholders = JSON.parse(req.body.currentPlaceholders);
      } else if (req.body?.currentPlaceholders && typeof req.body.currentPlaceholders === 'object') {
        currentPlaceholders = req.body.currentPlaceholders;
      }

      let bpBuffer: Buffer | undefined;
      let bpMime: string | undefined;
      let bpName: string | undefined;
      let bpText = '';

      if (req.file) {
        bpBuffer = req.file.buffer;
        bpMime = req.file.mimetype;
        bpName = req.file.originalname;
        const raw = await extractRawTextFromBuffer(bpBuffer, bpName, bpMime, 10);
        bpText = raw.fullText;
      } else if (branchProposalDocId && docCache.has(branchProposalDocId)) {
        const cached = docCache.get(branchProposalDocId)!;
        bpBuffer = cached.buffer;
        bpMime = cached.mimeType;
        bpName = cached.fileName;
        bpText = cached.textPreview;
      } else {
        const samplePath = path.resolve(__dirname, 'public/assets/aistudio/Branch_Proposal_07ded1a7.pdf');
        if (fs.existsSync(samplePath)) {
          bpText = typeof req.body?.branchProposalText === 'string' ? req.body.branchProposalText : '';
        }
      }

      if (!bpBuffer && !bpText) {
        res.status(400).json({
          error: 'Please upload a Branch Proposal document in Manual Inputs before running AI Scrutiny.',
        });
        return;
      }

      let cibSummaryText = cibSummaryTextFromBody;
      if (!cibSummaryText && cibDocId && docCache.has(cibDocId)) {
        cibSummaryText = docCache.get(cibDocId)!.textPreview;
      }

      const scrutinized = await scrutinizeBranchProposalWithGemini({
        branchProposalBuffer: bpBuffer,
        branchProposalMimeType: bpMime,
        branchProposalFileName: bpName,
        branchProposalText: bpText,
        cibSummaryText,
        currentPlaceholders,
      });

      res.json({ sections: scrutinized });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'AI scrutiny failed.',
      });
    }
  });

  app.post('/api/templates/inspect', upload.single('template'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No Word template uploaded.' });
        return;
      }
      if (!hasAllowedExtension(file.originalname, ALLOWED_TEMPLATE_EXTENSIONS)) {
        res.status(400).json({ error: 'Only .docx Word templates are supported.' });
        return;
      }

      const inspection = await inspectDocxTemplate(file.buffer);
      res.json({
        fileName: file.originalname,
        placeholders: inspection.placeholders,
        detectedSections: inspection.detectedSections,
        fileBase64: file.buffer.toString('base64'),
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to inspect .docx template.',
      });
    }
  });

  app.get('/api/templates/default/:memoType', async (req, res) => {
    try {
      const memoType = req.params.memoType as MemoType;
      let buffer: Buffer;
      let fileName: string;

      if (memoType === 'ic_memo') {
        buffer = await buildDefaultIcMemoDocx();
        fileName = 'IC Memo Standard SAMD Template.docx';
      } else if (memoType === 'mec_memo' || memoType === 'board_memo' || memoType === 'sanction') {
        buffer = await buildStarterTemplateForFutureMemo(memoType);
        fileName = `${memoType.toUpperCase()} Starter Template.docx`;
      } else {
        res.status(400).json({ error: 'Invalid memo type.' });
        return;
      }

      if (req.query.download === '1') {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(buffer);
        return;
      }

      const inspection = await inspectDocxTemplate(buffer);
      res.json({
        fileName,
        placeholders: inspection.placeholders,
        detectedSections: inspection.detectedSections,
        fileBase64: buffer.toString('base64'),
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to build default template.',
      });
    }
  });

  app.post('/api/templates/generate', async (req, res) => {
    try {
      const { templateBase64, placeholders, sections } = req.body as {
        templateBase64?: string;
        placeholders?: Record<string, string>;
        sections?: unknown;
      };

      if (!templateBase64) {
        res.status(400).json({ error: 'Template data is missing.' });
        return;
      }

      const templateBuffer = Buffer.from(templateBase64, 'base64');
      const generated = await generateDocxFromTemplate({
        templateBuffer,
        placeholders: placeholders || {},
        sections: sections as never,
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader('X-Replaced-Count', String(generated.replacedPlaceholders));
      res.send(generated.buffer);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate Word document.',
      });
    }
  });

  const httpServer = http.createServer(app);
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Memo Engine by Tuhin running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
