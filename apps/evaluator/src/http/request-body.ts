import type { z } from 'zod';

const MAX_REQUEST_BYTES = 8 * 1024 * 1024;

export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json');
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) throw new HttpError(413, 'Request body is too large');

  const body = await readBoundedBody(request);
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new HttpError(400, 'Request body is not valid JSON');
  }

  const result = schema.safeParse(value);
  if (!result.success)
    throw new HttpError(400, 'Request body does not match the evaluator contract');
  return result.data;
}

async function readBoundedBody(request: Request): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new HttpError(413, 'Request body is too large');
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
