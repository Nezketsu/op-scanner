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
    const result = await addCard(selectedCard.id, null)
    setAdding(false)
    if (result?.error) {
      setError("Impossible d'ajouter cette carte à la collection")
      return
    }
    onClose()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 pb-24 max-h-[85vh] overflow-y-auto shadow-2xl z-[60]">
      <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

      {loading && <p className="text-center text-gray-500">Chargement...</p>}

      {error && <p className="mb-3 text-sm text-red-600 text-center">{error}</p>}

      {!loading && cards.length === 0 && (
        <div className="text-center">
          <p className="text-gray-600 mb-2">Carte introuvable pour {cardNumber}</p>
          <button onClick={onClose} className="text-sm text-blue-600 underline">Fermer</button>
        </div>
      )}

      {!loading && cards.length > 1 && !selectedCard && (
        <VariantPicker cards={cards} onSelect={setSelectedCard} />
      )}

      {selectedCard && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            {selectedCard.image_url ? (
              <img src={selectedCard.image_url} alt={selectedCard.name} className="w-28 rounded-xl shadow" />
            ) : (
              <div className="w-28 h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center p-2">
                Pas d'image
              </div>
            )}
            <div className="flex flex-col gap-1 flex-1">
              <h2 className="font-bold text-lg leading-tight">{selectedCard.name}</h2>
              <p className="text-sm text-gray-500">{selectedCard.set_id} — {cardNumber}</p>
              {selectedCard.rarity && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full w-fit">
                  {selectedCard.rarity}
                </span>
              )}
              {selectedCard.market_price ? (
                <div className="mt-2">
                  <p className="text-2xl font-bold text-green-600">${selectedCard.market_price.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">TCGPlayer market price</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-2">Prix indisponible</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium">
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {adding ? 'Ajout...' : 'Ajouter à ma collection'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
