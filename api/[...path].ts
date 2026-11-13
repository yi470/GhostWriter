import {
  sendJson,
  type ServerlessRequest,
  type ServerlessResponse,
} from './_lib/http.js';
import { ApiErrorCode } from './_lib/letterService.js';

export default function handler(req: ServerlessRequest, res: ServerlessResponse) {
  const method = (req.method || 'GET').toUpperCase();
  const url = req.url || '/api/unknown';

  sendJson(res, 404, {
    code: ApiErrorCode.MissingRoute,
    error: `API route not found: ${method} ${url}`,
  });
}
