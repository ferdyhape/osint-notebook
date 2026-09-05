import { SignJWT, jwtVerify } from "jose";

const SESSION_DAYS = 7;

export function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set — see .env.example");
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(userId: number) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function readSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export const SESSION_DAYS_SECONDS = SESSION_DAYS * 24 * 60 * 60;
