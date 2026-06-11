import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
        HeadsUP OS
      </p>
      <h1 className="mt-4 font-display text-6xl font-bold uppercase tracking-wide text-white sm:text-7xl">
        The Virtual <span className="text-gold">GM</span>
      </h1>
      <p className="mt-4 max-w-md text-center text-sm text-slate-400">
        The front-office execution layer of HeadsUP OS. Roster intelligence,
        player matching, and activation control for licensed operators.
      </p>
      <p className="mt-2 font-mono text-xs text-slate-500">
        We scout from the neck up.
      </p>
      <Link
        href="/login"
        className="mt-10 rounded bg-teal px-8 py-3 font-display text-lg font-semibold uppercase tracking-wider text-ink transition hover:bg-gold"
      >
        Operator Login
      </Link>
    </main>
  );
}
