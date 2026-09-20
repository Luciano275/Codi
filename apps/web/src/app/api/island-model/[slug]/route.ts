import { NextResponse } from 'next/server';
import { fetchBackendWithSession } from '@/lib/server/backend-api';

interface IslandModelResponse {
  slug: string;
  modelPath: string;
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const islandsResponse = await fetchBackendWithSession('/api/courses/islands');

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
    'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
  });
  ['accept-ranges', 'content-length', 'content-range', 'etag', 'last-modified'].forEach(
    (header) => {
      const value = modelResponse.headers.get(header);
      if (value) responseHeaders.set(header, value);
    },
  );

  return new Response(modelResponse.body, {
    status: modelResponse.status,
    headers: responseHeaders,
  });
}
