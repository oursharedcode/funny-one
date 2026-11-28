// SPDX-License-Identifier: AGPL-3.0-only

// Home's Christmas dressing (B-29, owner's picks "2 and 4, and slow falling
// big snow crystals", 2026-11-26): what tells a host at a glance that a new
// room comes with the free Christmas pack. HomeScreen shows it on the create
// screen only while a room in the picked language would get the pack
// (`packForRoom`): in its 20 languages, until the free part ends.
//
// - `ChristmasLights`: a string of red, green and gold bulbs along the top
//   edge, twinkling one colour after another.
// - `ChristmasPeek`: the gold-on-green line saying so, with the video's
//   reindeer (public/reindeer/, videoCharacter.ts) peeking up from behind it,
//   both hooves raised with a gold handbell in each (owner, 2026-11-26), and
//   a speech bubble; a tap on either rings the clips' sleigh bells, shakes the
//   reindeer and swings the bells.
// - `Snowfall`: big six-armed snow crystals falling slowly behind the page.
//   App draws it, over the background doodle and under the screens (Step 133,
//   B-29 #9, D1 A): on Home while the dressing shows, and in the room — lobby,
//   rounds, waiting, reveal, end — while the room's pack is on, so it comes
//   and goes with the host's switch and carries on from Home into the room
//   without starting over.
//
// All three are pictures: the lights and the snow are aria-hidden, and the
// line is plain text. Under prefers-reduced-motion nothing moves (index.css);
// the snow then stays where it would rest.

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { withBase } from '../../basePath';
import { SLEIGH_BELLS_PATH } from '../../clipSound';

/** Not the full strength, as on the landing page's buttons. */
export const PEEK_BELLS_VOLUME = 0.5;

const BULB_COLOURS = ['#dc2626', '#16a34a', '#f59e0b'] as const;
// Enough 48 px bulbs for a 2880 px wide window; the rest are cut off.
const BULBS = 60;

export function ChristmasLights() {
  return (
    <div
      aria-hidden="true"
      data-testid="christmas-lights"
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-9 overflow-hidden"
    >
      {Array.from({ length: BULBS }, (_, index) => (
        <svg key={index} className="h-9 w-12 flex-shrink-0" viewBox="0 0 48 36" fill="none">
          <path d="M0 3 Q24 17 48 3" stroke="#14532d" strokeWidth="2" />
          <rect x="21" y="9" width="6" height="6" rx="1" fill="#166534" />
          <g
            className="xmas-bulb"
            style={{
              color: BULB_COLOURS[index % 3],
              animationDelay: `${(index % 3) * 0.55 + (index % 2) * 0.2}s`,
            }}
          >
            <path
              d="M24 14 C17 14 16 23 18.5 28 C20 31 28 31 29.5 28 C32 23 31 14 24 14 Z"
              fill="currentColor"
            />
            <ellipse cx="21.5" cy="20" rx="1.6" ry="3" fill="#fff" opacity="0.65" />
          </g>
        </svg>
      ))}
    </div>
  );
}

