// SPDX-License-Identifier: AGPL-3.0-only

// The line-wrapper of every exported story picture: Funny Multi's still and
// video footer and Funny One's still. Promoted in Step 73 from three identical
// copies that broke lines only at spaces. Chinese and Japanese are written
// without spaces, so a whole Mandarin, Cantonese or Japanese story was one
// "word", drawn as a single line and cut off at the canvas edge — every zh and
// ja still since T-5.2, found when Cantonese arrived.
//
// A line may break at whitespace, as before, and between any two Han or kana
// characters. Closing punctuation (。，」 and the like, small kana, ー) stays
// with the character before it and an opening bracket with the one after, so
// no line starts with a comma or ends on an open quote. Text with spaces wraps
// exactly as it did.

/** The one method wrapping needs; a CanvasRenderingContext2D satisfies it. */
export interface TextMeasurer {
  measureText(text: string): { width: number };
}

const CJK = '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}';
const OPEN = '「『（《〈【〔“‘';
const CLOSE = '、。，．！？：；」』）》〉】〕”’…・ーぁぃぅぇぉっゃゅょァィゥェォッャュョ';
// A whitespace run; one Han or kana character with its brackets and closing
// marks; or a run of anything else, up to whitespace or the next such
// character (so "AI圖片" is three units and "GitHub 上" keeps its space).
const UNIT = new RegExp(
  `\\s+|[${OPEN}]*[${CJK}][${CLOSE}]*|[^\\s${CJK}]+?(?=\\s|[${OPEN}]*[${CJK}]|$)`,
  'gu',
);

/**
 * Greedy wrap of `text` into lines no wider than `maxWidth`, as measured by
 * `ctx`. A unit wider than `maxWidth` on its own still gets a line of its own.
 */
export function wrapText(ctx: TextMeasurer, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  let space = false;
  for (const unit of text.match(UNIT) ?? []) {
    if (/^\s/u.test(unit)) {
      space = line !== '';
      continue;
    }
    const test = line + (space ? ' ' : '') + unit;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = unit;
    } else {
      line = test;
    }
    space = false;
  }
  if (line) lines.push(line);
  return lines;
}
