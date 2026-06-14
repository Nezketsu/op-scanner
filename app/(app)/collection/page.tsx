'use client'
import { useEffect, useState } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { SetSection } from '@/components/collection/SetSection'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import type { CollectionEntry } from '@/types'

export default function CollectionPage() {
  const { entries, loading, loadCollection, updateQuantity, removeCard } = useCollection()
  const [selectedEntry, setSelectedEntry] = useState<CollectionEntry | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { loadCollection() }, [loadCollection])

  const filtered = search
    ? entries.filter(e =>
        e.card?.name.toLowerCase().includes(search.toLowerCase()) ||
        e.card_id.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  const bySet = filtered.reduce<Record<string, CollectionEntry[]>>((acc, entry) => {
    const setId = entry.card?.set_id ?? entry.card_id.split('-')[0]
    if (!acc[setId]) acc[setId] = []
    acc[setId].push(entry)
    return acc
  }, {})

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
  }

  return (
    <div>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <h1 className="text-xl font-bold mb-2">Ma collection</h1>
        <input
          type="search"
          placeholder="Rechercher une carte..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {Object.entries(bySet).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>Ta collection est vide</p>
          <p className="text-sm mt-1">Scanne ta première carte !</p>
        </div>
      ) : (
        Object.entries(bySet).map(([setId, setEntries]) => (
          <SetSection
            key={setId}
            setId={setId}
            setName={setEntries[0]?.card?.set_id ?? setId}
            totalCards={null}
            entries={setEntries}
            onCardTap={setSelectedEntry}
          />
        ))
      )}

      {selectedEntry && (
        <CardDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeCard}
        />
      )}
    </div>
  )
}
