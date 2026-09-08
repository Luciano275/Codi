import { createReadStream } from 'fs';
import { Readable } from 'stream';

const LF = 0x0a;
const WHITE_BYTES = new Set([0x09, LF, 0x0b, 0x0c, 0x0d, 0x20]);

export async function whiteDiff(outputPath: string, expected: Buffer): Promise<boolean> {
  const outputLines = canonicalLines(createReadStream(outputPath));
  const expectedLines = canonicalLines(Readable.from([expected]));

  while (true) {
    const [actual, wanted] = await Promise.all([outputLines.next(), expectedLines.next()]);
    if (actual.done && wanted.done) return true;
    if (actual.done) return remainingLinesAreEmpty(wanted.value, expectedLines);
    if (wanted.done) return remainingLinesAreEmpty(actual.value, outputLines);
    if (!actual.value.equals(wanted.value)) return false;
  }
}

async function remainingLinesAreEmpty(
  current: Buffer | undefined,
  lines: AsyncGenerator<Buffer>,
): Promise<boolean> {
  if (current?.length) return false;
  for await (const line of lines) {
    if (line.length) return false;
  }
  return true;
}

async function* canonicalLines(source: Readable): AsyncGenerator<Buffer> {
  let chunks: Buffer[] = [];
  let length = 0;
  let pendingSpace = false;
  let sawInputOnLine = false;

  for await (const rawChunk of source) {
    const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);
    for (const byte of chunk) {
      if (byte === LF) {
        yield Buffer.concat(chunks, length);
        chunks = [];
        length = 0;
        pendingSpace = false;
        sawInputOnLine = false;
      } else if (WHITE_BYTES.has(byte)) {
        if (length > 0) pendingSpace = true;
        sawInputOnLine = true;
      } else {
        const bytes = pendingSpace ? Buffer.from([0x20, byte]) : Buffer.from([byte]);
        chunks.push(bytes);
        length += bytes.length;
        pendingSpace = false;
        sawInputOnLine = true;
      }
    }
  }

  if (sawInputOnLine || length > 0) yield Buffer.concat(chunks, length);
}
