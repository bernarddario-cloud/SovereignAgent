# Repository Census — 2026-08-15

> **STALE SNAPSHOT — DO NOT USE THIS AS AN AUDIT OF THE 2026-08-15 SYNAPSE v3 TRADING TREE.** `HEAD` is from 2026-01-12, more than seven months before the requested cutoff. The expected genome reconciliation commit is not present locally, and neither genome file is present in the tracked tree.

## 0. WHAT I AM LOOKING AT

- Current HEAD: `051dcf3559c53eb346f307c674753b0071d6dd51`
- HEAD author date: `2026-01-12T09:02:12-08:00`
- HEAD message: `Fix malformed imports in routes.ts - separate @shared/schema and n8nWebhook imports`
- `d914889`: absent. `git cat-file -e d914889^{commit}` failed; `git fsck --no-reflogs --unreachable` and all local refs/reflogs produced no matching object.
- `data/live_genome.json`: no commit touches it (`git log --all -- data/live_genome.json` produced no commit); it is absent from `HEAD`.
- `data/neuron_genome.json`: likewise absent from `HEAD` and has no history in this clone.
- Tracked files: 125 (`git ls-files | wc -l`).
- Tracked `data/*.json`: none (`git ls-files 'data/*.json'` produced no paths).
- `.gitignore:1-6` does not ignore `data/` or `*.json`; absent genome files are not explained by the committed ignore rules.

## 1. TOP 5 FINDINGS

1. **Critical — the checked-out repository cannot substantiate an audit of the described live trading system.** Evidence: stale HEAD above; no tracked genome files; no market-data provider references in the repository-wide provider/fetch census in §2.1. Symptom: a reader could treat findings about this unrelated Node application as findings about SYNAPSE v3 while all requested price/genome controls are absent.
2. **High (if this application is externally reachable) — a built-in account password appears in two live server paths.** `server/storage.ts:88-92` seeds `username` and `password`; `server/routes.ts:124-130` creates the same user when a session is created. Symptom: an attacker who can reach an authentication path using this seeded account could reuse a repository-visible credential. The repository does not contain a login route, so exploitability is **UNCERTAIN**.
3. **High operational / capital-reporting risk — “execute” APIs report success without performing an external action.** `server/routes.ts:371-395` persists a requested action and then writes `status: 'success'` with the literal mock result at `381-385`; `server/routes.ts:334-355` does the same for an opportunity at `342-355`. Symptom: dashboards or downstream automations can show an investment/trade-like action as completed although this code made no provider/order call.
4. **Medium — an audit export can silently download an HTTP error body as a ledger file.** `client/src/components/ledger-viewer.tsx:23-34` fetches the export and immediately calls `response.blob()` at line 26 without checking `response.ok`; it only logs a caught transport exception at line 33. Symptom: a failed audit export presents as a downloaded JSON/CSV file rather than a visible server-error failure.
5. **Medium — duplicate, deeply misplaced live route code is present.** `server/routes/parliament.ts:1-45` is byte-identical to `server/intelligence/server/intelligence/server/intelligence/server/intelligence/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/server/middleware/server/middleware/server/ledger/server/ledger/server/ledger/server/ledger/server/routes/parliament.ts:1-45`. Symptom: a future edit to only one copy can leave a stale behavior fossil; current startup imports only the normal path (`server/routes.ts:23,73`).

## 2. FULL CENSUS

### 2.1 BAR / PRICE FETCHERS

- **No implementation found.** Repository-wide searches of all tracked source files for `alpaca`, `polygon`, `yfinance`, `coingecko`, `coinbase`, `ohlcv`, `bars`, `quote`, `next_page`, `page_token`, and market-price fetch patterns found no OHLCV/quote provider function.
- `package.json:13-109` lists no Alpaca, Polygon, yfinance, CoinGecko, Coinbase, or other market-data SDK.
- `server/services/n8nWebhook.ts:101-112` is the sole server-side `fetch` to an externally configured URL; it posts application events, not market data.
- Pagination token consumption: **0 implementations found**.
- Crypto symbol slash stripping/mangling: **0 implementations found**.
- Callers using `[0]` or `[-1]` as a latest market bar: **0 implementations found**.
- Independent market-data implementations: **0**. Intended shared market-data implementation: **not determinable; none exists in this snapshot**.

