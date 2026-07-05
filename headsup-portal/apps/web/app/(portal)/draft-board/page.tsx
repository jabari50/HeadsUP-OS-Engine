import { redirect } from "next/navigation";

import DraftBoardClient from "@/components/DraftBoardClient";
import { getAuth, getOperator } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DraftBoardPage() {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");
  if (auth.role === "Athlete" || auth.role === "NDA_Analyst") redirect("/dashboard");

  const operator = await getOperator(auth.user.id);
  const readOnly = !operator; // scouts browse; operators rank

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Draft Board</h1>
      <p className="mb-6 text-sm text-slate-400">
        Processed athletes surface here automatically. {readOnly && "Read-only scout view — verified profiles only."}
      </p>
      <DraftBoardClient readOnly={readOnly} />
    </div>
  );
}
