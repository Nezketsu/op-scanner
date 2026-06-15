'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { getCardsBySet } from '@/lib/optcgapi'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import type { Card, CollectionEntry } from '@/types'

export default function SetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<CollectionEntry | null>(null)
  const { entries, loadCollection, updateQuantity, removeCard } = useCollection()

  useEffect(() => {
    async function load() {
      await loadCollection()
      const cards = await getCardsBySet(id)
      setAllCards(cards)
      setLoading(false)
    }
    load()
  }, [id])

  const setEntries = entries.filter(e => (e.card?.set_id ?? e.card_id.split('-')[0]) === id)
  const ownedMap = new Map(setEntries.map(e => [e.card_id, e]))
  const ownedCount = allCards.filter(c => ownedMap.has(c.id)).length
  const percent = allCards.length ? Math.round((ownedCount / allCards.length) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 bg-white border-b border-slate-100 z-10">
        <div className="px-4 pt-4 pb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-indigo-500 text-sm font-semibold mb-3"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            Retour
          </button>
          <h1 className="font-bold text-slate-900 text-lg">{id}</h1>
          <p className="text-xs text-slate-400 mt-0.5 mb-2">
            {loading ? '...' : `${ownedCount}/${allCards.length} · ${percent}%`}
          </p>
          {!loading && <ProgressBar value={percent} thick />}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-1.5 p-4 md:grid-cols-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="aspect-2/3 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 p-4 pb-24 md:grid-cols-6">
          {allCards.map(card => {
            const entry = ownedMap.get(card.id)
            const owned = !!entry
            return (
              <button
                key={card.id}
                onClick={() => entry && setSelectedEntry(entry)}
                className={`relative aspect-2/3 rounded-lg overflow-hidden border transition-all ${
                  owned
                    ? 'border-indigo-300 shadow-sm active:scale-95'
                    : 'border-slate-200 opacity-40 grayscale cursor-default'
                }`}
              >
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] p-1 text-center">
                    {card.id}
                  </div>
                )}
                {owned && (entry.quantity ?? 0) > 1 && (
                  <span className="absolute top-1 right-1 bg-indigo-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {entry.quantity}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {selectedEntry && (
        <CardDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeCard}
        />
      )}
    </div>
  )
}
