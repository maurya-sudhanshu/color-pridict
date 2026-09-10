import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-2026";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("token")?.value;
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { wallet: true, adminPermission: true },
  });

  if (!user) return null;

  return {
    ...user,
    currentSessionId: payload.sessionId || null,
  };
}

export async function requireAuth(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.isBlocked) {
    throw new Error("Your account has been blocked by the admin.");
  }
  return user;
}

export async function requireAdmin(
  req: NextRequest,
  action?: "CREATE" | "VIEW" | "UPDATE" | "DELETE"
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (user.isBlocked) {
    throw new Error("Your admin account has been suspended.");
  }

  // Super Admin / Main Admin has unrestricted full access
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return user;
  }

  // Sub-Admin check fine-grained RBAC permissions
  if (user.role === "SUB_ADMIN") {
    const permission = user.adminPermission || (await prisma.adminPermission.findUnique({
      where: { userId: user.id },
    }));

    if (!permission) {
      throw new Error("FORBIDDEN_SUB_ADMIN_NO_PERMISSIONS");
    }

    if (action === "CREATE" && !permission.canCreate) {
      throw new Error("Permission Denied: Sub-Admin does not have CREATE access");
    }
    if (action === "VIEW" && !permission.canView) {
      throw new Error("Permission Denied: Sub-Admin does not have VIEW access");
    }
    if (action === "UPDATE" && !permission.canUpdate) {
      throw new Error("Permission Denied: Sub-Admin does not have UPDATE access");
    }
    if (action === "DELETE" && !permission.canDelete) {
      throw new Error("Permission Denied: Sub-Admin does not have DELETE access");
    }

    return user;
  }

  throw new Error("FORBIDDEN_ADMIN_ONLY");
}
