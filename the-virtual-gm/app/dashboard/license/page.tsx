import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateOperator } from "@/lib/operator";
import { TIER_LABELS } from "@/lib/types";
import PortalButton from "./portal-button";

export default async function LicensePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const operator = await getOrCreateOperator(supabase, user);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase text-white">
          Operator License
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your HeadsUP OS operator license and billing.
        </p>
      </div>

      <div className="rounded-lg border border-navy bg-card p-6">
        {operator ? (
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-xs uppercase text-slate-500">
                Operator
              </dt>
              <dd className="mt-1 text-white">{operator.name}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-slate-500">
                Email
              </dt>
              <dd className="mt-1 font-mono text-sm text-white">
                {operator.email}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-slate-500">
                License Tier
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold uppercase text-gold">
                {TIER_LABELS[operator.license_tier] ?? operator.license_tier}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-slate-500">
                Status
              </dt>
              <dd className="mt-1">
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs uppercase ${
                    operator.active
                      ? "bg-teal/15 text-teal"
                      : "bg-gold/15 text-gold"
                  }`}
                >
                  {operator.active ? "Active" : "Inactive"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-slate-500">
                Member Since
              </dt>
              <dd className="mt-1 font-mono text-sm text-white">
                {new Date(operator.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-slate-500">
                Plan
              </dt>
              <dd className="mt-1 font-mono text-sm text-white">$200/mo</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-slate-400">
            Could not load your operator profile. Try refreshing.
          </p>
        )}

        <PortalButton />
      </div>
    </div>
  );
}
