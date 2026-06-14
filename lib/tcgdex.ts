import type { Card, Set as CardSet } from '@/types'

const BASE_URL = 'https://api.tcgdex.net/v2/en'

interface TCGDexCard {
  id: string
  localId: string
  name: string
  image?: string
  rarity?: string
  variants?: { id: string; name: string; image?: string }[]
}

interface TCGDexSet {
  id: string
  name: string
  releaseDate?: string
  cardCount?: { total: number }
  logo?: string
}

function mapCard(setId: string) {
  return (c: TCGDexCard): Card => ({
    id: c.id,
    set_id: setId,
    card_number: parseInt(c.localId, 10) || null,
    name: c.name,
    image_url: c.image ? `${c.image}/high.jpg` : null,
    rarity: c.rarity ?? null,
    variants: c.variants?.map(v => ({
      id: v.id,
      name: v.name,
      image_url: v.image ? `${v.image}/high.jpg` : '',
    })) ?? null,
    market_price: null,
    price_source: null,
    price_updated_at: null,
  })
}

export async function getCardsByNumber(setId: string, cardNumber: string): Promise<Card[]> {
  try {
    const res = await fetch(`${BASE_URL}/sets/${setId}/cards?localId=${cardNumber}`)
    if (!res.ok) return []
    const data: TCGDexCard[] = await res.json()
    return data.map(mapCard(setId))
  } catch {
    return []
  }
}

export async function getCardById(cardId: string): Promise<Card | null> {
  const [setId, localId] = cardId.split('-')
  try {
    const res = await fetch(`${BASE_URL}/sets/${setId}/${localId}`)
    if (!res.ok) return null
    const data: TCGDexCard = await res.json()
    return mapCard(setId)(data)
  } catch {
    return null
  }
}

// In-memory cache so we don't refetch on every scan
let knownSetIds: Set<string> | null = null

export async function getKnownSetIds(): Promise<Set<string>> {
  if (knownSetIds) return knownSetIds
  try {
    const res = await fetch(`${BASE_URL}/sets`)
    if (!res.ok) return new Set()
    const data: TCGDexSet[] = await res.json()
    knownSetIds = new Set(
      data
        .filter(s => s.id.startsWith('OP') || s.id.startsWith('ST') || s.id.startsWith('EB'))
        .map(s => s.id)
    )
    return knownSetIds
  } catch {
    return new Set()
  }
}

export async function validateCardCode(cardCode: string): Promise<boolean> {
  const parts = cardCode.split('-')
  if (parts.length !== 2) return false
  const setId = parts[0]
  const ids = await getKnownSetIds()
  return ids.has(setId)
}

export async function getSets(): Promise<CardSet[]> {
  try {
    const res = await fetch(`${BASE_URL}/sets`)
    if (!res.ok) return []
    const data: TCGDexSet[] = await res.json()
    return data
      .filter(s => s.id.startsWith('OP') || s.id.startsWith('ST') || s.id.startsWith('EB'))
      .map(s => ({
        id: s.id,
        name: s.name,
        release_date: s.releaseDate ?? null,
        total_cards: s.cardCount?.total ?? null,
        logo_url: s.logo ?? null,
      }))
  } catch {
    return []
  }
}
