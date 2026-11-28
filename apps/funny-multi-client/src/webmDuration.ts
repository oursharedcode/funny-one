// SPDX-License-Identifier: AGPL-3.0-only
//
// Writes a recording's length into a WebM that lacks it (Step 135). Older
// Chromium's MediaRecorder streams its WebM out as it goes — a Segment of
// unknown size whose Info has no Duration — so a player shows no length and
// cannot seek, which a 35 s whole-game video needs. This adds the one Duration
// element. Only that shape is touched: anything else — a length already there
// (Chromium 158 writes it itself), a Segment of known size, a SeekHead whose
// offsets would move, or not a WebM at all — is handed back as it came.

const EBML = 0x1a45dfa3;
const SEGMENT = 0x18538067;
const SEEK_HEAD = 0x114d9b74;
const INFO = 0x1549a966;
const CLUSTER = 0x1f43b675;
const TIMECODE_SCALE = 0x2ad7b1;
const DURATION = 0x4489;
// Chromium's header is a few hundred bytes; the length goes in near the start.
const HEAD_BYTES = 4096;

interface Element {
  id: number;
  start: number;
  data: number;
  /** Null for a size left unknown. */
  size: number | null;
}

/** An EBML variable-length integer says its own length in its first byte. */
function vintLength(first: number): number {
  for (let length = 1; length <= 8; length++) {
    if (first & (0x80 >> (length - 1))) return length;
  }
  return 0;
}

function readElement(bytes: Uint8Array, start: number): Element | null {
  const idLength = vintLength(bytes[start] ?? 0);
  if (!idLength || idLength > 4) return null;
  let id = 0;
  for (let i = 0; i < idLength; i++) id = id * 256 + (bytes[start + i] ?? 0);
  const sizeAt = start + idLength;
  const sizeLength = vintLength(bytes[sizeAt] ?? 0);
  if (!sizeLength || sizeAt + sizeLength > bytes.length) return null;
  const marker = 0x80 >> (sizeLength - 1);
  let size = (bytes[sizeAt] ?? 0) & (marker - 1);
  let unknown = size === marker - 1;
  for (let i = 1; i < sizeLength; i++) {
    const byte = bytes[sizeAt + i] ?? 0;
    size = size * 256 + byte;
    unknown = unknown && byte === 0xff;
  }
  return { id, start, data: sizeAt + sizeLength, size: unknown ? null : size };
}

/** An element's size written in eight bytes, which any value fits. */
function longSize(size: number): number[] {
  const out = [0x01, 0, 0, 0, 0, 0, 0, 0];
  let rest = size;
  for (let i = 7; i > 0; i--) {
    out[i] = rest % 256;
    rest = Math.floor(rest / 256);
  }
  return out;
}

/**
 * The file's first bytes with a Duration added to its Info, and how many of
 * the old bytes they replace; null when the file is to be left alone.
 */
export function withDuration(
  bytes: Uint8Array,
  durationMs: number,
): { head: Uint8Array<ArrayBuffer>; replaces: number } | null {
  const ebml = readElement(bytes, 0);
  if (ebml?.id !== EBML || ebml.size === null) return null;
  const segment = readElement(bytes, ebml.data + ebml.size);
  if (segment?.id !== SEGMENT || segment.size !== null) return null;

  let info: Element | null = null;
  for (let at = segment.data; !info;) {
    const element = readElement(bytes, at);
    if (!element || element.size === null) return null;
    if (element.id === SEEK_HEAD || element.id === CLUSTER) return null;
    if (element.id === INFO) info = element;
    at = element.data + element.size;
  }
  const end = info.data + (info.size ?? 0);
  if (end > bytes.length) return null;

  // Duration is counted in TimecodeScale nanoseconds, a millisecond by default.
  let scale = 1_000_000;
  for (let at = info.data; at < end;) {
    const element = readElement(bytes, at);
    if (!element || element.size === null || element.id === DURATION) return null;
    if (element.id === TIMECODE_SCALE) {
      scale = bytes
        .subarray(element.data, element.data + element.size)
        .reduce((value, byte) => value * 256 + byte, 0);
    }
    at = element.data + element.size;
  }
  if (!scale) return null;

  const duration = new Uint8Array(11);
  duration.set([0x44, 0x89, 0x88]);
  new DataView(duration.buffer).setFloat64(3, (durationMs * 1_000_000) / scale);

  const head = Uint8Array.from([
    ...bytes.subarray(0, info.start),
    // Info's four-byte id, then its new size.
    ...bytes.subarray(info.start, info.start + 4),
    ...longSize(end - info.data + duration.length),
    ...bytes.subarray(info.data, end),
    ...duration,
  ]);
  return { head, replaces: end };
}

/** `blob` with its length written in, or `blob` itself. */
export async function setWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  try {
    const start = new Uint8Array(await blob.slice(0, HEAD_BYTES).arrayBuffer());
    const patched = withDuration(start, durationMs);
    if (!patched) return blob;
    return new Blob([patched.head, blob.slice(patched.replaces)], { type: blob.type });
  } catch {
    // A length is not worth losing the video over.
    return blob;
  }
}
