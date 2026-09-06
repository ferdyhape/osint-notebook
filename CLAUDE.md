@AGENTS.md

# OSINT Notebook — notes for Claude

This file is for whoever (human or Claude) works on this repo next. `README.md`
covers setup and features; this covers the parts that aren't obvious from
reading the code once, and the mistakes already made once so they aren't made
again.

## What this is

A case notebook for OSINT investigations: log **entities** (email, username,
domain, IP, a custom type), get rule-driven **pivot suggestions** for what to
check next, link entities together as **relationships**, and keep freeform
**notes**. Two views of the same case: a table (`/cases/[id]`) and an
AntV X6 investigation board (`/cases/[id]/board`). Cases can be shared by
email invite (viewer/editor) or a public read-only link (`/share/[token]`).
Plain PHP-adjacent philosophy applied to Next.js: no scraping, no paid APIs —
every pivot suggestion opens a free tool or describes a manual check.

Stack: Next.js 16 (App Router) · TypeScript · Prisma 6.19.3 · MySQL · Tailwind
CSS v4 · AntV X6 v3 for the board. Zero state-management library — server
components + `router.refresh()` + a bit of client state per component.

## Relationship direction — the single most error-prone thing here

A `Relationship` row is `entityA --[relationType]--> entityB`, and every
sentence built from it reads forward, subject-verb-object:
**"{entityA} {relationType} {entityB}"**. entityA is the source, entityB is
the target/found entity. `lib/relationship.ts` is the one place this is
defined (`DEFAULT_RELATION_TYPE = "found"`, `RELATIONSHIP_VOCAB`,
`relationSubject()`, `clip()`) — every place a relationship is displayed or
created should read from there, not reinvent the wording.

