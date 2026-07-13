"use client";

import { useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  required?: boolean;
};

const inputClass =
  "w-full border border-white/20 bg-navy-deep px-4 py-3 font-body text-sm text-white placeholder:text-warmgray focus:border-teal focus:outline-none";

/** Shared intake form — submits to /api/intake with a segment tag for CRM routing. */
export default function IntakeForm({
  segment,
  fields,
  submitLabel,
}: {
  segment: string;
  fields: Field[];
  submitLabel: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, ...data }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus("sent");
        setMessage(json.message ?? "Received. We'll be in touch.");
        form.reset();
      } else {
        setStatus("error");
        setMessage(json.message ?? "Something went wrong — try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="border border-teal p-8">
        <p className="font-headline text-3xl tracking-headline text-teal">
          RECEIVED.
        </p>
        <p className="mt-2 font-body text-sm text-white/80">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((f) =>
        f.type === "textarea" ? (
          <div key={f.name}>
            <label
              htmlFor={`${segment}-${f.name}`}
              className="mb-1 block font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray"
            >
              {f.label}
              {f.required && <span className="text-teal"> *</span>}
            </label>
            <textarea
              id={`${segment}-${f.name}`}
              name={f.name}
              required={f.required}
              rows={4}
              className={inputClass}
            />
          </div>
        ) : (
          <div key={f.name}>
            <label
              htmlFor={`${segment}-${f.name}`}
              className="mb-1 block font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray"
            >
              {f.label}
              {f.required && <span className="text-teal"> *</span>}
            </label>
            <input
              id={`${segment}-${f.name}`}
              name={f.name}
              type={f.type ?? "text"}
              required={f.required}
              className={inputClass}
            />
          </div>
        )
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-teal px-8 py-4 font-body text-sm font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : submitLabel}
      </button>
      {status === "error" && (
        <p className="font-body text-sm text-gold">{message}</p>
      )}
    </form>
  );
}
