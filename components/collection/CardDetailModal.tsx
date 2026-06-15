'use client'
import { useRef, useState } from 'react'
import type { CollectionEntry } from '@/types'

const RARITY_COLORS: Record<string, string> = {
  'Leader': 'bg-amber-100 text-amber-700',
  'Super Rare': 'bg-purple-100 text-purple-700',
  'Secret Rare': 'bg-red-100 text-red-600',
  'Rare': 'bg-blue-100 text-blue-700',
  'Uncommon': 'bg-slate-100 text-slate-600',
  'Common': 'bg-slate-100 text-slate-500',
}

interface CardDetailModalProps {
  entry: CollectionEntry
  onClose: () => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export function CardDetailModal({ entry, onClose, onUpdateQuantity, onRemove }: CardDetailModalProps) {
  const { card } = entry
  const rarityClass = card?.rarity ? (RARITY_COLORS[card.rarity] ?? 'bg-slate-100 text-slate-500') : ''
  const startY = useRef(0)
  const [dragY, setDragY] = useState(0)
  const dragging = useRef(false)

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    dragging.current = true
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return
    const delta = Math.max(0, e.touches[0].clientY - startY.current)
    setDragY(delta)
  }
  const onTouchEnd = () => {
    dragging.current = false
    if (dragY > 100) onClose()
    else setDragY(0)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl p-5 pb-8"
        style={{ transform: `translateY(${dragY}px)`, transition: dragY === 0 ? 'transform 0.25s ease' : 'none' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        <div className="flex gap-4 mb-5">
          {card?.image_url ? (
            <img src={card.image_url} alt={card.name} className="w-28 rounded-xl shadow-md shrink-0" />
          ) : (
            <div className="w-28 h-40 bg-slate-100 rounded-xl shrink-0" />
          )}
          <div className="flex-1 flex flex-col gap-1.5">
            <h2 className="font-bold text-lg text-slate-900 leading-tight">{card?.name ?? entry.card_id}</h2>
            <p className="text-sm text-slate-400">{entry.card_id}</p>
            {card?.rarity && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit ${rarityClass}`}>
                {card.rarity}
              </span>
            )}
            {card?.market_price ? (
              <div className="mt-2">
                <p className="text-2xl font-bold text-green-500">${card.market_price.toFixed(2)}</p>
                <p className="text-xs text-slate-400">
                  {card.price_source ? `via ${card.price_source}` : 'prix estimé'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mt-2">Prix indisponible</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 mb-4">
          <span className="text-sm font-semibold text-slate-700">Quantité</span>
          <div className="flex items-center gap-5">
            <button
              onClick={() => onUpdateQuantity(entry.id, entry.quantity - 1)}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 active:bg-slate-100"
            >−</button>
            <span className="text-xl font-bold w-6 text-center text-slate-900">{entry.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(entry.id, entry.quantity + 1)}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 active:bg-slate-100"
            >+</button>
          </div>
        </div>

        <button
          onClick={() => { onRemove(entry.id); onClose() }}
          className="w-full py-3 text-red-500 text-sm font-semibold rounded-xl border border-red-100 bg-red-50 active:bg-red-100"
        >
          Retirer de la collection
        </button>
      </div>
    </div>
  )
}
