// Stands in for `lib/prisma.ts` under Vitest. The real module constructs a
// `PrismaClient`, which reads `DATABASE_URL` at construction time and throws
// immediately if it isn't set — Vitest doesn't load `.env` the way Next.js
// does, so importing the real module (even just to reach a pure function
// like `parseCaseImport` that sits in the same file) would fail before any
// test runs. Nothing this project currently unit-tests actually needs a
// database — the moment something does, it calls this proxy and gets a
// clear error naming the exact operation, not a hang or a cryptic Prisma
// initialization error.
export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      throw new Error(
        `prisma.${String(prop)} was called from a unit test — this mock has no database. ` +
          "If the function under test genuinely needs Prisma, it belongs in an integration " +
          "test against a real database, not here."
      );
    },
  }
);
