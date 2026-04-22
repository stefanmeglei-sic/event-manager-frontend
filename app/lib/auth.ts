export interface AuthUser {
  token: string;
  email: string;
}

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BROWSER_API_URL) {
    return process.env.NEXT_PUBLIC_BROWSER_API_URL;
  }

  // Client-side calls must use a browser-reachable host, not Docker internal DNS.
  if (typeof window !== "undefined") {
    return "http://localhost:8000/api/v1";
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
}

export async function loginWithGoogleToken(idToken: string): Promise<AuthUser> {
  const response = await fetch(`${getApiBaseUrl()}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(error.detail || "Authentication failed");
  }

  const data = await response.json() as { access_token: string };

  // Decode JWT payload (second segment, base64url-encoded JSON)
  const payloadB64 = data.access_token.split(".")[1] ?? "";
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))) as {
    email: string;
  };

  return { token: data.access_token, email: payload.email };
}
