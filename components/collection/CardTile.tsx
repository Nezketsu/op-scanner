import type { CollectionEntry, Card } from '@/types'

interface CardTileProps {
  card: Card
  entry?: CollectionEntry
  onTap: (entry: CollectionEntry) => void
}

export function CardTile({ card, entry, onTap }: CardTileProps) {
  const owned = !!entry

  return (
    <button
      onClick={() => entry && onTap(entry)}
      disabled={!owned}
      className={`relative aspect-2/3 rounded-xl overflow-hidden transition-all active:scale-95 ${
        owned
          ? 'border border-slate-200 hover:border-indigo-400 cursor-pointer bg-slate-100'
          : 'border border-dashed border-slate-200 cursor-default bg-slate-50'
      }`}
    >
      {card.image_url ? (
        <img
          src={card.image_url}
          alt={card.name}
          className={`w-full h-full object-cover ${!owned ? 'opacity-0' : ''}`}
          loading="lazy"
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center text-xs p-2 text-center ${
          owned ? 'text-slate-400' : 'text-slate-200'
        }`}>
          {owned ? (card.name ?? card.id) : '—'}
        </div>
      )}
      {owned && entry!.quantity > 1 && (
        <span className="absolute top-1 right-1 bg-indigo-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {entry!.quantity}
        </span>
      )}
    </button>
  )
}
