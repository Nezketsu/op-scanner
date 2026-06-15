'use client'
import { useEffect, useState } from 'react'
import { getCardsByNumber } from '@/lib/optcgapi'
import { useCollection } from '@/hooks/useCollection'
import { VariantPicker } from './VariantPicker'
import type { Card } from '@/types'

interface CardConfirmModalProps {
  cardNumber: string
  onClose: () => void
}

const RARITY_COLORS: Record<string, string> = {
  'Leader': 'bg-amber-100 text-amber-700',
  'Super Rare': 'bg-purple-100 text-purple-700',
  'Secret Rare': 'bg-red-100 text-red-600',
  'Rare': 'bg-blue-100 text-blue-700',
  'Uncommon': 'bg-slate-100 text-slate-600',
  'Common': 'bg-slate-100 text-slate-500',
}

export function CardConfirmModal({ cardNumber, onClose }: CardConfirmModalProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addCard } = useCollection()

  const [setId, cardNum] = cardNumber.split('-')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = await getCardsByNumber(setId, cardNum)
      setCards(results)
      if (results.length === 1) setSelectedCard(results[0])
      setLoading(false)
    }
    load()
  }, [cardNumber])

  const handleAdd = async () => {
    if (!selectedCard) return
    setAdding(true)
    setError(null)
    const result = await addCard(selectedCard, null)
    setAdding(false)
    if (result?.error) {
      setError("Impossible d'ajouter la carte. Réessaie.")
      return
    }
    onClose()
  }

  const rarityClass = selectedCard?.rarity
    ? (RARITY_COLORS[selectedCard.rarity] ?? 'bg-slate-100 text-slate-500')
    : ''

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 pb-24 max-h-[85vh] overflow-y-auto shadow-2xl z-60">
      <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="flex gap-4">
            <div className="w-28 h-40 bg-slate-200 rounded-xl" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-6 bg-slate-200 rounded w-1/3 mt-4" />
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-500 text-center font-medium">{error}</p>
      )}

      {!loading && cards.length === 0 && (
        <div className="text-center py-4">
          <p className="text-slate-600 mb-3 font-medium">Carte introuvable pour {cardNumber}</p>
          <button onClick={onClose} className="text-sm text-indigo-500 font-semibold">
            Fermer
          </button>
        </div>
      )}

      {!loading && cards.length > 1 && !selectedCard && (
        <VariantPicker cards={cards} onSelect={setSelectedCard} />
      )}

      {selectedCard && (
        <div className="flex flex-col gap-5">
          <div className="flex gap-4">
            {selectedCard.image_url ? (
              <img
                src={selectedCard.image_url}
                alt={selectedCard.name}
                className="w-28 rounded-xl shadow-md"
              />
            ) : (
              <div className="w-28 h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-2">
                Pas d'image
              </div>
            )}
            <div className="flex flex-col gap-1.5 flex-1">
              <h2 className="font-bold text-lg text-slate-900 leading-tight">
                {selectedCard.name}
              </h2>
              <p className="text-sm text-slate-400">
                {selectedCard.set_id} · {cardNumber}
              </p>
              {selectedCard.rarity && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit ${rarityClass}`}>
                  {selectedCard.rarity}
                </span>
              )}
              <div className="mt-2">
                {selectedCard.market_price ? (
                  <>
                    <p className="text-2xl font-bold text-green-500">
                      ${selectedCard.market_price.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">TCGPlayer market price</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Prix indisponible</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {adding ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
