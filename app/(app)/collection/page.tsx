'use client'
import { useEffect, useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { SetSection } from '@/components/collection/SetSection'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import { filterEntries, sortEntries, getRarities } from '@/lib/collection-filters'
import type { CollectionEntry } from '@/types'
import type { SortKey } from '@/lib/collection-filters'

const SORT_LABELS: Record<SortKey, string> = {
  number: 'Numéro',
  name: 'Nom',
  rarity: 'Rareté',
  value: 'Valeur',
}

export default function CollectionPage() {
  const { entries, loading, loadCollection, updateQuantity, removeCard } = useCollection()
  const [selectedEntry, setSelectedEntry] = useState<CollectionEntry | null>(null)
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('number')

  useEffect(() => { loadCollection() }, [loadCollection])

  const bySet = useMemo(() => {
    return entries.reduce<Record<string, CollectionEntry[]>>((acc, entry) => {
      const setId = entry.card?.set_id ?? entry.card_id.split('-')[0]
      if (!acc[setId]) acc[setId] = []
      acc[setId].push(entry)
      return acc
    }, {})
  }, [entries])

  const rarities = useMemo(() => getRarities(entries), [entries])

  const filteredBySet = useMemo(() => {
    const result: Record<string, CollectionEntry[]> = {}
    for (const [setId, setEntries] of Object.entries(bySet)) {
      let items = filterEntries(setEntries, rarityFilter)
      if (search) {
        items = items.filter(e =>
          e.card?.name.toLowerCase().includes(search.toLowerCase()) ||
          e.card_id.toLowerCase().includes(search.toLowerCase())
        )
      }
      items = sortEntries(items, sort)
      if (items.length) result[setId] = items
    }
    return result
  }, [bySet, rarityFilter, search, sort])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 bg-white border-b border-slate-100 z-10">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-lg font-bold text-slate-900 mb-3">Ma collection</h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2} />
              <input
                type="search"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" strokeWidth={2} />
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                  <option key={k} value={k}>{SORT_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>

          {rarities.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setRarityFilter(null)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  rarityFilter === null
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                Tout
              </button>
              {rarities.map(r => (
                <button
                  key={r}
                  onClick={() => setRarityFilter(f => f === r ? null : r)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    rarityFilter === r
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="px-4 pt-4 flex flex-col gap-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-14 bg-white rounded-t-xl border border-slate-100" />
              <div className="grid grid-cols-4 gap-1.5 p-4 bg-white border border-t-0 border-slate-100 rounded-b-xl">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="aspect-2/3 bg-slate-200 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(filteredBySet).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <p className="text-3xl mb-3">📭</p>
          <p className="font-medium text-slate-500">
            {entries.length === 0 ? 'Ta collection est vide' : 'Aucun résultat'}
          </p>
          <p className="text-sm mt-1">
            {entries.length === 0 ? 'Scanne ta première carte !' : 'Essaie un autre filtre'}
          </p>
        </div>
      ) : (
        <div className="pb-24">
          {Object.entries(filteredBySet).map(([setId, setEntries]) => {
            const seen = new Set<string>()
            const ownedCards = setEntries
              .map(e => e.card)
              .filter((c): c is NonNullable<CollectionEntry['card']> => !!c && !seen.has(c.id) && !!seen.add(c.id))
            return (
              <SetSection
                key={setId}
                setId={setId}
                setName={setEntries[0]?.card?.set_id ?? setId}
                allCards={ownedCards}
                entries={setEntries}
                onCardTap={setSelectedEntry}
              />
            )
          })}
        </div>
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
