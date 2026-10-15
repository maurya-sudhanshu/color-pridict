import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-2026";
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "SUB_ADMIN"]);

interface SessionClaims {
  role?: string;
  exp?: number;
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function getVerifiedClaims(token: string): Promise<SessionClaims | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) return null;

    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as SessionClaims;
    if (typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const requiredRole = pathname === "/game" || pathname.startsWith("/game/") ||
    pathname === "/wallet" || pathname.startsWith("/wallet/")
    ? "user"
    : "admin";
  const token = req.cookies.get("token")?.value;
  const claims = token ? await getVerifiedClaims(token) : null;
  const hasRequiredRole = requiredRole === "admin"
    ? !!claims && !!claims.role && ADMIN_ROLES.has(claims.role)
    : claims?.role === "USER";

  if (hasRequiredRole) return NextResponse.next();

  return NextResponse.rewrite(new URL("/access-denied", req.url), { status: 403 });
}

export const config = {
  matcher: ["/admin/:path*", "/game/:path*", "/wallet/:path*"],
};
