"use client";

import { useFormState, useFormStatus } from "react-dom";
import { openBillingPortal, type PortalState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-teal px-6 py-2.5 font-display text-base font-semibold uppercase tracking-wider text-ink transition hover:bg-gold disabled:opacity-50"
    >
      {pending ? "Opening..." : "Manage Billing"}
    </button>
  );
}

export default function PortalButton() {
  const [state, formAction] = useFormState<PortalState, FormData>(
    openBillingPortal,
    null
  );

  return (
    <form action={formAction} className="mt-6">
      <Submit />
      {state?.message && (
        <p className="mt-3 font-mono text-xs text-gold">{state.message}</p>
      )}
    </form>
  );
}
