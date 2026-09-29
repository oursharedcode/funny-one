// SPDX-License-Identifier: AGPL-3.0-only

// T-9.4 (FM-TIER-4). Both the ♥ affordance and the end-screen entry point
// must vanish together when the deployer set no rail at all — this is the
// one place that rule lives.

import type { SupportConfig } from '@funny/shared';

export function hasAnyRail(support: SupportConfig | null): boolean {
  return support !== null && Object.values(support).some((value) => value !== null);
}