export function ChristmasPeek() {
  const { t } = useTranslation();
  const bells = useRef<HTMLAudioElement | null>(null);
  const [taps, setTaps] = useState(0);
  const ring = (): void => {
    if (!bells.current && typeof window.Audio === 'function') {
      bells.current = new window.Audio(withBase(SLEIGH_BELLS_PATH));
    }
    const a = bells.current;
    if (a) {
      a.volume = PEEK_BELLS_VOLUME;
      a.currentTime = 0;
      // A tap may sound; a browser that still refuses leaves it silent.
      a.play().catch(() => {});
    }
    setTaps((n) => n + 1);
  };
  return (
    <div className="relative w-full pt-20">
      <button
        type="button"
        className="absolute right-0 top-0 flex max-w-full items-start gap-1 rounded-xl text-left"
        onClick={ring}
      >
        <span className="relative mt-2 min-w-0 rounded-2xl border-2 border-red-500 bg-white px-3 py-1.5 font-display text-sm font-semibold leading-snug text-red-600 shadow-sm">
          {t('home.christmasPeek')}
          <span
            aria-hidden="true"
            className="absolute -right-[7px] top-3 h-3 w-3 rotate-45 border-r-2 border-t-2 border-red-500 bg-white"
          />
        </span>
        <span aria-hidden="true" className="xmas-peek relative block h-24 w-[120px] flex-shrink-0">
          <motion.span
            key={taps}
            className="absolute inset-y-0 left-[26px] block w-[68px]"
            style={{ originY: 1 }}
            initial={false}
            animate={taps > 0 ? { rotate: [0, -14, 12, -8, 4, 0] } : { rotate: 0 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={withBase('reindeer/torso.png')}
              alt=""
              draggable={false}
              className="absolute left-[9px] top-[48px] w-[50px]"
            />
            <BellArm side="left" rung={taps > 0} />
            <BellArm side="right" rung={taps > 0} />
            <img
              src={withBase('reindeer/head.png')}
              alt=""
              draggable={false}
              className="absolute left-0 top-[4px] w-[68px]"
            />
          </motion.span>
        </span>
      </button>
      <p className="relative z-10 rounded-full border-2 border-amber-400 bg-green-800 px-4 py-2 text-center font-display font-semibold text-amber-300 shadow">
        {t('home.christmasLine')}
      </p>
    </div>
  );
}

// The raised arms, in the 68 px reindeer's own frame: each sleeve starts at
// the sweater's shoulder and turns up and out past the ears.
const ARM_W = 13;
const ARM_H = 43;
const ARM_TURN = 135;
const SHOULDER_X = { left: 19, right: 49 } as const;
const SHOULDER_Y = 56;

function BellArm({ side, rung }: { side: 'left' | 'right'; rung: boolean }) {
  const turn = side === 'left' ? ARM_TURN : -ARM_TURN;
  return (
    <span
      className="absolute block"
      style={{
        left: SHOULDER_X[side] - ARM_W / 2,
        top: SHOULDER_Y,
        width: ARM_W,
        height: ARM_H,
        transformOrigin: '50% 0',
        transform: `rotate(${turn}deg)`,
      }}
    >
      <img
        src={withBase('reindeer/arm.png')}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full"
      />
      {/* The bell hangs from the hoof, upright whatever the arm's turn. */}
      <span
        data-testid="peek-bell"
        className="absolute block"
        style={{
          left: ARM_W / 2 - 11,
          top: ARM_H - 4,
          width: 22,
          height: 26,
          transformOrigin: '50% 0',
          transform: `rotate(${-turn}deg)`,
        }}
      >
        <span
          className="xmas-bell absolute inset-0 block"
          style={{ animationDelay: side === 'left' ? '0s' : '-0.45s' }}
        >
          <motion.span
            className="absolute inset-0 block"
            style={{ originY: 0 }}
            initial={false}
            animate={
              rung
                ? { rotate: side === 'left' ? [0, 34, -28, 20, -10, 0] : [0, -34, 28, -20, 10, 0] }
                : { rotate: 0 }
            }
            transition={{ duration: 0.9 }}
          >
            <HandBell />
          </motion.span>
        </span>
      </span>
    </span>
  );
}

function HandBell() {
  return (
    <svg className="block" width="22" height="26" viewBox="0 0 24 28" fill="none">
      <rect
        x="9.5"
        y="0.8"
        width="5"
        height="7"
        rx="2"
        fill="#dc2626"
        stroke="#2b1d14"
        strokeWidth="1.4"
      />
      <path
        d="M12 6.5 C6.5 6.5 5.5 12 5.5 17 L3 21.5 H21 L18.5 17 C18.5 12 17.5 6.5 12 6.5 Z"
        fill="#f59e0b"
        stroke="#2b1d14"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11 C8.2 13 8 15 8 17"
        stroke="#fde68a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="24" r="2.6" fill="#b45309" stroke="#2b1d14" strokeWidth="1.4" />
    </svg>
  );
}

/** left %, size px, fall s, delay s, where it rests without motion (top %). */
const FLAKES: readonly (readonly [number, number, number, number, number])[] = [
  [4, 50, 22, -3, 12],
  [12, 34, 17, -11, 64],
  [20, 66, 26, -19, 38],
  [29, 42, 19, -6, 84],
  [37, 58, 24, -14, 20],
  [45, 32, 16, -2, 56],
  [53, 72, 28, -22, 74],
  [61, 40, 18, -9, 8],
  [69, 56, 23, -16, 46],
  [77, 38, 20, -4, 90],
  [85, 62, 27, -12, 28],
  [93, 44, 21, -18, 66],
  [33, 30, 15, -8, 4],
  [72, 48, 25, -1, 18],
];

function Crystal({ size }: { size: number }) {
  const arm = (
    <>
      <path d="M0 0 V-44" />
      <path d="M0 -18 L-10 -28 M0 -18 L10 -28" />
      <path d="M0 -31 L-7 -38 M0 -31 L7 -38" />
    </>
  );
  const arms = [0, 60, 120, 180, 240, 300].map((angle) => (
    <g key={angle} transform={`rotate(${angle})`}>
      {arm}
    </g>
  ));
  return (
    <svg
      className="snow-spin block"
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      fill="none"
      strokeLinecap="round"
    >
      <g stroke="#ffffff" strokeWidth="9">
        {arms}
      </g>
      <g stroke="#7dd3fc" strokeWidth="4.5">
        {arms}
      </g>
    </svg>
  );
}

export function Snowfall() {
  return (
    <div
      aria-hidden="true"
      data-testid="snowfall"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {FLAKES.map(([left, size, fall, delay, rest], index) => (
        <span
          key={index}
          className="snow-flake"
          style={
            {
              left: `${left}%`,
              animationDuration: `${fall}s`,
              animationDelay: `${delay}s`,
              '--snow-rest': `${rest}%`,
              '--snow-spin': `${fall * 1.6}s`,
              '--snow-sway': `${4 + (index % 4)}s`,
            } as CSSProperties
          }
        >
          <span className="snow-sway block">
            <Crystal size={size} />
          </span>
        </span>
      ))}
    </div>
  );
}
