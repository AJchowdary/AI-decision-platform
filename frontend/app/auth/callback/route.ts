// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth callback: run code exchange on the SERVER so the code_verifier cookie
 * (set when user clicked "Continue with Google" on /login) is available in
 * the request. Client-side exchange fails because that cookie is not always
 * sent/available on the callback page load.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/decision-cards";
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!code) {
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { ...options, path: "/" });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=auth&message=${encodeURIComponent(error.message)}`, requestUrl.origin)
    );
  }

  if (data?.session) {
    return response;
  }

  return NextResponse.redirect(
    new URL(`/login?error=auth`, requestUrl.origin)
  );
}
