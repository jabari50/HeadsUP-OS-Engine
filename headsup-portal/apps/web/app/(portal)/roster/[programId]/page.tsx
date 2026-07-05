import { redirect } from "next/navigation";

import RosterClient from "@/components/RosterClient";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RosterPage({ params }: { params: { programId: string } }) {
  const auth = await getAuth();
  if (!auth) redirect("/auth/login");
  if (auth.role === "Athlete" || auth.role === "NDA_Analyst") redirect("/dashboard");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Roster Sync</h1>
      <RosterClient programId={params.programId} />
    </div>
  );
}
