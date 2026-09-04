import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

function config() {
  return {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    user: process.env.MAIL_USERNAME || undefined,
    pass: process.env.MAIL_PASSWORD || undefined,
    fromAddress: process.env.MAIL_FROM_ADDRESS || "no-reply@localhost",
    fromName: process.env.MAIL_FROM_NAME || "OSINT Notebook",
  };
}

let cached: Transporter | null = null;

function transport() {
  const { host, port, user, pass } = config();
  if (!host) throw new Error("MAIL_HOST is not set — see .env.example");
  if (!cached) {
    cached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
  }
  return cached;
}

type MailOptions = { to: string; subject: string; text: string; html: string };

/**
 * Never throws: a bad SMTP config or a rejected recipient would otherwise fail
 * the whole request (e.g. a share invite) even though the actual state change
 * — the account or the share row — already succeeded. Logs and moves on.
 */
export async function sendMail(opts: MailOptions) {
  if (!process.env.MAIL_HOST) {
    console.warn(`[mail] MAIL_HOST not set — skipping "${opts.subject}" to ${opts.to}`);
    return;
  }
  try {
    const { fromAddress, fromName } = config();
    await transport().sendMail({ from: `"${fromName}" <${fromAddress}>`, ...opts });
  } catch (err) {
    console.error(`[mail] Could not send "${opts.subject}" to ${opts.to}:`, err);
  }
}

export function appUrl(path: string) {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}
