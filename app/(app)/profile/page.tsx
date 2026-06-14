'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCollection } from '@/hooks/useCollection'

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const { entries, loadCollection } = useCollection()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    loadCollection()
  }, [])

  const totalCards = entries.reduce((sum, e) => sum + e.quantity, 0)
  const totalValue = entries.reduce((sum, e) => sum + ((e.card?.market_price ?? 0) * e.quantity), 0)
  const uniqueSets = new Set(entries.map(e => e.card?.set_id ?? e.card_id.split('-')[0])).size

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">Profil</h1>
      {email && <p className="text-sm text-gray-500 mb-6">{email}</p>}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-3xl font-bold text-blue-600">{totalCards}</p>
          <p className="text-sm text-gray-500 mt-1">Cartes</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-3xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Valeur estimée</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 col-span-2">
          <p className="text-3xl font-bold text-purple-600">{uniqueSets}</p>
          <p className="text-sm text-gray-500 mt-1">Sets entamés</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium"
      >
        Déconnexion
      </button>
    </div>
  )
}
