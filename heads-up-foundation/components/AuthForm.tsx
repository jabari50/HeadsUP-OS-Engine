"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const ROLES = [
  { value: "athlete", label: "Athlete" },
  { value: "parent", label: "Parent / Guardian" },
  { value: "coach", label: "Coach" },
  { value: "mentor", label: "Mentor" },
] as const;

const inputClass =
  "w-full border border-white/20 bg-navy-deep px-4 py-3 font-body text-sm text-white placeholder:text-warmgray focus:border-teal focus:outline-none";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [role, setRole] = useState<string>("athlete");
  const [status, setStatus] = useState<"idle" | "busy">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const configured = supabaseConfigured();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!configured) return;
    setError("");
    setNotice("");
    setStatus("busy");
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, full_name: String(data.get("name") ?? "") },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
      else setNotice("Check your email to verify your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        router.push("/dashboard");
        router.refresh();
        return;
      }
    }
    setStatus("idle");
  }

  async function handleGoogle() {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="w-full max-w-md">
      {!configured && (
        <div className="needs-input mb-6">
          Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to activate auth. UI shown for design
          review.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1 block font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray"
              >
                Full Name <span className="text-teal">*</span>
              </label>
              <input id="auth-name" name="name" required className={inputClass} />
            </div>
            <div>
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray">
                I am a… <span className="text-teal">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`border px-4 py-3 font-body text-xs font-bold uppercase tracking-wide2 transition-colors ${
                      role === r.value
                        ? "border-teal bg-teal text-navy"
                        : "border-white/20 text-white/80 hover:border-teal"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label
            htmlFor="auth-email"
            className="mb-1 block font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray"
          >
            Email <span className="text-teal">*</span>
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="auth-password"
            className="mb-1 block font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray"
          >
            Password <span className="text-teal">*</span>
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            required
            minLength={8}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={status === "busy" || !configured}
          className="w-full bg-teal px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white disabled:opacity-50"
        >
          {status === "busy"
            ? "Working…"
            : mode === "signup"
              ? "Create Account"
              : "Log In"}
        </button>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={!configured}
          className="w-full border border-white/30 px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-white transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
        >
          Continue with Google
        </button>

        {error && <p className="font-body text-sm text-gold">{error}</p>}
        {notice && <p className="font-body text-sm text-teal">{notice}</p>}
      </form>

      <p className="mt-6 font-body text-sm text-warmgray">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-teal hover:text-white">
              Log in
            </Link>
          </>
        ) : (
          <>
            New to PRO-File OS?{" "}
            <Link href="/signup" className="text-teal hover:text-white">
              Create an account
            </Link>
          </>
        )}
      </p>
      {mode === "signup" && (
        <p className="mt-4 font-body text-xs leading-relaxed text-warmgray">
          Athletes under 18 require a linked parent/guardian account. Profiles
          are locked to outside viewers by default.
        </p>
      )}
    </div>
  );
}