### 2.2 INDEX-ASSUMPTION SWEEP

- **No fetched/sorted/paginated market sequence has an index-order assumption in this snapshot.**
- `server/storage.ts:346-355` sorts ledger entries descending by timestamp (`352`) and then returns `entries.slice(0, limit)` (`355`). This is explicitly ordered, but is an audit ledger—not fetched market data.
- `server/ledger/storage.ts:14-16` returns `ledger.slice(-limit)` from an in-memory ledger; no time ordering is established in this function. **UNCERTAIN:** this is a sequence truncation, not an assertion that `[0]`/`[-1]` is newest/oldest.
- `server/services/ledger.ts:121-136` gets entries through the explicitly descending storage method and uses `entries.slice(0, 5)` at `135`; this is consistent with the storage ordering.
- `server/intelligence/server/intelligence/server/intelligence/server/intelligence/scoring.ts:22-23,32` indexes sorted vote-count/tie arrays. These are not fetched, sorted, or paginated external sequences.
- `client/src/hooks/use-voice.tsx:43-46` uses `event.results[event.results.length - 1]` and `result[0]` on browser speech-recognition results. This is not provider OHLCV/quote data.
- `client/src/components/action-engine.tsx:98` selects `parsedAction.actions[0]`; this is a user-entered action list, not a fetched or paginated sequence.

### 2.3 SECRETS

Real-looking hardcoded credential findings (value intentionally omitted):

- `server/storage.ts:90` — `password`
- `server/routes.ts:128` — `password`

Non-findings/limits:

- `server/services/openai.ts:4` — `OPENAI_API_KEY` has a placeholder fallback, not a real-looking secret.
- `server/services/tokenVault.ts:6-14` — `TOKEN_ENCRYPTION_KEY` is environment-only; its development fallback is generated from a repeated character and is not reported as a real credential.
- No commented-out credential or token was found in tracked source.
- No secret-shaped string was found in tracked `.md`, `.json`, or configuration files. `CURRENT_STATE.md:1-43` contains no credential; `components.json:1-22` contains a public schema URL.

### 2.4 DEAD ENDPOINTS AND RETIRED SERVICES

Exact repository-wide reference results:

- Port `18790`: no reference.
- `SYNAPSE Kernel`: no reference.
- `kernel_awareness`: no reference.
- `manus` / `manus_delegate`: no reference.
- `clawdbot` / `Grizzlyclawbot`: no reference.
- Render: `CURRENT_STATE.md:19-22` declares Render as an active deployment environment; `server/routes.ts:67-70` labels `/health` as a Render health endpoint. This is active application code but not a call to a retired service.
- ngrok URL: no reference.

Live external calls:

- `server/services/n8nWebhook.ts:35,85-116` reads `N8N_WEBHOOK_URL` and posts an event at `101-105`; its result status is checked at `107-112`.
- `server/routes.ts:178-210` calls that webhook after voice input; `server/routes.ts:232-264` calls it after text input. These can send messages/events if the environment variable is configured. They are **not evidence of Manus or any other named retired service**.
- Money-costing retired call: **none verified**.
- Message-sending retired call: **none verified**.

### 2.5 CONFIG READERS

- Readers of `live_genome.json`: none.
- Readers of `neuron_genome.json`: none.
- Definitions of either file: none in the tracked tree; `git ls-tree -r --name-only HEAD` has no genome path.
- Key comparison: impossible; neither definition nor reader exists.
- Hardcoded values duplicating a genome key: impossible to verify because no genome key definition exists.

### 2.6 SILENT FAILURE SWEEP

Bare/no-context catch:

- `server/routes.ts:107-112` catches a failure from optional `agentAny.hasSession()` and returns `false` at `111` with no log. This conflates an exception with an absent session.

Error-like return values that can be indistinguishable from a valid absence:

