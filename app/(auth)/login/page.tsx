'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleOAuth = (provider: 'google' | 'discord') => {
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
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

        <form onSubmit={handleEmailLogin} aria-label="form" className="space-y-3">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
