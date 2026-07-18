import Link from "next/link";
import { notFound } from "next/navigation";
import { PIPELINES } from "@/lib/pipelines";

export function generateStaticParams() {
  return PIPELINES.map((p) => ({ pipeline: p.slug }));
}

export const dynamicParams = false;

export default async function PipelineWorkspace({
  params,
}: {
  params: Promise<{ pipeline: string }>;
}) {
  const { pipeline } = await params;
  const meta = PIPELINES.find((p) => p.slug === pipeline);
  if (!meta) notFound();

  const isProquest = meta.slug === "proquest";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Pipeline {String(meta.id).padStart(2, "0")}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">{meta.name}</h1>
        </div>
        <nav className="flex items-center gap-4 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">Command Center</Link>
        </nav>
      </header>

      <main className="px-8 py-10 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <span
            className={`h-2 w-2 rounded-full ${meta.status === "active" ? "bg-green-400" : "bg-yellow-400"}`}
          />
          <span className="text-xs font-semibold tracking-wider text-zinc-400">
            {meta.status === "active" ? "LIVE" : "BUILDING"}
          </span>
        </div>

        <p className="text-sm text-zinc-400 mb-8">{meta.description}</p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase mb-4">
            Workspace Scope
          </h2>
          <ul className="space-y-3">
            {meta.scope.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {isProquest && (
          <div className="mt-6 flex gap-3">
            <Link
              href="/onboard"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Launch Live Onboarding →
            </Link>
            <Link
              href="/roster"
              className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500"
            >
              View Roster
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
