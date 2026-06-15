import type { Card } from '@/types'

interface VariantPickerProps {
  cards: Card[]
  onSelect: (card: Card) => void
}

function variantLabel(card: Card): string {
  if (card.id.includes('_p')) return 'Alternate Art'
  return 'Normal'
}

export function VariantPicker({ cards, onSelect }: VariantPickerProps) {
  return (
    <div>
      <p className="text-center text-sm text-slate-500 mb-4 font-medium">
        Quelle version possèdes-tu ?
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
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-slate-800">{variantLabel(card)}</span>
              {card.market_price && (
                <span className="text-xs font-semibold text-green-500">${card.market_price.toFixed(2)}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
