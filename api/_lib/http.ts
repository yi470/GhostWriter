import type { IncomingMessage, ServerResponse } from 'http';
import { ApiErrorCode, AppApiError } from './letterService.js';

export type ServerlessRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, unknown>;
  url?: string;
  method?: string;
};

export type ServerlessResponse = ServerResponse & {
  status?: (code: number) => ServerlessResponse;
  json?: (body: unknown) => void;
};

export function sendJson(
  res: ServerlessResponse,
  statusCode: number,
  payload: Record<string, unknown>
): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function ensurePostMethod(req: ServerlessRequest, res: ServerlessResponse): boolean {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'POST, OPTIONS');
    res.end();
    return false;
  }

  if (method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    sendJson(res, 405, {
      code: ApiErrorCode.MethodNotAllowed,
      error: `Method ${method} is not allowed on this endpoint. Send a POST request with JSON.`,
    });
    return false;
  }

  return true;
}

export async function readJsonBody(req: ServerlessRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return req.body as Record<string, unknown>;
    }
    if (typeof req.body === 'string') {
      if (!req.body.trim()) return {};
      try {
        const parsed = JSON.parse(req.body) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('JSON root must be an object');
        }
        return parsed as Record<string, unknown>;
      } catch {
        throw new AppApiError(
          ApiErrorCode.ValidationError,
          400,
          'Invalid JSON body in request.'
        );
      }
    }
    if (Buffer.isBuffer(req.body)) {
      const str = req.body.toString('utf8').trim();
      if (!str) return {};
      try {
        const parsed = JSON.parse(str) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('JSON root must be an object');
        }
        return parsed as Record<string, unknown>;
      } catch {
        throw new AppApiError(
          ApiErrorCode.ValidationError,
          400,
          'Invalid JSON body in request.'
        );
      }
    }
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  const maxBytes = 1024 * 1024; // 1MB

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    totalBytes += buf.length;
    if (totalBytes > maxBytes) {
      throw new AppApiError(
        ApiErrorCode.ValidationError,
        413,
        'Request payload exceeds 1MB limit.'
      );
    }
    chunks.push(buf);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('JSON root must be an object');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new AppApiError(
      ApiErrorCode.ValidationError,
      400,
      'Invalid JSON body in request.'
    );
  }
}

export function handleEndpointError(
  res: ServerlessResponse,
  endpointName: string,
  err: unknown
): void {
  console.error(`[API Error in ${endpointName}]`, err);

  if (err instanceof AppApiError) {
    sendJson(res, err.status, {
      code: err.code,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  const raw = err instanceof Error ? err.message : String(err);
  sendJson(res, 502, {
    code: ApiErrorCode.UpstreamModelFailure,
    error: 'Upstream model failure: Could not complete the request right now. Please try again.',
    details: raw,
  });
}