This got it backwards once already: the original default relation text was
`"found from"`, which reads as "B found from A" (B is the subject) — backwards
from the stored direction and from the board's arrow (which points A→B). If
you're adding a new place that displays or creates a relationship, use
`components/RelationshipRow.tsx` (the shared sentence renderer — clips each
side independently so one long value can't swallow the rest of the line) and
`components/AddRelationshipModal.tsx` (the shared creation flow — has a swap
button so direction can be flipped before submitting, since which entity
"should" be entityA depends on the vocabulary chosen, not on selection order).
Don't duplicate the sentence-building logic inline again; that's exactly how
the two existing places (entity page, board panel) drifted before being
unified.

## Roles and permissions

- `User.role`: `"user"` | `"admin"`. Whoever's email is in `ADMIN_EMAIL` at
  seed time gets promoted to admin (`prisma/seed.ts`'s `seedAdminUser` — it
  promotes on re-run too, so re-seeding after adding the role system worked
  retroactively).
- `getCaseAccess()` (`lib/case-access.ts`) returns `"owner" | "editor" |
  "viewer" | null`. An admin with no direct ownership/share on a case still
  gets `"viewer"` — read-only browse access to *every* case, never edit —
  wired through the normal `requireCaseAccess()` gate, not a separate code
  path. The home page's "All cases" section (visible only to admins) is just
  a second query for cases not already in "mine"/"shared with me".
- `PivotRule.createdById`: `null` = seeded/system rule, editable/deletable by
  an admin only. Non-null = a user-added rule, editable by its creator or an
  admin. Both the API (`app/api/pivot-rules/[id]/route.ts`'s `requireManage`)
  and the UI (`PivotRulesTable`'s `canManage`) enforce this identically —
  keep them in sync if the rule ever changes.
- Suggested-next-steps ordering (`app/api/entities/[entityId]/pivot-suggestions/route.ts`):
  type-specific rules before generic `"any"` rules, and *within* each of those
  groups, a user-added rule before the seeded ones — so adding your own
  suggestion actually surfaces it instead of burying it under the defaults.

## The board (`components/board/InvestigationBoard.tsx`)

The single most complex file here. Things that look like they could be
simplified but can't:

- **`lib/board-layout.ts` has zero imports on purpose.** It holds `NODE_WIDTH`
  and `entityNodeHeight()` — pure sizing math needed both server-side
  (`lib/board.ts`, which pulls in `"server-only"` + Prisma + d3-force) and
  client-side (`InvestigationBoard.tsx`, a `"use client"` component that
  resizes a card in place after an inline edit). Importing these two values
  from `lib/board.ts` into the client component drags the server-only module
  into the client bundle and fails the build outright — that's why they live
  in their own dependency-free file instead. If you add more shared board
  math, it goes in `board-layout.ts`, never in `board.ts`.
- **Each graph mount gets its own private host `<div>`**, created and
  destroyed per-effect-run rather than reusing one persistent container.
  `GraphView.dispose()` empties whatever container it was given, so sharing
  one host between graphs let a disposing graph wipe out its successor's DOM.
  The dispose itself is deferred a tick (`queueMicrotask`) because it
  synchronously unmounts every node's React root, which raced React 19's
  render cycle when triggered by the same `router.refresh()` that remounts
  this tree.
- **Undo/redo only covers `position`/`vertices`/`source`/`target`.** Creating
  or deleting a cell is a database write with a generated id; undoing that in
  the canvas alone would desync the board from the case, so create/delete
  stay off the History stack and go through their own confirm dialogs
  instead.
- **The right-click menu is mounted *inside* the fullscreen element**, not as
  a sibling. The Fullscreen API renders nothing outside the fullscreened
  element, so a sibling menu simply never appeared while fullscreen.
- Editing an entity from the board panel (`EntityDetailPanel.tsx`) patches the
  live X6 node directly (`node.setData` + `node.resize`) instead of calling
  `router.refresh()` — a refresh would tear down and rebuild the whole graph
  (new `initialNodes`/`initialEdges` array identity) just to update one card.
  Same reasoning for renaming/deleting a relationship from the panel: the
  board's own `renameRelationship`/`deleteEdge` functions own the
  fetch+mutate pairing, so the panel only calls the callback, never fetches
  itself (avoids doing the PATCH/DELETE twice).
- `EntityDetailPanel` is rendered with `key={activeNodeId}` — switching which
  entity is selected remounts the panel and gets fresh local state (edit
  drafts, etc.) for free, rather than resetting state in an effect (which
  `eslint-plugin-react-hooks`'s newer `set-state-in-effect` rule flags, and
  which is the wrong tool for "reset when this identity changes" anyway).

## Design system (`app/globals.css`)

Everything reusable is a class in `@layer components`, not inline Tailwind
utility soup: `.card`, `.btn` (+ `.btn-sm`/`.btn-ghost`/`.btn-danger`/
`.btn-row` for hover-revealed row actions), `.field`, `.badge`, `.page-title`/
`.section-title`/`.item-title`/`.eyebrow` for the type scale. Reach for these
before inventing new spacing/sizing — the comment block at the top of the
`@layer components` section documents the conventions (spacing scale, which
button variant goes where).

Colors are CSS custom properties (`--color-*`), redefined once for
`[data-theme="dark"]` and once for `@media (prefers-color-scheme: dark)` —
never hardcode a hex color in a component. Icons are hand-rolled 16×16 stroke
SVGs in `components/icons.tsx` (no icon library dependency); add new ones
there in the same style rather than pulling in a package for one glyph.

Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) react to the **viewport**
width, not the width of whatever element they're on. This bit the profile
page once: a `sm:grid-cols-2` inside a card that itself only got half the
page's width (because the page *itself* was already split into two columns at
`lg:`) still activated at any viewport ≥640px, squeezing two fields into a
card far narrower than 640px and reading as a third column across the page.
When nesting responsive layout inside a column that's itself responsive,
check what happens at the width the *inner* element actually gets, not the
viewport's.

## Export / import (`lib/export.ts`, `lib/import.ts`)

Export JSON: `relationships[].from` = entityA/source, `.to` = entityB/target
(matches the sentence direction above). Entities/relationships/notes all
carry `label` alongside `type`/`value`. Import
(`POST /api/cases/import`, `lib/import.ts`) always creates a **new** case —
it never merges into an existing one — and matches relationships/notes to
entities by `(type, value)` since the export format carries no ids; every
timestamp in the file is ignored (fresh `createdAt` on every row). If you
change the export shape, check `parseCaseImport()`'s validation stays lenient
enough to accept it (optional fields default to `null`/`[]` rather than
throwing).

## Auth and redirects

Session is a signed cookie (`lib/session-token.ts`, JWT via `jose`), read in
`lib/auth.ts`'s `getCurrentUser()`. `proxy.ts` (the middleware) gates
everything not in `PUBLIC_PATHS`.

**Never build an absolute redirect/URL from `request.url` or
`request.nextUrl.origin` in a Route Handler.** Behind the aaPanel reverse
proxy, what a Route Handler sees there does not reliably reflect the public
domain — confirmed in production: `NextResponse.redirect(new URL(path,
request.url))` in the email-verification route resolved to
`http://localhost:3000/...` even though nginx's `proxy_set_header Host
$host;` was correctly forwarding the real Host header. Use `appUrl(path)`
(`lib/mail.ts`) or `siteUrl` (`lib/site.ts`) instead — both read
`process.env.APP_URL` directly, which is what's actually reliable. Middleware
(`proxy.ts`)'s own `request.nextUrl.clone()` redirects are fine as-is (they
come back as relative Location headers, resolved against whatever origin the
browser is actually on) — this only bit a Route Handler building an absolute
URL by hand.

## Deploying (aaPanel VPS)

Full runbook: **`DEPLOY-AAPANEL.md`** — read it before touching the server,
it has the actual commands and the troubleshooting table. The short version:

- The box is 1 core / 1 GB. **Build on the laptop, never on the server** —
  installing/building there once pinned the single core into swap.
- Windows and Linux disagree on two things that bite silently:
  - **MySQL table-name casing.** Windows MySQL matches `` `entity` `` to the
    real `` `Entity` `` table case-insensitively; the Linux server's MySQL is
    case-sensitive and fails with `Table '...entity' doesn't exist`. Check
    generated migration SQL for this before uploading it — `grep -iE "ALTER
    TABLE|REFERENCES" prisma/migrations/*/migration.sql` and fix the casing
    to match `schema.prisma`'s model names (PascalCase) if Prisma emitted it
    lowercase.
  - **Prisma's query engine is platform-specific.** `schema.prisma` requests
    both `binaryTargets = ["native", "debian-openssl-3.0.x"]` for exactly
    this reason — check `node_modules/.prisma/client/` has the
    `libquery_engine-debian-openssl-3.0.x.so.node` file before packaging.
- Deploy is a manual file sync (`Pull Git project` is off in aaPanel), not a
  git pull on the server — `scp` a `.tar.gz` of `.next` (+ `prisma/` and
  `node_modules/.prisma` when the schema changed), extract, `chown -R
  www:www`, and repoint `.next/node_modules`'s symlinks (they're written with
  an absolute path to the machine that built them — step 7b in the runbook).
  A schema change also needs `prisma migrate deploy` run on the server
  (`sudo -u www env PATH=... ./node_modules/.bin/prisma migrate deploy`,
  since `.env` is `600` owned by `www`).
