'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { getCardsBySet } from '@/lib/optcgapi'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import type { Card } from '@/types'

export default function SetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
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

  const liveEntry = selectedCard ? (entries.find(e => e.card_id === selectedCard.id) ?? undefined) : undefined

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
          {allCards.map((card, i) => {
            const entry = ownedMap.get(card.id)
            const owned = !!entry
            return (
              <button
                key={card.id}
                style={{ animationDelay: `${Math.min(i * 20, 500)}ms` }}
                onClick={() => setSelectedCard(card)}
                className={`animate-fade-in-up group relative aspect-2/3 rounded-lg overflow-hidden border transition-all active:scale-95 ${
                  owned
                    ? 'border-indigo-300 shadow-sm'
                    : 'border-slate-200 opacity-40 grayscale'
                }`}
              >
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] p-1 text-center">
                    {card.id}
                  </div>
                )}
                {/* Overlay prix au survol */}
                {card.market_price && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-white text-[9px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ${card.market_price.toFixed(2)}
                  </div>
                )}
                {/* Badge quantité */}
                {owned && (
                  <span className="absolute top-1 right-1 bg-indigo-500 text-white text-[10px] min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center font-bold">
                    {entry.quantity}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          entry={liveEntry}
          onClose={() => setSelectedCard(null)}
          onUpdateQuantity={liveEntry ? updateQuantity : undefined}
          onRemove={liveEntry ? removeCard : undefined}
        />
      )}
    </div>
  )
}
