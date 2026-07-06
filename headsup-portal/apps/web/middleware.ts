/* Session refresh + REV-A surface routing. Every surface prefix requires a
   signed-in user; the role in app_metadata (server-controlled — never
   user_metadata) picks which surface the user may enter. This routing is
   convenience only: a misrouted request must still fail at RLS. */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { homeForRole, roleMayEnter, surfaceForPath } from "@/lib/surfaces";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const surface = surfaceForPath(request.nextUrl.pathname);
  if (!surface) return response;

  if (!user) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  const role = (user.app_metadata?.role as string | undefined) ?? "";
  if (!roleMayEnter(role, surface)) {
    const home = request.nextUrl.clone();
    home.pathname = homeForRole(role);
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)"],
};
