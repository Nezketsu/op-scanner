import type { CollectionEntry } from '@/types'

export type SortKey = 'number' | 'name' | 'rarity' | 'value'

const RARITY_ORDER = ['Leader', 'Secret Rare', 'Super Rare', 'Rare', 'Uncommon', 'Common']

export function filterEntries(entries: CollectionEntry[], rarity: string | null): CollectionEntry[] {
  if (!rarity) return entries
  return entries.filter(e => e.card?.rarity === rarity)
}

export function sortEntries(entries: CollectionEntry[], sort: SortKey): CollectionEntry[] {
  return [...entries].sort((a, b) => {
    switch (sort) {
      case 'number': {
        const na = a.card?.card_number ?? Infinity
        const nb = b.card?.card_number ?? Infinity
        return na - nb
      }
      case 'name':
        return (a.card?.name ?? '').localeCompare(b.card?.name ?? '')
      case 'rarity': {
        const ra = RARITY_ORDER.indexOf(a.card?.rarity ?? '')
        const rb = RARITY_ORDER.indexOf(b.card?.rarity ?? '')
        return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb)
      }
      case 'value': {
        const va = (a.card?.market_price ?? 0) * a.quantity
        const vb = (b.card?.market_price ?? 0) * b.quantity
        return vb - va
      }
    }
  })
}

export function getRarities(entries: CollectionEntry[]): string[] {
  const seen = new Set<string>()
  for (const e of entries) {
    if (e.card?.rarity) seen.add(e.card.rarity)
  }
  return RARITY_ORDER.filter(r => seen.has(r))
}
