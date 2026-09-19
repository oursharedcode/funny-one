# Zero/Low Chargeback-Risk Gift Payment Options for an Australian Sole Trader Developer

**Context:** Free web services with a support/gift page. Typical gifts are $1–$3, rarely above ~$16.50 (the effective break-even point where a Stripe chargeback — $15 flat fee + ~10% — would otherwise wipe out the gift and go negative). Goal: eliminate or minimise the risk of a $1 gift turning into a ~$15–20 loss.

---

## The core structural fact

**Chargebacks are a right built into the Visa/Mastercard card networks, not a platform policy.** No service that accepts card payments can make chargeback risk truly _zero_. This splits realistic options into two groups:

1. **Payment rails with no chargeback mechanism at all** (bank transfer, cryptocurrency) — true zero risk.
2. **Card-based platforms where the platform absorbs the dispute** — your worst case is losing the gift amount itself, never going negative.

### The Stripe trap (why this research exists)

Since mid-2025, Stripe charges a **$15 dispute fee** the moment a cardholder's bank files a dispute, deducted immediately from the merchant's balance regardless of outcome. If the merchant chooses to counter the dispute, a further **$15 counter fee** applies (refunded only if the merchant wins). The $15 fee itself is **never refunded**, even on a win. A disputed $1 gift routed through your own Stripe account can cost **$15–30+**, exactly the scenario to avoid.

---

## Platforms that look like tip jars but are NOT safe (the traps)

These are the popular, obvious-looking options — and all of them fail the "no chargeback exposure" requirement because payments route through _your own_ connected Stripe/PayPal account, making you the merchant of record.

| Platform                                | Why it fails                                                                                                                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ko-fi**                               | Payments go straight from supporter to your own connected PayPal or Stripe account. A dispute filed with PayPal or the card issuer results in dispute fees charged directly to you. Ko-fi's 0% platform fee is irrelevant to this risk.                                               |
| **Buy Me a Coffee**                     | Own help docs confirm: when a chargeback happens, the disputed amount _plus an extra fee_ is taken from your account balance. Same exposure as Stripe direct.                                                                                                                         |
| **Liberapay**                           | Same architecture as Ko-fi — donations flow through your own connected Stripe account.                                                                                                                                                                                                |
| **PayPal (Donate / PayPal.Me)**         | PayPal charges its own dispute/chargeback fees (~A$22 in Australia). "Friends & Family" avoids PayPal's _internal_ buyer-protection disputes, but card-funded payments can still be charged back via the sender's bank/card issuer.                                                   |
| **Patreon**                             | Ambiguous — Patreon typically handles fraud/chargebacks itself, but its own terms warn that chargebacks can push the creator's account balance negative and that associated fees "may not be refunded." Also charges 8–12% platform fees. Better than Ko-fi, but not guaranteed zero. |
| **Your own direct Stripe payment link** | Worst case — the full $15 + $15 structure applies directly to you.                                                                                                                                                                                                                    |

**Takeaway:** avoid routing any gift flow through your own personal Stripe or PayPal account, including indirectly via Ko-fi, Buy Me a Coffee, or Liberapay front-ends.

---

## Recommended stack (in priority order)

### 1. PayID / Osko — primary option for Australian supporters

**What it is:** A real-time bank-to-bank push payment. The payer sends money directly from their own banking app to your PayID (an email address, phone number, or ABN linked to your account). This is _not_ a card transaction — no chargeback mechanism exists for it.

**Why it's safe:** Because PayID/Osko payments clear instantly, the sender's bank cannot initiate a chargeback — chargebacks are strictly a card-network mechanism. Once cleared, the sender's bank can only "request" a return, which is essentially asking the recipient directly; it is not enforceable the way a chargeback is. Osko payments generally cannot be cancelled once sent.

**Cost:** No fees to register a PayID or to send/receive Osko payments. You keep 100% of every gift.

