// SPDX-License-Identifier: AGPL-3.0-only

// Re-exports of the core data model. Canonical definitions live in
// packages/shared (events.ts + languages.ts) so the client can typecheck
// against the same shapes. Server-internal helpers may augment these with
// narrower types as needed.
//
// Copied from SRC/server/src/types.ts; the only change is the package
// specifier ('shared' -> '@funny/shared'). Every type SRC re-exported here
// still exists in the barrel. PictureRef is new (design §5, FM-IMG-3) and is
// added because the reveal/gallery payloads that T-2.3 and T-4.4 build carry
// it in place of SRC's base64 pictureUrl.

export type {
  ClientToServerEvents,
  ErrorCode,
  ErrorPayload,
  GalleryEntry,
  GalleryReadyPayload,
  Language,
  LobbyUpdatePayload,
  PictureRef,
  Player,
  PlayerLostPayload,
  Room,
  RoomPhase,
  ServerToClientEvents,
  StatsPayload,
  Story,
  SupportConfig,
} from '@funny/shared';
