// SPDX-License-Identifier: AGPL-3.0-only

// Build-time constants injected by Vite (see vite.config.ts). Surfaced by the
// source footer so a player can tell which deploy is running.
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

export const APP_VERSION: string = __APP_VERSION__;
export const BUILD_DATE: string = __BUILD_DATE__;