**Setup (your side, ~5 minutes):** In your bank's app: Settings → PayID → link an email, mobile number, or ABN to your account.

**Implementation on the page:**

```html
<p>
  <strong>PayID (Australian banks):</strong>
  <code id="payid">gifts@yourdomain.com</code>
  <button onclick="navigator.clipboard.writeText('gifts@yourdomain.com')">Copy</button>
</p>
<small
  >Your bank will show the name "J. SMITH" before you confirm. Instant, no fees, any amount.</small
>
```

**Gotcha — name mismatch:** When a payer enters your PayID, their bank displays the _registered account name_ for confirmation before sending. If your page says "Support WebToolsAU" but the bank shows "JOHN SMITH," some users hesitate or abort. **State the exact name they will see on your page.**

**Gotcha — first-payment holds:** Some banks place a ~24-hour hold on the _first_ payment to a new PayID above a threshold (reportedly around $100). This is irrelevant for $1–3 gifts but worth knowing if a rare larger gift arrives.

**Gotcha — domestic only:** PayID/Osko works for AUD payments within Australia only. No path exists for international supporters via this rail.

**Click/time analysis:**

- **Case 1 (payer has mobile banking — effectively all Australian adults):** copy PayID (1 tap) → open bank app + biometric (1) → Pay/Pay someone (2) → PayID tab, paste (2) → confirm displayed name (1) → enter amount → Pay + biometric confirm (1–2). **~8–11 taps, 60–90 seconds.**
- **Case 2 (payer needs to "register"):** There is no registration step for payers — this is PayID's core advantage. The "system" is simply their existing bank account. The only real case-2 scenario is a payer without their banking app installed (~5 min install), or a payer outside Australia (no path at all — not a registration delay, a hard geographic limit).

---

### 2. GitHub Sponsors — primary option for international/developer supporters

**What it is:** GitHub bills the sponsor directly on their existing GitHub billing relationship (via Stripe Connect on the back end). Critically, **you are not the merchant of record** — GitHub is the counterparty to the sponsor's payment, not you.

**Why it's safe:** Per GitHub's own Sponsors Additional Terms, the developer agrees they have no claim against GitHub relating to donations, and disputes relating to a donation are between the sponsor and the third-party payment provider — but importantly this structure means a chargeback does not directly debit _your_ personal account the way it would with your own Stripe integration. GitHub does not charge any fees for sponsorships from personal accounts, so 100% goes to the sponsored developer.

**Cost:** 0% fee on sponsorships from personal GitHub accounts; up to 6% fee only on sponsorships from organization accounts.

**Setup (your side, ~30 minutes + verification wait):**

1. github.com/sponsors → Join
2. Fill out profile
3. Create tiers — **explicitly create one-time tiers at $1, $3, $5** (not just monthly ones)
4. Complete payout onboarding: bank details + tax info via Stripe Connect (Australia supported)
5. Wait for identity/bank verification — typically same-day to a few days before going live

**Implementation on the page:**

```html
<iframe
  src="https://github.com/sponsors/YOURUSERNAME/button"
  title="Sponsor"
  height="32"
  width="114"
  style="border:0;border-radius:6px;"
></iframe>
```

**Gotcha — monthly is the default toggle:** The Sponsors flow defaults to a recurring monthly pledge. Payers must actively switch to "One-time." Say "choose one-time" explicitly in your page copy, or you'll lose casual $1 tippers who don't want a subscription and abandon rather than hunt for the toggle.

**Gotcha — GitHub account required:** Only usable by people who have (or are willing to create) a GitHub account. Fine for a developer-tool audience; a hard wall for a general audience.

**Click/time analysis:**

