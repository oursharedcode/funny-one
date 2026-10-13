// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the storage keys the page's scripts share — the inline head script
// (render/headScript.ts) writes some that the modules in client/ read back.
// Nothing here identifies anyone, and none of it leaves the browser: no
// cookies, only this tab's sessionStorage and one remembered language.

/** sessionStorage: the design (A or B) this tab was shown, kept for the whole visit. */
export const VARIANT_KEY = 'ff-variant';

/** localStorage: the language the visitor last picked on this site. */
export const LANG_KEY = 'ff-lang';

/**
 * sessionStorage: the referrer of a visit that landed on `/` and was sent on
 * to its language's page, whose own referrer would then be `/` itself.
 */
export const REFERRER_KEY = 'ff-ref';

/** sessionStorage: what this tab has already counted (the view, each click target). */
export const SENT_KEY = 'ff-sent';
