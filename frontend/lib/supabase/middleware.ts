// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, path: "/" })
          );
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}
