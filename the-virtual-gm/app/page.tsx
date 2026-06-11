import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingScreen } from "./landing-client";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <LandingScreen />;
}
