// Stands in for the real `server-only` package under Vitest. The real one
// (see node_modules/server-only) unconditionally throws when its JS actually
// executes — Next.js intercepts the import at bundle time so that code never
// runs there, but a plain Node test runner has no such interception, so any
// `lib/*.ts` module that starts with `import "server-only"` (lib/export.ts,
// lib/import.ts) would fail to import at all without this.
export {};
