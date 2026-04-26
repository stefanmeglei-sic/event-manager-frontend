import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "API Docs — Event Manager",
};

type OpenApiOperation = {
  summary?: string;
  description?: string;
  tags?: string[];
};

type OpenApiSpec = {
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, Record<string, OpenApiOperation>>;
};

type EndpointItem = {
  method: string;
  path: string;
  summary: string;
  description: string;
  tag: string;
};

const METHOD_COLORS: Record<string, string> = {
  get: "bg-emerald-500",
  post: "bg-sky-500",
  patch: "bg-amber-500",
  put: "bg-indigo-500",
  delete: "bg-rose-500",
};

function getBackendBaseUrl(): string {
  const configured =
    process.env.BACKEND_INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000/api/v1";
  return configured.replace(/\/api\/v1\/?$/, "");
}

async function getBackendPublicBaseUrl(): Promise<string> {
  const configured =
    process.env.NEXT_PUBLIC_BROWSER_API_URL ||
    process.env.NEXT_PUBLIC_API_BROWSER_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (configured) {
    return configured.replace(/\/api\/v1\/?$/, "");
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";

  try {
    const url = new URL(`${protocol}://${host}`);
    url.port = "8000";
    return url.origin;
  } catch {
    return "http://localhost:8000";
  }
}

async function getOpenApiSpec(): Promise<OpenApiSpec | null> {
  const openApiUrl = `${getBackendBaseUrl()}/openapi.json`;
  try {
    const response = await fetch(openApiUrl, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as OpenApiSpec;
  } catch {
    return null;
  }
}

function buildEndpoints(spec: OpenApiSpec | null): EndpointItem[] {
  if (!spec?.paths) return [];

  const items: EndpointItem[] = [];
  const paths = spec.paths;

  for (const path of Object.keys(paths)) {
    const pathOperations = paths[path] ?? {};
    for (const method of Object.keys(pathOperations)) {
      const operation = pathOperations[method];
      if (!operation) continue;
      items.push({
        method,
        path,
        summary: operation.summary ?? "No summary",
        description: operation.description ?? "",
        tag: operation.tags?.[0] ?? "general",
      });
    }
  }

  return items.sort((a, b) => {
    if (a.tag !== b.tag) return a.tag.localeCompare(b.tag);
    return a.path.localeCompare(b.path);
  });
}

export default async function ApiDocsPage(): Promise<React.JSX.Element> {
  const spec = await getOpenApiSpec();
  const endpoints = buildEndpoints(spec);
  const backendBaseUrl = getBackendBaseUrl();
  const backendPublicBaseUrl = await getBackendPublicBaseUrl();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#e0f2fe_0%,#fff7ed_35%,#f8fafc_75%)] px-6 py-10 text-slate-900 md:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Swagger Frontend
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {spec?.info?.title ?? "Event Manager API"}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Version: {spec?.info?.version ?? "unknown"}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm">
              <a
                href={`${backendPublicBaseUrl}/docs`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
              >
                Open FastAPI Swagger
              </a>
              <a
                href={`${backendPublicBaseUrl}/openapi.json`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2"
              >
                Open raw OpenAPI JSON
              </a>
            </div>
          </div>
          {spec?.info?.description ? (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
              {spec.info.description}
            </p>
          ) : null}
        </header>

        {!spec ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h2 className="text-base font-semibold">
              Backend OpenAPI unavailable
            </h2>
            <p className="mt-2 text-sm">
              Could not fetch{" "}
              <strong>{`${backendBaseUrl}/openapi.json`}</strong>. Start the
              backend container/server and refresh.
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Endpoints
            </p>
            <p className="mt-1 text-2xl font-semibold">{endpoints.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Tags
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {new Set(endpoints.map((e) => e.tag)).size}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Auth Domains
            </p>
            <p className="mt-1 text-2xl font-semibold">1</p>
            <p className="text-xs text-slate-500">student.usv.ro</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Base URL
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-700">
              {backendPublicBaseUrl}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 md:p-7">
          <h2 className="text-xl font-semibold">Endpoint Catalog</h2>
          <div className="mt-5 grid gap-3">
            {endpoints.map((endpoint) => (
              <article
                key={`${endpoint.method}:${endpoint.path}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.6)]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide text-white ${
                      METHOD_COLORS[endpoint.method] ?? "bg-slate-500"
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {endpoint.tag}
                  </span>
                  <p className="font-mono text-sm font-semibold text-slate-800">
                    {endpoint.path}
                  </p>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {endpoint.summary}
                </p>
                {endpoint.description ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {endpoint.description}
                  </p>
                ) : null}
              </article>
            ))}
            {spec && endpoints.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                OpenAPI loaded, but no paths were found.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
