import * as bcrypt from 'bcryptjs';

export function verifyCmsPassword(stored: string, input: string): boolean {
  const [method, ...rest] = stored.split(':');
  const payload = rest.join(':');
  if (method === 'bcrypt') {
    return bcrypt.compareSync(input, payload);
  }
  if (method === 'plaintext') {
    return payload === input;
  }
  throw new Error(`Unknown authentication method: ${method}`);
}
