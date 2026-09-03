export type DetectedEntity = {
  type: "email" | "domain" | "ip" | "phone";
  value: string;
};

const EMAIL_RE = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const DOMAIN_RE =
  /\b(?:[a-zA-Z0-9-]+\.)+(?:co\.id|or\.id|ac\.id|go\.id|my\.id|web\.id|com|net|org|id|io|co|dev|me|info|biz|xyz|site|online|app|store|tech|cloud)\b/gi;
const PHONE_ID_RE = /\b(?:\+62|62|0)8\d{7,11}\b/g;
const PHONE_INTL_RE = /\+\d{8,15}\b/g;

function isValidIpv4(value: string) {
  return value.split(".").every((octet) => Number(octet) <= 255);
}

export function detectEntities(text: string): DetectedEntity[] {
  const found: DetectedEntity[] = [];
  const seen = new Set<string>();

  function push(type: DetectedEntity["type"], value: string) {
    const key = `${type}:${value.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ type, value });
  }

  const emails = text.match(EMAIL_RE) ?? [];
  emails.forEach((email) => push("email", email));

  // Emails and IPs contain domain-like substrings — strip them before domain matching.
  let rest = text;
  emails.forEach((email) => {
    rest = rest.replaceAll(email, " ");
  });

  const ips = (rest.match(IPV4_RE) ?? []).filter(isValidIpv4);
  ips.forEach((ip) => {
    push("ip", ip);
    rest = rest.replaceAll(ip, " ");
  });

  (rest.match(DOMAIN_RE) ?? []).forEach((domain) => push("domain", domain.toLowerCase()));

  const phones = [...(text.match(PHONE_ID_RE) ?? []), ...(text.match(PHONE_INTL_RE) ?? [])];
  phones.forEach((phone) => push("phone", phone));

  return found;
}
