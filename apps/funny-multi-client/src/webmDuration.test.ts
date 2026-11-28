// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { withDuration } from './webmDuration';

const EBML = [0x1a, 0x45, 0xdf, 0xa3];
const SEGMENT = [0x18, 0x53, 0x80, 0x67];
const SEEK_HEAD = [0x11, 0x4d, 0x9b, 0x74];
const INFO = [0x15, 0x49, 0xa9, 0x66];
const CLUSTER = [0x1f, 0x43, 0xb6, 0x75];
const UNKNOWN = [0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
// TimecodeScale 1,000,000 ns.
const SCALE = [0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40];

const element = (id: number[], data: number[]): number[] => [...id, 0x80 | data.length, ...data];
const cluster = [...CLUSTER, ...UNKNOWN, 0xaa, 0xbb];

/** A file in the shape Chromium's MediaRecorder writes. */
function webm(between: number[] = [], segmentSize = UNKNOWN): Uint8Array {
  return Uint8Array.from([
    ...element(EBML, [0]),
    ...SEGMENT,
    ...segmentSize,
    ...between,
    ...element(INFO, SCALE),
    ...cluster,
  ]);
}

describe('withDuration', () => {
  it('adds the length to the Info and leaves the rest as it was', () => {
    const file = webm();
    const patched = withDuration(file, 35_000)!;
    const out = [...patched.head, ...file.subarray(patched.replaces)];
    expect(out.slice(-cluster.length)).toEqual(cluster);
    // The Duration element is the Info's last: an 8-byte float of milliseconds.
    const duration = patched.head.slice(patched.head.length - 11);
    expect([...duration.subarray(0, 3)]).toEqual([0x44, 0x89, 0x88]);
    expect(new DataView(duration.buffer).getFloat64(3)).toBe(35_000);
    // Eleven bytes of Duration, and an Info size grown from one byte to eight.
    expect(out.length).toBe(file.length + 11 + 7);
    // Patched once, it is left alone.
    expect(withDuration(Uint8Array.from(out), 35_000)).toBeNull();
  });

  it.each([
    ['not a WebM', Uint8Array.from([1, 2, 3, 4, 5])],
    ['a Segment of known size', webm([], [0x01, 0, 0, 0, 0, 0, 0, 40])],
    ['a SeekHead whose offsets would move', webm(element(SEEK_HEAD, [0]))],
    ['pictures before any Info', webm([...CLUSTER, 0x80])],
    ['an empty file', new Uint8Array(0)],
  ])('leaves %s alone', (_name, bytes) => {
    expect(withDuration(bytes, 5000)).toBeNull();
  });
});
