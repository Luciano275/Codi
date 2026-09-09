import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface IslandModelResponse {
  slug: string;
  modelPath: string;
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = (await cookies()).get('session')?.value;
  const islandsResponse = await fetch(`${API_URL}/api/courses/islands`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (!islandsResponse.ok) {
    return NextResponse.json(
      { message: 'No se pudo obtener el modelo de la isla.' },
      { status: 404 },
    );
  }

  const islands = (await islandsResponse.json()) as IslandModelResponse[];
  const island = islands.find((candidate) => candidate.slug === slug);
  if (!island) {
    return NextResponse.json({ message: 'No se encontró la isla.' }, { status: 404 });
  }

  const modelPath = island.modelPath || '/islands/isla.glb';
  const modelUrl = modelPath.startsWith('/')
    ? new URL(modelPath, request.url).toString()
    : modelPath;
  const range = request.headers.get('range');
  const modelResponse = await fetch(modelUrl, {
    headers: range ? { Range: range } : {},
    cache: 'no-store',
  });
  if (!modelResponse.ok || !modelResponse.body) {
    return NextResponse.json(
      { message: 'No se pudo cargar el modelo de la isla.' },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers({
    'Content-Type': modelResponse.headers.get('content-type') || 'model/gltf-binary',
    'Cache-Control': 'private, max-age=3600',
  });
  ['accept-ranges', 'content-length', 'content-range', 'etag', 'last-modified'].forEach((header) => {
    const value = modelResponse.headers.get(header);
    if (value) responseHeaders.set(header, value);
  });

  return new Response(modelResponse.body, {
    status: modelResponse.status,
    headers: responseHeaders,
  });
}
