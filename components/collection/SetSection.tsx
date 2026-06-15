'use client'
import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CardTile } from './CardTile'
import type { CollectionEntry, Card } from '@/types'

interface SetSectionProps {
  setId: string
  setName: string
  allCards: Card[]
  entries: CollectionEntry[]
  onCardTap: (entry: CollectionEntry) => void
  totalInSet?: number
}

export function SetSection({ setName, allCards, entries, onCardTap, totalInSet }: SetSectionProps) {
  const [expanded, setExpanded] = useState(true)

  const ownedMap = new Map(entries.map(e => [e.card_id, e]))
  const count = entries.length
  const knownTotal = totalInSet ?? (allCards.length > count ? allCards.length : null)
  const total = knownTotal ?? '?'
  const percent = knownTotal ? Math.round((count / knownTotal) * 100) : 0
  const totalValue = entries.reduce((sum, e) => sum + (e.card?.market_price ?? 0) * e.quantity, 0)

  return (
    <section className="mb-2">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100"
      >
        <div className="text-left">
          <h2 className="font-bold text-slate-900">{setName}</h2>
          <p className="text-xs text-slate-400">{count}/{total} · {percent}%</p>
        </div>
        <div className="flex items-center gap-2">
          {totalValue > 0 && (
            <span className="text-sm font-semibold text-green-500">
              ${totalValue.toFixed(2)}
            </span>
          )}
          {expanded
            ? <ChevronUp size={16} className="text-slate-300" />
            : <ChevronDown size={16} className="text-slate-300" />
          }
        </div>
      </button>

      {expanded && (
        <>
          {knownTotal && <ProgressBar value={percent} className="mx-4 my-2" />}
          <div className="grid grid-cols-4 gap-1.5 px-4 mt-2 pb-3 md:grid-cols-6">
            {allCards.map(card => (
              <CardTile
                key={card.id}
                card={card}
                entry={ownedMap.get(card.id)}
                onTap={onCardTap}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
