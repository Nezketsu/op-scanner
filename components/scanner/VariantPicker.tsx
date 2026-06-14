import type { Card } from '@/types'

interface VariantPickerProps {
  cards: Card[]
  onSelect: (card: Card) => void
}

export function VariantPicker({ cards, onSelect }: VariantPickerProps) {
  return (
    <div>
      <p className="text-center text-sm text-gray-500 mb-4">
        Quelle version de la carte possèdes-tu ?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onSelect(card)}
            className="flex flex-col items-center gap-2 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors"
          >
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} className="w-full rounded-lg object-contain max-h-40" />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                Pas d'image
              </div>
            )}
            <span className="text-xs text-center font-medium">{card.name}</span>
            {card.rarity && <span className="text-xs text-gray-500">{card.rarity}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
