"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  sendMagicLink,
  signInWithPassword,
  type LoginState,
} from "./actions";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-teal px-4 py-3 font-display text-lg font-semibold uppercase tracking-wider text-ink transition hover:bg-gold disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function LoginPage() {
  const [pwState, pwAction] = useFormState<LoginState, FormData>(
    signInWithPassword,
    null
  );
  const [linkState, linkAction] = useFormState<LoginState, FormData>(
    sendMagicLink,
    null
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg border border-navy bg-card p-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
          HeadsUP OS
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase text-white">
          Operator Login
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in with your operator credentials.
        </p>

        {/* Password login — primary */}
        <form action={pwAction} className="mt-6 space-y-4">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="coach@program.edu"
            className="w-full rounded border border-navy bg-ink px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none focus:border-teal"
          />
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            className="w-full rounded border border-navy bg-ink px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none focus:border-teal"
          />
          <SubmitButton label="Log In" pendingLabel="Signing in..." />
        </form>

        {pwState && !pwState.ok && (
          <p className="mt-3 font-mono text-xs text-gold">{pwState.message}</p>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-navy" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            or
          </span>
          <span className="h-px flex-1 bg-navy" />
        </div>

        {/* Magic link — alternative */}
        <form action={linkAction} className="space-y-3">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Email for magic link"
            className="w-full rounded border border-navy bg-ink px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none focus:border-teal"
          />
          <button
            type="submit"
            className="w-full rounded border border-navy px-4 py-3 font-mono text-xs uppercase tracking-wider text-slate-300 transition hover:border-teal hover:text-teal"
          >
            Email me a magic link
          </button>
        </form>

        {linkState && (
          <p
            className={`mt-3 font-mono text-xs ${
              linkState.ok ? "text-teal" : "text-gold"
            }`}
          >
            {linkState.message}
          </p>
        )}
      </div>
    </main>
  );
}
