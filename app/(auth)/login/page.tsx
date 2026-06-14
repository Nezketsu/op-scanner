'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(urlError)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/scan'
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Compte créé ! Vérifie ton email pour confirmer.')
    }

    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'discord') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })
    if (error) { setError(error.message); return }
    if (data.url) window.location.href = data.url
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">OP Scanner</h1>
      <p className="text-gray-500 mb-8">Ta collection One Piece</p>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => handleOAuth('google')}
          className="w-full py-3 px-4 bg-white text-gray-900 border border-gray-300 rounded-xl font-medium"
        >
          Continuer avec Google
        </button>
        <button
          onClick={() => handleOAuth('discord')}
          className="w-full py-3 px-4 bg-[#5865F2] text-white rounded-xl font-medium"
        >
          Continuer avec Discord
        </button>

        <div className="flex items-center gap-3 my-2">
          <hr className="flex-1 border-gray-200" />
          <span className="text-sm text-gray-400">ou</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <form onSubmit={handleSubmit} aria-label="form" className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {loading
              ? mode === 'login' ? 'Connexion...' : 'Création...'
              : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }}
          className="w-full text-sm text-gray-500 py-2"
        >
          {mode === 'login' ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </div>
  )
}
