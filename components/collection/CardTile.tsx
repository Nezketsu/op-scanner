import type { CollectionEntry } from '@/types'

interface CardTileProps {
  entry: CollectionEntry
  onTap: (entry: CollectionEntry) => void
}

export function CardTile({ entry, onTap }: CardTileProps) {
  return (
    <button
      onClick={() => onTap(entry)}
      className="relative aspect-[2/3] rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-gray-100"
    >
      {entry.card?.image_url ? (
        <img src={entry.card.image_url} alt={entry.card.name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center">
          {entry.card?.name ?? entry.card_id}
        </div>
      )}
      {entry.quantity > 1 && (
        <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {entry.quantity}
        </span>
      )}
    </button>
  )
}
