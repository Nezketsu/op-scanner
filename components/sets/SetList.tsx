import Link from 'next/link'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Set } from '@/types'

interface SetListProps {
  sets: Set[]
  collectionCounts: Record<string, number>
}

export function SetList({ sets, collectionCounts }: SetListProps) {
  return (
    <div className="divide-y divide-gray-100">
      {sets.map(set => {
        const count = collectionCounts[set.id] ?? 0
        const total = set.total_cards ?? 0
        const percent = total ? Math.round((count / total) * 100) : 0

        return (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            {set.logo_url ? (
              <img src={set.logo_url} alt={set.name} className="w-12 h-12 object-contain rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                {set.id}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{set.name}</p>
              <p className="text-xs text-gray-500 mb-1">{count}/{total || '?'} · {percent}%</p>
              <ProgressBar value={percent} />
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        )
      })}
    </div>
  )
}
