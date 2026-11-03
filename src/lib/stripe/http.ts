// OWNER: P1
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const errorJson = (message: string, status: number) => Response.json({ error: message }, { status });
/** Maps any thrown value to a safe `{error}` response; never leaks Stripe/internal messages. */
export function toErrorResponse(error: unknown, context: string): Response {
  if (error instanceof HttpError) return errorJson(error.message, error.status);
  console.error(`[connect] ${context} failed`, error instanceof Error ? error.name : 'unknown');
  return errorJson('Connect request failed', 502);
}
export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { throw new HttpError(400, 'Invalid JSON body'); }
}
