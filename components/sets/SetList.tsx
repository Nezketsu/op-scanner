import Link from 'next/link'
import type { Set } from '@/types'

const PREFIX_COLOR: Record<string, string> = {
  OP: 'bg-indigo-600',
  EB: 'bg-emerald-600',
  ST: 'bg-amber-500',
}

interface SetListProps {
  sets: Set[]
  collectionCounts: Record<string, number>
  coverImages: Record<string, string>
}

export function SetList({ sets, collectionCounts, coverImages }: SetListProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pt-4">
      {sets.map(set => {
        const count = collectionCounts[set.id] ?? 0
        const total = set.total_cards ?? 0
        const percent = total ? Math.round((count / total) * 100) : 0
        const prefix = set.id.replace(/\d+$/, '')
        const badge = PREFIX_COLOR[prefix] ?? 'bg-slate-700'
        const cover = coverImages[set.id] ?? set.logo_url

        return (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className="relative rounded-2xl overflow-hidden aspect-3/4 block active:scale-95 transition-transform"
          >
            {cover ? (
              <img
                src={cover}
                alt={set.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                <span className="text-indigo-300 font-black text-3xl">{set.id}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/10" />

            <div className={`absolute top-2.5 left-2.5 ${badge} px-2 py-0.5 rounded-md`}>
              <span className="text-white text-[11px] font-bold tracking-wide">{set.id}</span>
            </div>

            {percent > 0 && (
              <div className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                <span className="text-white text-[11px] font-semibold">{percent}%</span>
              </div>
            )}

            <div className="absolute bottom-0 inset-x-0 p-3">
              <p className="text-white font-bold text-sm leading-tight mb-2">{set.name}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-white/60 text-[10px] shrink-0">{count}/{total || '?'}</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
