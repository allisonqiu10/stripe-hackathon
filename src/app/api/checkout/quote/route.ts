// OWNER: P2
import { readRequest, prepareCheckout, checkoutError } from '../../../../lib/donation/checkout';
export async function POST(_request: Request, _context: { params: Promise<Record<string, string>> }) {
  try { return Response.json((await prepareCheckout(await readRequest(_request))).quote); }
  catch (error) { return checkoutError(error); }
}