- **Case 1 (logged-in GitHub user with a saved card):** click Sponsor button (1) → toggle Monthly → One-time (1) → pick $1/$3 tier (1) → Sponsor (1) → confirm payment (1). **~4–6 clicks, under a minute.**
- **Case 2 (no GitHub account, from zero):** account creation — email, password, username, captcha, email verification code (~2–4 minutes) → card entry (~1–2 minutes) → sponsor flow. **~4–6 minutes total, roughly 25–35 individual interactions** before $1 reaches you. No general consumer completes this for a dollar, but a meaningful share of a developer-tool audience already has a GitHub account (case 1), which is why this option earns its place despite the case-2 friction.

---

### 3. Bitcoin Lightning / cryptocurrency — secondary option for international/crypto-native supporters

**What it is:** Payments over the Bitcoin Lightning Network (or on-chain Bitcoin/stablecoins) sent directly to a wallet address you control, with no intermediary.

**Why it's safe:** Both on-chain and Lightning Bitcoin transactions are cryptographically irreversible by design — there is no chargeback mechanism at any layer, not even in principle. It is the only globally available rail (i.e., works for supporters outside Australia) with true structural irreversibility.

**Cost:** Near-zero fees on Lightning, making it uniquely viable for very small ($0.50–$3) international payments where card cross-border fees would otherwise eat the entire gift.

**Setup — two paths:**

- **Easy:** Install a custodial or semi-custodial Lightning wallet that provides a Lightning address (e.g., Alby Hub, Coinos, Blink, or the Australian company Wallet of Satoshi). ~5–10 minutes.
- **Sovereign:** Self-host BTCPay Server — free, open-source, non-custodial; payments go directly to your own wallet with no fees and no middleman. Includes a purpose-built tips/donations mode supporting arbitrary amounts and payer comments. Self-hosting takes a weekend the first time; a hosted BTCPay instance takes ~30 minutes.

**Implementation on the page:**

```html
<a href="lightning:you@coinos.io">⚡ you@coinos.io</a>
<img src="qr-of-lightning-address.png" alt="Lightning QR code" />
<code id="ln">you@coinos.io</code>
<button onclick="navigator.clipboard.writeText('you@coinos.io')">Copy</button>
```

The `lightning:` URI opens the payer's installed wallet directly on mobile; the QR code serves desktop visitors paying from a phone; the copy button is the fallback for wallets that don't handle the URI scheme, or for pasting elsewhere.

**Gotcha — this is not a growth channel.** It converts existing crypto/Lightning holders near-perfectly and converts everyone else at essentially zero, because the real barrier isn't the wallet — it's _funding_ the wallet.

**Gotcha — AUD value fluctuates.** Bitcoin's value moves; if this matters for accounting/pricing perception, consider a stablecoin (e.g., USDC) option instead or in addition.

**Gotcha — Australian tax implications.** Receiving and later converting crypto has CGT record-keeping implications distinct from cash/bank gifts — worth checking with an accountant.

**Click/time analysis:**

- **Case 1 (payer already has a funded Lightning wallet):** tap the link or scan the QR (1) → wallet opens pre-filled → enter/pick amount (1) → confirm (1). **~2–4 taps, 10–30 seconds — the fastest flow of the three options.**
- **Case 2 (payer has no wallet, from zero):** installing a wallet itself takes 2–5 minutes, but that is not the real barrier — the wallet starts empty. Acquiring bitcoin typically requires an exchange account with identity (KYC) verification (10 minutes to several days), often with a **minimum purchase of $20–30** — far exceeding the gift itself. **Realistic time from zero to sending $1: hours to days; in practice, essentially nobody completes this path from scratch for a $1 gift.**

---

### 4. Square (Australia) — fallback card option for supporters unwilling/unable to use the above

Included as a fallback for supporters who insist on paying by card and won't use bank transfer or crypto.

**Why it's the safest _card_ option:** Square's official Australian terms state there are no fees for dispute management — **Square covers the fee for every dispute** the merchant challenges, and Square never charges an additional fee for a dispute; only the originally-charged transaction amount can be taken back on a lost dispute. This caps the worst case at losing the gift amount itself (e.g., losing $3), never the $15–30+ chargeback-fee scenario.

