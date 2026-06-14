'use client'
import { useState } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CardTile } from './CardTile'
import type { CollectionEntry } from '@/types'

interface SetSectionProps {
  setId: string
  setName: string
  totalCards: number | null
  entries: CollectionEntry[]
  onCardTap: (entry: CollectionEntry) => void
}

export function SetSection({ setId, setName, totalCards, entries, onCardTap }: SetSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const count = entries.length
  const total = totalCards ?? '?'
  const percent = totalCards ? Math.round((count / totalCards) * 100) : 0

  return (
    <section className="mb-6">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100"
      >
        <div className="text-left">
          <h2 className="font-semibold text-gray-900">{setName}</h2>
          <p className="text-xs text-gray-500">{count}/{total} · {percent}%</p>
        </div>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <>
          <ProgressBar value={percent} className="mx-4 my-2" />
          <div className="grid grid-cols-3 gap-2 px-4 mt-3 md:grid-cols-5">
            {entries.map(entry => (
              <CardTile key={entry.id} entry={entry} onTap={onCardTap} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
