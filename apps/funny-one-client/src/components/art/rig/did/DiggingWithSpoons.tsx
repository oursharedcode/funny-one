// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.digging-with-spoons` (T-FO-4.1, see ../RIG_ART.md). A shallow dirt
// pit with two bent spoons stuck in the ground and a small mound of flung dirt.

interface Props {
  className?: string;
}

export default function DiggingWithSpoons({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* pit */}
      <path d="M14 78 q36 16 72 0 q-6 -16 -36 -16 q-30 0 -36 16 z" fill="#f59e0b" opacity="0.35" />
      <path d="M14 78 q36 16 72 0" stroke="#1f2937" strokeWidth="2.2" fill="none" />

      {/* flung dirt mound */}
      <g fill="#f59e0b" stroke="#1f2937" strokeWidth="1.6" opacity="0.8">
        <circle cx="24" cy="86" r="4" />
        <circle cx="32" cy="90" r="5" />
        <circle cx="40" cy="87" r="3.5" />
      </g>

      {/* two bent spoons stuck in the dirt */}
      <g stroke="#1f2937" strokeWidth="2.5" fill="#60a5fa">
        <path d="M46 30 q-6 24 4 46" fill="none" />
        <ellipse cx="44" cy="24" rx="8" ry="10" transform="rotate(-15 44 24)" />

        <path d="M66 26 q8 22 -2 48" fill="none" />
        <ellipse cx="68" cy="20" rx="8" ry="10" transform="rotate(12 68 20)" />
      </g>
    </svg>
  );
}
