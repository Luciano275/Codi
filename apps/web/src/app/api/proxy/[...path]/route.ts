import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const cleaned = path[0] === 'api' ? path.slice(1) : path;
  const targetPath = '/api/' + cleaned.join('/');

  const body = await req.json().catch(() => undefined);

  const res = await fetch(`${API_URL}${targetPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const cleaned = path[0] === 'api' ? path.slice(1) : path;
  const targetPath = '/api/' + cleaned.join('/');

  const isSSE = req.nextUrl.searchParams.get('_sse') === '1';

  const res = await fetch(`${API_URL}${targetPath}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (isSSE) {
    // Stream SSE response
    const contentType = res.headers.get('content-type') || '';
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    };

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body?.getReader();
        if (!reader) { controller.close(); return; }
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { controller.close(); break; }
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, { headers });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
