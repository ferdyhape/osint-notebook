import { appUrl } from "@/lib/mail";

function wrap(bodyHtml: string) {
  return `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">${bodyHtml}<p style="margin-top: 24px; color: #888;">— OSINT Notebook</p></div>`;
}

export function verificationEmail(token: string) {
  const url = appUrl(`/api/auth/verify?token=${token}`);
  return {
    subject: "Verify your email — OSINT Notebook",
    text: `Confirm your email address by opening this link:\n\n${url}\n\nIf you didn't create this account, you can ignore this message.`,
    html: wrap(
      `<p>Confirm your email address to finish setting up your account.</p><p><a href="${url}">${url}</a></p><p>If you didn't create this account, you can ignore this message.</p>`
    ),
  };
}

export function shareInviteEmail(opts: { caseName: string; inviterName: string; role: string }) {
  const url = appUrl("/");
  return {
    subject: `${opts.inviterName} shared a case with you — OSINT Notebook`,
    text: `${opts.inviterName} gave you ${opts.role} access to the case "${opts.caseName}".\n\nSign in to view it: ${url}`,
    html: wrap(
      `<p><strong>${opts.inviterName}</strong> gave you <strong>${opts.role}</strong> access to the case "${opts.caseName}".</p><p>Sign in to view it: <a href="${url}">${url}</a></p>`
    ),
  };
}
