'use client'
import { useEffect, useState } from 'react'
import { getSets, getSetCardCount, getSetCoverImage } from '@/lib/optcgapi'
import { useCollection } from '@/hooks/useCollection'
import { SetList } from '@/components/sets/SetList'
import type { Set } from '@/types'

export default function SetsPage() {
  const [sets, setSets] = useState<Set[]>([])
  const [loading, setLoading] = useState(true)
  const [setTotals, setSetTotals] = useState<Record<string, number>>({})
  const [coverImages, setCoverImages] = useState<Record<string, string>>({})
  const { entries, loadCollection } = useCollection()

  useEffect(() => {
    async function load() {
      const [fetchedSets] = await Promise.all([getSets(), loadCollection()])
      const sorted = fetchedSets.sort((a, b) =>
        (b.release_date ?? '').localeCompare(a.release_date ?? '')
      )
      setSets(sorted)
      setLoading(false)

      sorted.forEach(set => {
        getSetCardCount(set.id).then(count => {
          setSetTotals(prev => ({ ...prev, [set.id]: count }))
        })
        getSetCoverImage(set.id).then(url => {
          if (url) setCoverImages(prev => ({ ...prev, [set.id]: url }))
        })
      })
    }
    load()
  }, [])

  const collectionCounts = entries.reduce<Record<string, number>>((acc, entry) => {
    const setId = entry.card?.set_id ?? entry.card_id.split('-')[0]
    acc[setId] = (acc[setId] ?? 0) + 1
    return acc
  }, {})

  const enrichedSets = sets.map(s => ({
    ...s,
    total_cards: setTotals[s.id] ?? s.total_cards,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-900">Extensions</h1>
        <p className="text-sm text-slate-400">{sets.length} sets disponibles</p>
      </div>
      {loading ? (
        <div className="flex flex-col divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-white animate-pulse">
              <div className="w-11 h-11 bg-slate-200 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pb-24">
          <SetList sets={enrichedSets} collectionCounts={collectionCounts} coverImages={coverImages} />
        </div>
      )}
    </div>
  )
}
