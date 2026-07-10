import { useSession } from "@tanstack/react-start/server";

export type AdminSession = { username?: string; loginAt?: number };

export const adminSessionConfig = {
  password: process.env.ADMIN_SESSION_SECRET ?? "dev-only-fallback-min-32-chars-xxxxxxxxx",
  name: "brgka-admin",
  maxAge: 60 * 60 * 12, // 12h
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

export async function getAdminSession() {
  return await useSession<AdminSession>(adminSessionConfig);
}
