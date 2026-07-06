import { redirect } from "next/navigation";

import IntakeForm from "@/components/IntakeForm";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");
  if (auth.role === "NDA_Analyst") redirect("/dashboard");

  const canScore = ["College_Scout", "Coach", "System_Admin"].includes(auth.role);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Intake</h1>
      <p className="mb-6 text-sm text-slate-400">
        intake → validate → score → surface → gate. Scores are engine-computed — nothing here
        writes a number the engine didn&apos;t produce.
      </p>
      <IntakeForm canScore={canScore} />
    </div>
  );
}
