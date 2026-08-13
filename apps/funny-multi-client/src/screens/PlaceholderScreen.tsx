// SPDX-License-Identifier: AGPL-3.0-only

// Scaffolding, deliberately plain.
//
// T-3.1's deliverable is the bootstrap and `App.tsx`'s phase routing, but a
// router needs somewhere to route to, and the six screens land across five
// later tasks (T-3.2 Home/Lobby, T-3.3 Round, T-3.4 Waiting, T-4.4 Reveal,
// T-5.1 End). Each screen file currently renders this: the phase it stands
// for, the task that replaces it, and whatever live state App handed it — so
// the routing is provably wired rather than merely written, and nothing here
// can be mistaken for a finished screen.
//
// Every one of these files is replaced wholesale, not extended.

interface Props {
  /** Phase name, matching `GamePhase` in App.tsx. */
  phase: string;
  /** The task id that replaces this file. */
  task: string;
  /** Live values routed in from App, proving the wiring works. */
  detail?: string;
  children?: React.ReactNode;
}

export default function PlaceholderScreen({ phase, task, detail, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-display text-3xl font-bold text-pink-500">{phase}</p>
      <p className="text-sm text-gray-500">Screen scaffold — implemented by {task}.</p>
      {detail && <p className="font-prose text-lg text-gray-800">{detail}</p>}
      {children}
    </div>
  );
}