**Setup:** Create a free Square account, generate payment links (no website integration required), funds settle next-day to an Australian bank account in AUD.

**Gotcha:** Square's pre-2019 "Chargeback Protection" program (which reimbursed even _lost_ disputes up to $250/month) was discontinued in April 2019. Current Square only waives the _fee_, not the underlying transaction amount on a lost dispute — you can still lose the gift itself, just never more than that.

**Gotcha:** Standard card processing fees (~2.2%+ online, plus a fixed component) apply per transaction, which is a meaningful percentage bite out of a $1 gift specifically (though this is a cost, not a chargeback risk).

---

## Summary comparison table

| Option               | Chargeback risk                                               | Fees                    | Reach                          | Case 1 (payer ready)   | Case 2 (payer from zero)                                                         |
| -------------------- | ------------------------------------------------------------- | ----------------------- | ------------------------------ | ---------------------- | -------------------------------------------------------------------------------- |
| **PayID/Osko**       | None (not a card product)                                     | $0                      | Australia only                 | ~8–11 taps, 60–90s     | No registration exists; only barrier is being outside Australia                  |
| **GitHub Sponsors**  | Absorbed by GitHub/Stripe Connect; not billed to you directly | 0% (personal), 6% (org) | Global, GitHub-account holders | ~4–6 clicks, <60s      | ~4–6 min signup + card entry, ~25–35 interactions                                |
| **Lightning/crypto** | None (cryptographically irreversible)                         | Near-zero (Lightning)   | Global, crypto holders only    | ~2–4 taps, 10–30s      | Hours–days (needs funded wallet via KYC exchange); effectively non-viable for $1 |
| **Square**           | Capped at gift amount; fee always waived                      | ~2.2%+ per transaction  | Global card holders            | Standard card checkout | Standard card checkout                                                           |

## Explicitly avoid

Ko-fi, Buy Me a Coffee, Liberapay, PayPal Donate, your own direct Stripe payment link, and Patreon (unless you accept its ambiguous negative-balance risk) — all route disputes back to you as the merchant of record, reintroducing the exact $15–20+ negative-balance scenario this research set out to eliminate.

## Recommended page structure

1. **PayID first** — broadest zero-friction reach for the (presumably majority) Australian audience, true zero risk, zero fees.
2. **GitHub Sponsors second** — case-1-heavy for a developer audience; clearly label the one-time toggle to prevent monthly-default drop-off.
3. **Lightning third** — small audience, but the fastest and cheapest flow for those who have it, and the only real international option besides GitHub.
4. **(Optional) Square last** — card fallback for supporters unwilling to use the above, with worst-case capped at the gift amount rather than a punitive dispute fee.

Use **tap-to-copy buttons** on every address/ID (PayID, Lightning address, Sponsors URL) — manual text selection on mobile is error-prone and disproportionately kills small, impulsive gifts where 10 extra seconds of friction outweighs the appeal of a $1 decision. Give visible "Copied!" feedback so payers aren't left wondering if the tap registered.

## Other housekeeping notes (Australia-specific)

- **Tax treatment:** the ATO generally treats "gifts" received in connection with business activity as assessable income for a sole trader, not personal gifts — factor this into bookkeeping regardless of which rail is used.
- **Framing on the page:** state plainly that payments are voluntary gifts with nothing owed in return. This sets expectations for payers and undercuts the "services not rendered" pretext that most small-value disputes rely on — relevant even on the card-based fallback option.

## Open gap / possible follow-up

This research covered the major, well-known platforms. A longer tail of smaller platforms — Open Collective, Polar, Lemon Squeezy, Coindrop, regional wallets like Beem, and various newer merchant-of-record services — each carry their own dispute-liability fine print that changes periodically and was not exhaustively reviewed here. A systematic pull of current terms-of-service dispute clauses across a few dozen of these platforms, ranked by worst-case loss per disputed micro-gift, would round out the picture if needed.
