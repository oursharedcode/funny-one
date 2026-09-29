// Public surface of @funny/shared (FM-ARC-2). Both apps and every future family
// product consume this package; it is built before every dev/build/test/typecheck
// run via the root `pre*` scripts.
//
// Phase 1 is complete: languages, rotation, the answer pools with en + ru texts,
// and the socket contract all land here.
//
// NodeNext resolution: relative re-exports need the .js extension.

// T-1.1 — 15-language registry (D-2)
export { LANGUAGES, isLanguage } from './languages.js';
export type { Language, LanguageOption } from './languages.js';

// T-1.2 — story rotation (FM-CORE-6)
export { storyIndex } from './rotation.js';

export { normalizeBasePath } from './basePath.js';

// T-1.3 — answer-pool schema (FM-POOL-1/3/4)
export {
  AUTHORED_LANGUAGES,
  getSlotConfig,
  isSlotIndex,
  isVisualSlot,
  OPTION_TEXT_MAX_LENGTH,
  PROMPT_FRAGMENT_MAX_LENGTH,
  PROSE_SLOTS,
  SLOT_COUNT,
  SLOTS,
  VISUAL_SLOTS,
} from './pools/schema.js';
export type {
  AnswerOption,
  AuthoredLanguage,
  OptionId,
  Pools,
  PoolTextMap,
  SlotConfig,
  SlotIndex,
  SlotKind,
} from './pools/schema.js';
export { ALL_OPTION_IDS, POOLS } from './pools/options.js';
export { POOL_TEXTS } from './pools/text/index.js';

// T-FO-2.1 — prose rendering (FO-ARC-2), promoted from
// `apps/funny-multi-server/src/i18n/` and `.../grammar.ts` so both products
// can render and polish story prose.
export { QUESTIONS, PROSE_TEMPLATES, renderProse, requireAuthoredLanguage } from './i18n/index.js';
export { polishProse, polishRussianProse } from './i18n/grammar.js';

// T-1.6 — socket contract (design §5). Types only: the protocol carries no
// runtime values, so this whole module erases at build time.
export type {
  ClientToServerEvents,
  ErrorCode,
  ErrorPayload,
  GalleryEntry,
  GalleryReadyPayload,
  GameReadyPayload,
  GameRestartReadyPayload,
  LobbyUpdatePayload,
  PictureRef,
  Player,
  PlayerLostPayload,
  RevealPictureErrorCode,
  RevealPictureErrorPayload,
  RevealPictureReadyPayload,
  RevealStartPayload,
  Room,
  RoomCreateAck,
  RoomCreatePayload,
  RoomJoinAck,
  RoomJoinPayload,
  RoomPhase,
  RoundStartPayload,
  RoundSubmitPayload,
  RoundWaitingPayload,
  ServerTimerHandle,
  ServerToClientEvents,
  StatsPayload,
  Story,
  SupportConfig,
} from './events.js';
