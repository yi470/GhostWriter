import {
  sendJson,
  type ServerlessRequest,
  type ServerlessResponse,
} from './_lib/http.js';
import { ApiErrorCode, getApiHealthStatus } from './_lib/letterService.js';

export default function handler(req: ServerlessRequest, res: ServerlessResponse) {
  const method = (req.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    sendJson(res, 405, {
      code: ApiErrorCode.MethodNotAllowed,
      error: `Method ${method} is not allowed on /api/health. Use GET.`,
    });
    return;
  }

  sendJson(res, 200, getApiHealthStatus());
}
