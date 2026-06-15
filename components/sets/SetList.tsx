import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Set } from '@/types'

interface SetListProps {
  sets: Set[]
  collectionCounts: Record<string, number>
}

export function SetList({ sets, collectionCounts }: SetListProps) {
  return (
    <div className="divide-y divide-slate-100">
      {sets.map(set => {
        const count = collectionCounts[set.id] ?? 0
        const total = set.total_cards ?? 0
        const percent = total ? Math.round((count / total) * 100) : 0

        return (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors active:bg-slate-100"
          >
            {set.logo_url ? (
              <img src={set.logo_url} alt={set.name} className="w-11 h-11 object-contain rounded-lg shrink-0" />
            ) : (
              <div className="w-11 h-11 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 font-bold text-xs shrink-0">
                {set.id}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate text-sm">{set.name}</p>
              <p className="text-xs text-slate-400 mb-1.5">{count}/{total || '?'} · {percent}%</p>
              <ProgressBar value={percent} />
            </div>
            <ChevronRight size={16} className="text-slate-300 shrink-0" strokeWidth={2} />
          </Link>
        )
      })}
    </div>
  )
}
