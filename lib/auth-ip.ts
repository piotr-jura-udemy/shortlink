type Env = Record<string, string | undefined>;

function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Better Auth keys rate limits on client IP, read from `X-Forwarded-For` by
 * default — which any client can set when the app is reached directly.
 * Deployments must name the header their proxy overwrites
 * (`BETTER_AUTH_IP_HEADERS`) and/or the proxies that append to
 * `X-Forwarded-For` (`BETTER_AUTH_TRUSTED_PROXIES`).
 *
 * Unconfigured production trusts no header, so every client shares one
 * rate-limit bucket per path: strict, but not bypassable.
 */
export function ipAddressOptionsFromEnv(env: Env = process.env): {
  ipAddressHeaders?: string[];
  trustedProxies?: string[];
} {
  const ipAddressHeaders = list(env.BETTER_AUTH_IP_HEADERS);
  const trustedProxies = list(env.BETTER_AUTH_TRUSTED_PROXIES);

  if (
    env.NODE_ENV === "production" &&
    ipAddressHeaders.length === 0 &&
    trustedProxies.length === 0
  ) {
    return { ipAddressHeaders: [] };
  }

  return {
    ...(ipAddressHeaders.length > 0 ? { ipAddressHeaders } : {}),
    ...(trustedProxies.length > 0 ? { trustedProxies } : {}),
  };
}
