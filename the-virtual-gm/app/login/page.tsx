"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendMagicLink, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-teal px-4 py-3 font-display text-lg font-semibold uppercase tracking-wider text-ink transition hover:bg-gold disabled:opacity-50"
    >
      {pending ? "Sending..." : "Send Magic Link"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(
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
          Enter your licensed operator email. We&apos;ll send you a magic link
          — no password needed.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <input
            type="email"
            name="email"
            required
            placeholder="coach@program.edu"
            className="w-full rounded border border-navy bg-ink px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none focus:border-teal"
          />
          <SubmitButton />
        </form>

        {state && (
          <p
            className={`mt-4 font-mono text-xs ${
              state.ok ? "text-teal" : "text-gold"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </main>
  );
}
