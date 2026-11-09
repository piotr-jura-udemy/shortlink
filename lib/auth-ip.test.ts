import { getIP } from "better-auth/api";
import { describe, expect, it } from "vitest";
import { ipAddressOptionsFromEnv } from "./auth-ip";

function resolve(env: Record<string, string | undefined>, headers: HeadersInit) {
  return getIP(new Headers(headers), {
    advanced: { ipAddress: ipAddressOptionsFromEnv(env) },
  });
}

describe("ipAddressOptionsFromEnv", () => {
  it("returns no overrides when nothing is configured", () => {
    expect(ipAddressOptionsFromEnv({})).toEqual({});
  });

  it("reads the client IP only from the configured proxy header", () => {
    const ip = resolve(
      { BETTER_AUTH_IP_HEADERS: "x-real-ip" },
      { "x-forwarded-for": "203.0.113.9", "x-real-ip": "198.51.100.4" },
    );
    expect(ip).toBe("198.51.100.4");
  });

  it("ignores a spoofed X-Forwarded-For when another header is configured", () => {
    const ip = resolve(
      { BETTER_AUTH_IP_HEADERS: "cf-connecting-ip" },
      { "x-forwarded-for": "203.0.113.9" },
    );
    expect(ip).not.toBe("203.0.113.9");
  });

  it("strips trusted proxy hops from the right of X-Forwarded-For", () => {
    const ip = resolve(
      { BETTER_AUTH_TRUSTED_PROXIES: "10.0.0.0/8, 192.0.2.10" },
      { "x-forwarded-for": "203.0.113.9, 198.51.100.4, 10.1.2.3" },
    );
    expect(ip).toBe("198.51.100.4");
  });
});
