import { describe, expect, it } from "vitest";
import { detectEntities } from "./detect";

describe("detectEntities", () => {
  it("detects an email address", () => {
    const found = detectEntities("Contact me at test.user@example.com for details.");
    expect(found).toContainEqual({ type: "email", value: "test.user@example.com" });
  });

  it("detects a valid IPv4 address", () => {
    const found = detectEntities("The server responded from 192.168.1.10 last night.");
    expect(found).toContainEqual({ type: "ip", value: "192.168.1.10" });
  });

  it("rejects an octet above 255 as not a valid IPv4", () => {
    const found = detectEntities("Some numbers 999.999.999.999 here.");
    expect(found.some((e) => e.type === "ip")).toBe(false);
  });

  it("detects a domain, including a two-part Indonesian TLD", () => {
    const found = detectEntities("Found it on contoh.co.id and another-site.com.");
    expect(found).toContainEqual({ type: "domain", value: "contoh.co.id" });
    expect(found).toContainEqual({ type: "domain", value: "another-site.com" });
  });

  it("does not mistake an email's domain part for a separate domain match", () => {
    const found = detectEntities("test.user@example.com");
    const domains = found.filter((e) => e.type === "domain");
    expect(domains).toHaveLength(0);
  });

  it("does not mistake an IP's dotted numbers for a domain match", () => {
    const found = detectEntities("192.168.1.10");
    const domains = found.filter((e) => e.type === "domain");
    expect(domains).toHaveLength(0);
  });

  it("detects an Indonesian local-format phone number", () => {
    const found = detectEntities("Reach out at 081234567890 if urgent.");
    expect(found).toContainEqual({ type: "phone", value: "081234567890" });
  });

  it("detects an Indonesian +62-format phone number", () => {
    const found = detectEntities("Call +6281234567890 anytime.");
    expect(found.some((e) => e.type === "phone" && e.value === "+6281234567890")).toBe(true);
  });

  it("detects a generic international phone number", () => {
    const found = detectEntities("International line: +14155552671.");
    expect(found).toContainEqual({ type: "phone", value: "+14155552671" });
  });

  it("deduplicates case-insensitively across repeated mentions", () => {
    const found = detectEntities("Email Test@Example.com and again test@example.com.");
    const emails = found.filter((e) => e.type === "email");
    expect(emails).toHaveLength(1);
  });

  it("returns an empty array for text with nothing to detect", () => {
    expect(detectEntities("Just a plain sentence with nothing notable.")).toEqual([]);
  });
});
