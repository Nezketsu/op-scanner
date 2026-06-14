import type { CollectionEntry } from '@/types'

interface CardDetailModalProps {
  entry: CollectionEntry
  onClose: () => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export function CardDetailModal({ entry, onClose, onUpdateQuantity, onRemove }: CardDetailModalProps) {
  const { card } = entry

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <div className="flex gap-4 mb-5">
          {card?.image_url ? (
            <img src={card.image_url} alt={card.name} className="w-24 rounded-xl shadow" />
          ) : (
            <div className="w-24 h-32 bg-gray-100 rounded-xl" />
          )}
          <div className="flex-1">
            <h2 className="font-bold text-lg">{card?.name ?? entry.card_id}</h2>
            <p className="text-sm text-gray-500">{entry.card_id}</p>
            {card?.rarity && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">{card.rarity}</span>
            )}
            {card?.market_price && (
              <p className="text-xl font-bold text-green-600 mt-2">
                ${card.market_price.toFixed(2)}
                {card.price_source && <span className="text-xs text-gray-400 font-normal ml-1">({card.price_source})</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
          <span className="text-sm font-medium text-gray-700">Quantité</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onUpdateQuantity(entry.id, entry.quantity - 1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-xl font-bold"
            >-</button>
            <span className="text-xl font-bold w-6 text-center">{entry.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(entry.id, entry.quantity + 1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-xl font-bold"
            >+</button>
          </div>
        </div>

        <button
          onClick={() => { onRemove(entry.id); onClose() }}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium"
        >
          Retirer de la collection
        </button>
      </div>
    </div>
  )
}
