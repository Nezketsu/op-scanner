import type { Card } from '@/types'

interface VariantPickerProps {
  cards: Card[]
  onSelect: (card: Card) => void
}

export function VariantPicker({ cards, onSelect }: VariantPickerProps) {
  return (
    <div>
      <p className="text-center text-sm text-slate-500 mb-4 font-medium">
        Quelle version de la carte possèdes-tu ?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onSelect(card)}
            className="flex flex-col items-center gap-2 p-3 border-2 border-slate-200 rounded-xl hover:border-indigo-500 active:border-indigo-500 transition-colors"
          >
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className="w-full rounded-lg object-contain max-h-40"
              />
            ) : (
              <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                Pas d'image
              </div>
            )}
            <span className="text-xs text-center font-semibold text-slate-700">{card.name}</span>
            {card.rarity && (
              <span className="text-xs text-slate-400">{card.rarity}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
