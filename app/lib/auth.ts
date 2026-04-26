export interface AuthUser {
  id: string;
  token: string;
  email: string;
  role: string;
}

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BROWSER_API_URL) {
    return process.env.NEXT_PUBLIC_BROWSER_API_URL;
  }
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
}

async function fetchToken(
  path: string,
  body: Record<string, string>,
): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      detail?: string;
    };
    throw new Error(error.detail || "Authentication failed");
  }
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function fetchMe(token: string): Promise<AuthUser> {
  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }
  const user = (await response.json()) as {
    id: string;
    email: string;
    role: string;
  };
  return { id: user.id, token, email: user.email, role: user.role };
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthUser> {
  const token = await fetchToken("/auth/login", { email, password });
  return fetchMe(token);
}

export async function loginWithGoogleToken(idToken: string): Promise<AuthUser> {
  const token = await fetchToken("/auth/google", { id_token: idToken });
  return fetchMe(token);
}
