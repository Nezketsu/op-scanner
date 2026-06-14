import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const params = await searchParams

  if (params.error) {
    redirect(`/login?error=${encodeURIComponent(params.error)}`)
  }

  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`)
  }

  redirect('/scan')
}
