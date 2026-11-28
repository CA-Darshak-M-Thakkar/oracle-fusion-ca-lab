import { cfg, json } from './_lib/core.js';
// Public: the Google web client ID is not a secret.
export function GET() { return json({ clientId: cfg.clientId }); }
