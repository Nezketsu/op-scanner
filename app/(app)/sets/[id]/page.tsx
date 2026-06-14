'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useCollection } from '@/hooks/useCollection'
import type { Card, CollectionEntry } from '@/types'

export default function SetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const { entries, loadCollection } = useCollection()

  useEffect(() => {
    async function load() {
      await loadCollection()
      const res = await fetch(`https://api.tcgdex.net/v2/en/sets/${id}/cards`)
      if (res.ok) {
        const data = await res.json()
        setAllCards(data)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const ownedIds = new Set(entries.map(e => e.card_id))
  const ownedEntryMap = entries.reduce<Record<string, CollectionEntry>>((acc, e) => {
    acc[e.card_id] = e
    return acc
  }, {})
  const ownedCount = allCards.filter(c => ownedIds.has(c.id)).length

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
  }

  return (
    <div>
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold">{id}</h1>
        <p className="text-sm text-gray-500">{ownedCount}/{allCards.length}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4 md:grid-cols-5">
        {allCards.map((card: Card) => {
          const owned = ownedIds.has(card.id)
          return (
            <div
              key={card.id}
              className={`relative aspect-[2/3] rounded-xl overflow-hidden border ${
                owned ? 'border-blue-400' : 'border-gray-200 opacity-40 grayscale'
              }`}
            >
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs p-1 text-center">
                  {card.id}
                </div>
              )}
              {owned && (ownedEntryMap[card.id]?.quantity ?? 0) > 1 && (
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {ownedEntryMap[card.id].quantity}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
