"use client";

import { useState } from "react";

import { browserClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const supabase = browserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-edge2 bg-panel">
        <div className="stripe" />
        <div className="p-7">
          <div className="font-display text-[10px] font-bold uppercase tracking-[3px] text-slate-500">
            HeadsUp OS · Neural Data Agency
          </div>
          <h1 className="mt-1 font-display text-2xl font-extrabold uppercase leading-none text-ink">
            Command <span className="text-hgreen">Center</span>
          </h1>
          <p className="mb-6 mt-1 text-xs text-slate-400">We Scout From The Neck Up.</p>
          {status === "sent" ? (
            <p className="text-sm">Magic link sent — check your email.</p>
          ) : (
            <form onSubmit={sendLink} className="space-y-3">
              <input
                className="input"
                type="email"
                required
                placeholder="you@program.org"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button className="btn w-full" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send magic link"}
              </button>
              {status === "error" && <p className="text-sm text-red-400">{message}</p>}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
