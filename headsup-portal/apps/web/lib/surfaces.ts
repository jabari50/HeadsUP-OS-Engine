/* REV-A role→surface map (§4.1). Pure constants — imported by edge
   middleware and server layouts alike, so nothing server-only lives here.
   Surface routing is convenience; RLS remains the security boundary. */

export type Surface = "athlete" | "operator" | "admin";

export const ATHLETE_PREFIXES = ["/me"];

export const OPERATOR_PREFIXES = [
  "/dashboard",
  "/intake",
  "/draft-board",
  "/roster",
  "/matchmaking",
  "/athletes",
];

export const ADMIN_PREFIXES = ["/admin"];

const OPERATOR_ROLES = ["College_Scout", "Coach", "NDA_Analyst"];

export function surfaceForPath(pathname: string): Surface | null {
  const starts = (prefixes: string[]) => prefixes.some((p) => pathname.startsWith(p));
  if (starts(ATHLETE_PREFIXES)) return "athlete";
  if (starts(OPERATOR_PREFIXES)) return "operator";
  if (starts(ADMIN_PREFIXES)) return "admin";
  return null;
}

/* System_Admin (Jabari review layer) may enter every surface.
   "" (fresh /join signup, no app_metadata.role yet) gets the athlete
   surface: least privilege — athlete RLS is user_id-scoped, so a roleless
   account can only ever read the row it self-enrolled. Operator and admin
   surfaces always require an explicit provisioned role. */
export function roleMayEnter(role: string, surface: Surface): boolean {
  if (role === "System_Admin") return true;
  if (surface === "athlete") return role === "Athlete" || role === "";
  if (surface === "operator") return OPERATOR_ROLES.includes(role);
  return false;
}

/* Where a signed-in user lands when they hit a surface that isn't theirs. */
export function homeForRole(role: string): string {
  if (OPERATOR_ROLES.includes(role)) return "/dashboard";
  if (role === "System_Admin") return "/dashboard";
  return "/me";
}
