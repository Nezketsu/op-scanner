'use client'
import { useEffect, useState } from 'react'
import { getSets } from '@/lib/tcgdex'
import { useCollection } from '@/hooks/useCollection'
import { SetList } from '@/components/sets/SetList'
import type { Set } from '@/types'

export default function SetsPage() {
  const [sets, setSets] = useState<Set[]>([])
  const [loading, setLoading] = useState(true)
  const { entries, loadCollection } = useCollection()

  useEffect(() => {
    async function load() {
      const [fetchedSets] = await Promise.all([getSets(), loadCollection()])
      setSets(fetchedSets.sort((a, b) =>
        (b.release_date ?? '').localeCompare(a.release_date ?? '')
      ))
      setLoading(false)
    }
    load()
  }, [])

  const collectionCounts = entries.reduce<Record<string, number>>((acc, entry) => {
    const setId = entry.card?.set_id ?? entry.card_id.split('-')[0]
    acc[setId] = (acc[setId] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold">Extensions</h1>
        <p className="text-sm text-gray-500">{sets.length} sets disponibles</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
      ) : (
        <SetList sets={sets} collectionCounts={collectionCounts} />
      )}
    </div>
  )
}
