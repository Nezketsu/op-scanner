'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
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

  const initial = email ? email[0].toUpperCase() : '?'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 px-5 pt-10 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initial}
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Mon profil</p>
            {email && <p className="text-slate-400 text-sm mt-0.5 truncate">{email}</p>}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">{totalCards}</p>
            <p className="text-xs text-slate-400 mt-0.5">Cartes</p>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-green-400">${totalValue.toFixed(0)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Valeur</p>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-white">{uniqueSets}</p>
            <p className="text-xs text-slate-400 mt-0.5">Sets</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold active:bg-slate-50"
        >
          <LogOut size={15} strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </div>
  )
}
