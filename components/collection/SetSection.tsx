'use client'
import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { CardTile } from './CardTile'
import type { CollectionEntry, Card } from '@/types'

const PREFIX_ACCENT: Record<string, string> = {
  OP: 'bg-indigo-500',
  EB: 'bg-emerald-500',
  ST: 'bg-amber-500',
  PRB: 'bg-rose-500',
}

interface SetSectionProps {
  setId: string
  setName: string
  allCards: Card[]
  entries: CollectionEntry[]
  onCardTap: (entry: CollectionEntry) => void
  totalInSet?: number
}

export function SetSection({ setId, setName, allCards, entries, onCardTap, totalInSet }: SetSectionProps) {
  const [expanded, setExpanded] = useState(true)

  const ownedMap = new Map(entries.map(e => [e.card_id, e]))
  const count = entries.length
  const knownTotal = totalInSet ?? (allCards.length > count ? allCards.length : null)
  const total = knownTotal ?? '?'
  const percent = knownTotal ? Math.round((count / knownTotal) * 100) : 0
  const totalValue = entries.reduce((sum, e) => sum + (e.card?.market_price ?? 0) * e.quantity, 0)

  const prefix = setId.replace(/\d.*$/, '')
  const accent = PREFIX_ACCENT[prefix] ?? 'bg-slate-500'
  const coverImage = allCards[0]?.image_url

  return (
    <section className="mb-3 mx-4 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-3 active:scale-[0.98] transition-transform duration-150"
      >
        {coverImage ? (
          <img src={coverImage} alt="" className="w-10 h-14 object-cover rounded-lg shrink-0" />
        ) : (
          <div className={`w-10 h-14 ${accent} rounded-lg shrink-0 flex items-center justify-center`}>
            <span className="text-white text-[9px] font-bold text-center px-0.5">{setId}</span>
          </div>
        )}

        <div className="flex-1 text-left min-w-0">
          <span className={`inline-block text-[10px] font-bold text-white ${accent} px-1.5 py-0.5 rounded-md mb-1`}>
            {setId}
          </span>
          <h2 className="font-bold text-slate-900 text-sm leading-tight truncate">{setName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{count}/{total} · {percent}%</p>
          {knownTotal && (
            <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${accent} rounded-full transition-all`} style={{ width: `${percent}%` }} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 pl-2">
          {totalValue > 0 && (
            <span className="text-sm font-bold text-emerald-500">${totalValue.toFixed(2)}</span>
          )}
          {expanded
            ? <ChevronUp size={14} className="text-slate-300" />
            : <ChevronDown size={14} className="text-slate-300" />
          }
        </div>
      </button>

      {expanded && (
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
          {allCards.map((card, i) => (
            <div
              key={card.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 25, 400)}ms` }}
            >
              <CardTile
                card={card}
                entry={ownedMap.get(card.id)}
                onTap={onCardTap}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
