"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/app/components/AuthProvider";
import { useLocale } from "@/app/components/LocaleProvider";
import { apiFetch } from "@/lib/api/client";
import type { EventCategory } from "@/lib/types";

type EditableItem = {
  id: string;
  nume: string;
};

type Drafts = Record<string, string>;

export default function AdminLookupsPage(): React.JSX.Element {
  const { user } = useAuth();
  const { t } = useLocale();
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState<EditableItem[]>([]);
  const [participationTypes, setParticipationTypes] = useState<EditableItem[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [participationInput, setParticipationInput] = useState("");
  const [drafts, setDrafts] = useState<Drafts>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const [cats, participation] = await Promise.all([
        apiFetch<EventCategory[]>("/lookups/event-categories"),
        apiFetch<EventCategory[]>("/lookups/participation-types"),
      ]);

      const mappedCategories = cats.map((item) => ({ id: item.id, nume: item.nume }));
      const mappedParticipation = participation.map((item) => ({ id: item.id, nume: item.nume }));

      setCategories(mappedCategories);
      setParticipationTypes(mappedParticipation);

      const nextDrafts: Drafts = {};
      [...mappedCategories, ...mappedParticipation].forEach((item) => {
        nextDrafts[item.id] = item.nume;
      });
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_lookups.failed_to_load"));
    }
  }, [t]);

  useEffect(() => {
    if (!isAdmin) return;
    void (async () => {
      await loadData();
    })();
  }, [isAdmin, loadData]);

  async function createCategory(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const nume = categoryInput.trim();
    if (!nume) {
      setError(t("admin_lookups.name_required"));
      return;
    }
    setError(null);
    try {
      await apiFetch("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ nume }),
      });
      setCategoryInput("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_lookups.failed_to_create"));
    }
  }

  async function createParticipationType(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const nume = participationInput.trim();
    if (!nume) {
      setError(t("admin_lookups.name_required"));
      return;
    }
    setError(null);
    try {
      await apiFetch("/admin/participation-types", {
        method: "POST",
        body: JSON.stringify({ nume }),
      });
      setParticipationInput("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_lookups.failed_to_create"));
    }
  }

  async function saveItem(endpoint: string, id: string): Promise<void> {
    const nume = (drafts[id] ?? "").trim();
    if (!nume) {
      setError(t("admin_lookups.name_required"));
      return;
    }

    setError(null);
    setSavingId(id);
    try {
      await apiFetch(`${endpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ nume }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_lookups.failed_to_update"));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteItem(endpoint: string, id: string): Promise<void> {
    setError(null);
    try {
      await apiFetch(`${endpoint}/${id}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin_lookups.failed_to_delete"));
    }
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:px-10">
        <p className="text-muted">{t("common.loading_user")}</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:px-10">
        <h1 className="text-3xl font-bold tracking-tight text-text">{t("admin_lookups.restricted_title")}</h1>
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger-bg p-4 text-danger">
          {t("admin_lookups.restricted_message")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:px-10">
      <h1 className="text-3xl font-bold tracking-tight text-text">{t("admin_lookups.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("admin_lookups.subtitle")}</p>

      {error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <LookupSection
          title={t("admin_lookups.categories")}
          addLabel={t("admin_lookups.add")}
          inputValue={categoryInput}
          onInputChange={setCategoryInput}
          onSubmit={createCategory}
          items={categories}
          drafts={drafts}
          onDraftChange={setDrafts}
          savingId={savingId}
          onSave={(id) => saveItem("/admin/categories", id)}
          onDelete={(id) => deleteItem("/admin/categories", id)}
          t={t}
        />

        <LookupSection
          title={t("admin_lookups.participation_types")}
          addLabel={t("admin_lookups.add")}
          inputValue={participationInput}
          onInputChange={setParticipationInput}
          onSubmit={createParticipationType}
          items={participationTypes}
          drafts={drafts}
          onDraftChange={setDrafts}
          savingId={savingId}
          onSave={(id) => saveItem("/admin/participation-types", id)}
          onDelete={(id) => deleteItem("/admin/participation-types", id)}
          t={t}
        />
      </div>
    </main>
  );
}

type Translate = (key: string) => string;

type LookupSectionProps = {
  title: string;
  addLabel: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  items: EditableItem[];
  drafts: Drafts;
  onDraftChange: React.Dispatch<React.SetStateAction<Drafts>>;
  savingId: string | null;
  onSave: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  t: Translate;
};

function LookupSection({
  title,
  addLabel,
  inputValue,
  onInputChange,
  onSubmit,
  items,
  drafts,
  onDraftChange,
  savingId,
  onSave,
  onDelete,
  t,
}: LookupSectionProps): React.JSX.Element {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-text">{title}</h2>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t("admin_lookups.name")}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-text"
        />
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          {addLabel}
        </button>
      </form>

      <LookupList
        title={title}
        items={items}
        drafts={drafts}
        onDraftChange={onDraftChange}
        savingId={savingId}
        onSave={onSave}
        onDelete={onDelete}
        t={t}
      />
    </section>
  );
}

type LookupListProps = {
  title: string;
  items: EditableItem[];
  drafts: Drafts;
  onDraftChange: React.Dispatch<React.SetStateAction<Drafts>>;
  savingId: string | null;
  onSave: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  t: Translate;
};

function LookupList({
  title,
  items,
  drafts,
  onDraftChange,
  savingId,
  onSave,
  onDelete,
  t,
}: LookupListProps): React.JSX.Element {
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-subtle">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={drafts[item.id] ?? ""}
              onChange={(e) =>
                onDraftChange((prev) => ({
                  ...prev,
                  [item.id]: e.target.value,
                }))
              }
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => void onSave(item.id)}
                className="rounded-lg border border-border px-2 py-1 text-xs text-text hover:bg-surface-muted"
              >
                {savingId === item.id ? t("admin_lookups.saving") : t("admin_lookups.save")}
              </button>
              <button
                onClick={() => void onDelete(item.id)}
                className="rounded-lg border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger-bg"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
