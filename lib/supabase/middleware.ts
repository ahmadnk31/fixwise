import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let session = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch (error) {
    // Invalid or corrupted token - clear all auth cookies
    console.error("Auth session error:", error)
    const authCookies = ["sb-access-token", "sb-refresh-token"]
    authCookies.forEach((cookieName) => {
      supabaseResponse.cookies.delete(cookieName)
    })
  }

  // Redirect to login if accessing protected routes without auth
  if (
    !session &&
    (request.nextUrl.pathname.startsWith("/shop/dashboard") || 
     request.nextUrl.pathname.startsWith("/shop/settings") ||
     request.nextUrl.pathname.startsWith("/shop/bookings") ||
     request.nextUrl.pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
