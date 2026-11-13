import {
  ensurePostMethod,
  handleEndpointError,
  readJsonBody,
  sendJson,
  type ServerlessRequest,
  type ServerlessResponse,
} from '../_lib/http.js';
import { generateFormalLetter } from '../_lib/letterService.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  if (!ensurePostMethod(req, res)) return;

  try {
    const body = await readJsonBody(req);
    const result = await generateFormalLetter(body);
    sendJson(res, 200, result);
  } catch (err: unknown) {
    handleEndpointError(res, 'POST /api/letters/generate', err);
  }
}
