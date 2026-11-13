import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler from './api/health.js';
import clarifyHandler from './api/letters/clarify.js';
import summarizeHandler from './api/letters/summarize.js';
import generateHandler from './api/letters/generate.js';
import refineHandler from './api/letters/refine.js';
import missingRouteHandler from './api/[...path].js';
import { sendJson } from './api/_lib/http.js';
import { ApiErrorCode } from './api/_lib/letterService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // Catch malformed JSON payloads on /api/* and return JSON instead of Express HTML
  app.use('/api', (err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      sendJson(res, 400, {
        code: ApiErrorCode.ValidationError,
        error: 'Invalid JSON body in request.',
      });
      return;
    }
    next(err);
  });

  // Mount the exact Vercel Serverless Function handlers so AI Studio and Vercel behave identically
  app.all('/api/health', (req: Request, res: Response) => {
    healthHandler(req, res);
  });

  app.all('/api/letters/clarify', (req: Request, res: Response) => {
    void clarifyHandler(req, res);
  });

  app.all('/api/letters/summarize', (req: Request, res: Response) => {
    void summarizeHandler(req, res);
  });

  app.all('/api/letters/generate', (req: Request, res: Response) => {
    void generateHandler(req, res);
  });

  app.all('/api/letters/refine', (req: Request, res: Response) => {
    void refineHandler(req, res);
  });

  // Ensure unknown /api/* routes always return structured 404 JSON (MISSING_ROUTE)
  app.all('/api/*', (req: Request, res: Response) => {
    missingRouteHandler(req, res);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
