import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function getLandingPath(role: string | undefined): string {
  if (role === "admin") return "/admin/reports";
  if (role === "organizer") return "/organizer";
  return "/events";
}

function decodeJwtRole(token: string): string | undefined {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return undefined;

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const parsed = JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as {
      role?: string;
    };
    return parsed.role;
  } catch {
    return undefined;
  }
}

export default async function Home(): Promise<never> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const role = decodeJwtRole(token);
  redirect(getLandingPath(role));
}