- `server/services/tokenVault.ts:96` returns `null` for a missing token; `121-123` logs decryption failure and also returns `null`. A caller cannot distinguish a missing token from a corrupt/undecryptable token from the return value.
- `server/services/tokenVault.ts:127-135` returns `null` both when no refresh token exists (`130-131`) and unconditionally after a token is present (`134`); the latter is an unimplemented refresh path, not an error-handled provider call.
- `server/intelligence/server/intelligence/server/intelligence/server/intelligence/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/server/middleware/server/middleware/server/ledger/server/ledger/storage.ts:26-30` returns `[]` when an intent-ledger file is absent. A missing ledger and a valid empty ledger are indistinguishable.
- `client/src/lib/queryClient.ts:36-38` intentionally returns `null` for a configured 401 policy; this is explicit behavior, not a silent transport failure.
- `server/storage.ts:170-176,205-215,262-268` returns `undefined` for missing in-memory records; these are ordinary lookup/update outcomes and are **not classified as errors without a contract showing otherwise**.

Network/subprocess status handling:

- `server/services/n8nWebhook.ts:101-112` checks `response.ok` and preserves `response.status`.
- `client/src/lib/queryClient.ts:3-8,15-23,32-41` checks HTTP status before returning normal API results.
- `client/src/components/connected-accounts.tsx:19-22,28-32` checks `response.ok` for both account calls.
- `client/src/components/ledger-viewer.tsx:23-34` does **not** check the export response status before download (Top Finding 4).
- `server/services/openai.ts:32-42,49-64,79-124,146-178` handles provider failures by throwing contextual errors. SDK HTTP-status behavior is inside the OpenAI dependency and was not independently verified.
- No `child_process`, `exec`, `spawn`, `execFile`, or `fork` call was found in tracked application source.

Reporting/logging priority:

- `client/src/components/ledger-viewer.tsx:23-34` is the only verified reporting/export path without an HTTP status check.
- `server/services/n8nWebhook.ts:107-115` logs non-OK and thrown webhook failures; it does not mute them.

### 2.7 DUPLICATION MAP

Verified blocks of 15+ lines:

- **Byte-identical, 45 lines:** `server/routes/parliament.ts:1-45` and `server/intelligence/server/intelligence/server/intelligence/server/intelligence/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/server/middleware/server/middleware/server/ledger/server/ledger/server/ledger/server/ledger/server/routes/parliament.ts:1-45`.
  - Blast radius: application decision/approval route; no verified order, position-sizing, market-price, or money-transfer code.
  - Active copy: `server/routes.ts:23,73` imports and mounts `server/routes/parliament.ts`.
  - Nested copy: no import/reference was found from the normal startup path; **dead/unreachable is likely but not proven across runtime dynamic imports**.

## 3. CLONE MAP

| Canonical/active path | Copy path | Evidence | Staleness |
| --- | --- | --- | --- |
| `server/routes/parliament.ts:1-45` | `server/intelligence/server/intelligence/server/intelligence/server/intelligence/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/minds/server/intelligence/server/middleware/server/middleware/server/ledger/server/ledger/server/ledger/server/ledger/server/routes/parliament.ts:1-45` | Identical SHA-256 `caffeda90bf80ae09b698ca9ecec25a4776a96afebdc0cf7df03c189a620b192`; active import/mount at `server/routes.ts:23,73` | The nested copy is likely stale because it is not startup-imported; date/order of divergence cannot be determined without a usable lineage for that path. |

No duplicated block touching market prices, orders, position sizing, or money movement was found because no such implementation was found in the tracked snapshot.

## 4. WHAT I COULD NOT DETERMINE

- Whether the requested repository name was expected to contain a different, later working tree. The local `origin/main` is the same stale `051dcf3` commit; no local object for `d914889` exists.
- The date of the most recent commit touching `data/live_genome.json`: there is no such commit in this clone, rather than a date that can be safely reported.
- Genome reader keys, key drift, authorized parameter history, or duplicated genome constants: both required genome files and all readers are absent.
- Whether an external scheduled job still calls Manus, or whether an external Telegram bot sends messages: schedules, deployment configuration, and remote runtime configuration are absent from this repository. No named source reference was found.
- Whether the `N8N_WEBHOOK_URL` endpoint is retired, costs money, or sends a message: the URL value is environment configuration and was not inspected.
- Whether the hardcoded `password` is reachable as an authentication credential: no authentication/login route is present in the tracked source.
- Whether the deeply nested duplicate files are runtime-reachable through untracked deployment logic or dynamic import: normal source imports do not reference them, but absence of a static import is not a proof of runtime impossibility.
- No ignored genome file was verified: `.gitignore` does not ignore the paths, and the files are absent in this working tree. Untracked files outside this checkout and remote/local history not supplied to this clone cannot be audited.
