"use client";

import { useEffect, useState } from "react";

type AuthUser = { id: string; email: string; role: string; token: string };

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("event_manager_auth");
      if (stored) setUser(JSON.parse(stored) as AuthUser);
    } catch {
      /* ignore */
    }
  }, []);

  if (!user) return <p className="text-muted p-8">Not signed in.</p>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-text mb-6">Your Profile</h1>
      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Email</p>
          <p className="text-text">{user.email}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Role</p>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary capitalize">
            {user.role}
          </span>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">User ID</p>
          <p className="font-mono text-xs text-muted">{user.id}</p>
        </div>
      </div>
    </main>
  );
}
