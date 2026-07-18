import TalentApp from "./TalentApp";

export default async function TalentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const flag = (v: string | string[] | undefined) =>
    v === "1" || v === "true" || (Array.isArray(v) && v.includes("1"));
  return <TalentApp coachView={flag(sp.coach)} pendingFirst={flag(sp.pendingFirst)} />;
}