- **Never restart by pattern.** `pkill -f next-server` kills every Next.js
  site on the box — this one *and* the user's own portfolio site, which is
  also Next. Find the PID from the port instead:
  `sudo ss -lptn 'sport = :3000'`, then kill that PID only. Same reasoning
  applies to anything that could match more broadly than intended on a shared
  box.
- Unless told otherwise, treat "sync to the server" as file-sync-only —
  extract, chown, repoint symlinks, run a migration if asked — and leave
  actually **starting/restarting** the app to the user via aaPanel's own
  Node-project controls. Say plainly what step is still needed and why,
  rather than silently doing it or silently skipping it.

## Working conventions

- Never commit straight to `main` — branch first. This repo's history is
  already split into per-feature branches (`feat/public-seo`,
  `feat/entity-relationships-roles-import`, etc.); keep unrelated work on its
  own branch rather than piling onto whichever one happens to be checked out.
- Verify UI changes in the Browser pane before calling something done,
  especially anything involving the X6 board (it has genuine runtime
  failure modes — zombie graphs, `SVGMatrix` crashes — that only show up
  live, not in a type-check).
- If verifying something requires writing test data (a relationship, a note,
  a whole imported case) into a database that also holds real investigation
  data, clean it up again afterward — confirm the row counts match what they
  were before.
- Stop dev servers you started once done with them (`preview_stop`, or find
  the PID on port 3000 and stop it) — don't leave one running.
