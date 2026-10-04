// SPDX-License-Identifier: AGPL-3.0-only

// T-9.4 (FM-TIER-4). Both the ♥ affordance and the end-screen entry point
// must vanish together when the deployer set no rail at all — this is the
// one place that rule lives. B-1c (FM-APP-3) adds the other reason they
// vanish: inside the Android store app, which offers no gifts.

import type { SupportConfig } from '@funny/shared';
import { isStoreShell } from './storeShell';

export function hasAnyRail(support: SupportConfig | null): boolean {
  if (isStoreShell()) return false;
  return support !== null && Object.values(support).some((value) => value !== null);
}
