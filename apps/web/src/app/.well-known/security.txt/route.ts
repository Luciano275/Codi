import { NextResponse } from 'next/server';

export async function GET() {
  const securityTxt = `Contact: mailto:security@codi.app
Encryption: https://codi.app/.well-known/pgp-key.txt
Preferred-Languages: es, en
Canonical: https://codi.app/.well-known/security.txt
Policy: https://codi.app/security-policy
`;

  return new NextResponse(securityTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
