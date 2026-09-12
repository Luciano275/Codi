const encoder = new TextEncoder();

export async function authenticate(
  request: Request,
  secret: string | undefined,
): Promise<Response | null> {
  if (!secret)
    return Response.json({ error: 'Evaluator secret is not configured' }, { status: 503 });

  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!(await secretsMatch(token, secret))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

async function secretsMatch(received: string, expected: string): Promise<boolean> {
  const [receivedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(received)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(receivedDigest);
  const right = new Uint8Array(expectedDigest);
  let difference = received.length === expected.length ? 0 : 1;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}
