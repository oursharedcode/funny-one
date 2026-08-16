// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareFiles, downloadFile, shareFiles } from './share';

function probeFile(): File {
  return new File(['x'], 'x.png', { type: 'image/png' });
}

describe('canShareFiles', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'canShare');
  });

  it('is false when the platform has no canShare', () => {
    expect(canShareFiles()).toBe(false);
  });

  it('is true when canShare accepts a probe file', () => {
    Object.assign(navigator, { canShare: () => true });
    expect(canShareFiles()).toBe(true);
  });

  it('is false when canShare rejects the probe (e.g. desktop Firefox)', () => {
    Object.assign(navigator, { canShare: () => false });
    expect(canShareFiles()).toBe(false);
  });

  it('is false when canShare throws', () => {
    Object.assign(navigator, {
      canShare: () => {
        throw new Error('nope');
      },
    });
    expect(canShareFiles()).toBe(false);
  });
});

describe('shareFiles', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'share');
    Reflect.deleteProperty(navigator, 'canShare');
  });

  it('is unsupported when the platform has no navigator.share', async () => {
    await expect(shareFiles([probeFile()])).resolves.toBe('unsupported');
  });

  it('is unsupported when canShare declines this payload', async () => {
    Object.assign(navigator, {
      share: vi.fn(),
      canShare: () => false,
    });
    await expect(shareFiles([probeFile()])).resolves.toBe('unsupported');
    expect(navigator.share).not.toHaveBeenCalled();
  });

  it('shares and resolves "shared" on success', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share, canShare: () => true });
    await expect(shareFiles([probeFile()], { title: 't', text: 'x' })).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: 't', text: 'x', files: [expect.any(File)] }),
    );
  });

  it('resolves "cancelled" when the user dismisses the share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'));
    Object.assign(navigator, { share, canShare: () => true });
    await expect(shareFiles([probeFile()])).resolves.toBe('cancelled');
  });

  it('resolves "unsupported" on any other share failure', async () => {
    const share = vi.fn().mockRejectedValue(new Error('boom'));
    Object.assign(navigator, { share, canShare: () => true });
    await expect(shareFiles([probeFile()])).resolves.toBe('unsupported');
  });
});

describe('downloadFile', () => {
  it('drives a synthetic anchor click and revokes the object URL', () => {
    const objectUrl = 'blob:stub';
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const file = new File(['x'], 'story.png', { type: 'image/png' });
    downloadFile(file);

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
    expect(document.querySelectorAll('a[download]').length).toBe(0);
  });
});
