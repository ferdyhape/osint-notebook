# OSINT Notebook

A case notebook for open-source investigations, with a rule-driven engine that
suggests where to look next.

Record what you find as **entities** (an email, a username, a domain, an IP, a
photo — or a type you invent), and the app offers the next steps for that kind
of data: a search to run, a lookup to open, or a manual check to carry out. When
a step turns up something new, log it from that step and the app keeps the trail
— the new entity, its link back to where it came from, and a note.

Nothing is scraped or fetched on your behalf. Every suggestion opens a free tool
or describes a manual check, and the judgement stays with you.

## What it does

- **Cases** hold everything about one investigation: entities, links, and notes.
- **Pivot rules** map an entity type to a next step. 39 ship by default, drawn
  from current OSINT practice: per-type steps, cross-platform dorking, and
  verification discipline (corroborate in two independent sources, record how
  confident you are). Add and edit your own on the Pivot Rules page.
- **Combine entities.** Select two or more rows in a case and search for them
  together, joined with AND or OR — the technique for finding one person's
  accounts across platforms.
- **Suggestions from the start.** A case title and description are scanned for
  emails, domains, IPs, and phone numbers, each offered as a one-click entity.
  Nothing is saved without you clicking.
- **Export** a case as a Markdown report or as JSON.

## Requirements

- Node.js 20 or newer
- MySQL 8 (5.7 works)

## Setup

```bash
git clone https://github.com/ferdyhape/osint-notebook.git
cd osint-notebook
npm install
```

Create the database:

```sql
CREATE DATABASE osint_tool CHARACTER SET utf8mb4;
```

Copy the environment file and fill it in:

```bash
cp .env.example .env
```

```
DATABASE_URL="mysql://user:password@127.0.0.1:3306/osint_tool"
SESSION_SECRET="paste-a-generated-key-here"
```

- `DATABASE_URL` — if the password contains `@ : / ? # & %`, percent-encode
  those characters (`@` becomes `%40`) or the URL will not parse.
- `SESSION_SECRET` — signs the login cookie. Generate one with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
  ```

  Use a different value on every machine. Changing it signs everyone out.

Create the tables and load the starter data:

```bash
npx prisma migrate dev     # creates the schema
npm run db:seed            # 39 pivot rules + your sign-in account
npm run dev                # http://localhost:3000
```

## Signing in

There is no public sign-up. The seed step creates the first account, and by
default it is:

| | |
| --- | --- |
| Email | `notebook@osint.com` |
| Password | `password!` |

**Change the password from the account menu before anyone else can reach the
app.** It is published here, so it is only safe on a machine no one else can
open.

### Seeding a different account

Set these in `.env` before running `npm run db:seed`:

```
ADMIN_EMAIL="you@example.com"
ADMIN_NAME="Your Name"
ADMIN_PASSWORD="something-long"
```

This is also how you add more people, since there is no sign-up screen: change
`ADMIN_EMAIL` and run the seed again. Everyone who signs in shares the same
cases — accounts are a gate on the app, not separate workspaces.

The seed never touches an account that already exists and never duplicates
pivot rules, so it is safe to run again after pulling changes.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply schema changes in development |
| `npm run db:seed` | Load pivot rules and the sign-in account |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Layout

```
app/
  api/            Route handlers: cases, entities, notes, pivot rules, auth, export
  cases/          Case list, case detail, entity detail
  pivot-rules/    Manage the suggestion library
  login/  profile/
components/       UI, one component per concern
lib/
  auth.ts         Password hashing and the session cookie
  pivot.ts        Resolves a rule into a link, single or combined
  detect.ts       Finds entities in free text
  export.ts       Markdown and JSON formatters
prisma/
  schema.prisma   Case, Entity, Relationship, Note, PivotRule, User
  seed.ts         Starter rules and the first account
```

## Deploying

Point `DATABASE_URL` at the server's MySQL, set a fresh `SESSION_SECRET`, then:

```bash
npm ci
npx prisma migrate deploy
npm run db:seed
npm run build
npm start
```

Run it behind a reverse proxy with HTTPS — the session cookie is only marked
`Secure` in production, so a sign-in over plain HTTP can be read in transit.
Sign-in keeps strangers out, but for a private investigation tool it is worth
adding an IP allowlist or putting the whole thing behind a VPN.

## Stack

Next.js (App Router) · TypeScript · Prisma · MySQL · Tailwind CSS

Prisma is pinned to 6.x. Releases 7 and 8 drop the `datasource url` config this
project uses, so do not upgrade it to resolve the `npm audit` notice about the
Prisma CLI — that advisory is in a build-time dependency that never runs in
production.

---

by [ferdyhape.com](https://ferdyhape.com)
