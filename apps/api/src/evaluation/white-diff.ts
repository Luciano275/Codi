const LF = 0x0a;
const WHITE_BYTES = new Set([0x09, LF, 0x0b, 0x0c, 0x0d, 0x20]);

export async function whiteDiff(actual: Buffer, expected: Buffer): Promise<boolean> {
  const outputLines = canonicalLines(actual);
  const expectedLines = canonicalLines(expected);

  while (true) {
    const [actualLine, wantedLine] = [outputLines.next(), expectedLines.next()];
    if (actualLine.done && wantedLine.done) return true;
    if (actualLine.done) return remainingLinesAreEmpty(wantedLine.value, expectedLines);
    if (wantedLine.done) return remainingLinesAreEmpty(actualLine.value, outputLines);
    if (!actualLine.value.equals(wantedLine.value)) return false;
  }
}

function remainingLinesAreEmpty(
  current: Buffer | undefined,
  lines: IterableIterator<Buffer>,
): boolean {
  if (current?.length) return false;
  for (const line of lines) {
    if (line.length) return false;
  }
  return true;
}

function* canonicalLines(source: Buffer): IterableIterator<Buffer> {
  let chunks: Buffer[] = [];
  let length = 0;
  let pendingSpace = false;
  let sawInputOnLine = false;

  for (const byte of source) {
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

  if (sawInputOnLine || length > 0) yield Buffer.concat(chunks, length);
}
