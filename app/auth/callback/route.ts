import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${origin}/scan`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('[auth/callback] exchangeCodeForSession failed:', exchangeError)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
    }

    return response
  }

  return NextResponse.redirect(`${origin}/scan`)
}
