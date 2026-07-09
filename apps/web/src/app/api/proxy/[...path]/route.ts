import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getTargetPath(path: string[]): string {
  const cleaned = path[0] === 'api' ? path.slice(1) : path;
  return '/api/' + cleaned.join('/');
}

async function fetchWithAuth(url: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  return res;
}

function streamResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
  };
  const contentLength = res.headers.get('content-length');
  if (contentLength) headers['Content-Length'] = contentLength;

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

  return new Response(stream, { status: res.status, statusText: res.statusText, headers });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = getTargetPath(path);
  const body = await req.json().catch(() => undefined);

  const res = await fetchWithAuth(`${API_URL}${targetPath}`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = getTargetPath(path);
  const queryString = req.nextUrl.searchParams.toString();
  const fullUrl = `${API_URL}${targetPath}${queryString ? `?${queryString}` : ''}`;
  const isSSE = req.nextUrl.searchParams.get('_sse') === '1';

  const res = await fetchWithAuth(fullUrl);

  if (isSSE) {
    return streamResponse(res);
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.startsWith('application/pdf') || contentType.startsWith('application/octet-stream')) {
    return streamResponse(res);
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
