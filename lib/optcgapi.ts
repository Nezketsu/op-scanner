import type { Card, Set, PriceData } from '@/types'

const BASE_URL = 'https://optcgapi.com/api'

interface OptcgCard {
  card_set_id: string       // "OP01-001"
  card_name: string
  set_name: string
  set_id: string            // "OP-01"
  card_image: string        // full URL
  card_image_id: string     // "OP01-001" or "OP01-001_p1"
  rarity: string
  card_type: string
  card_color: string
  card_text: string
  card_cost: string | null
  card_power: string | null
  life: string | null
  counter_amount: number | null
  attribute: string | null
  sub_types: string | null
  market_price: number
  inventory_price: number
  date_scraped: string
}

// "OP-01" → "OP01"
function normalizeSetId(id: string): string {
  return id.replace('-', '')
}

// "OP01" → "OP-01", "OP15EB04" → "OP15-EB04"
function toApiSetId(id: string): string {
  return id
    .replace(/^([A-Z]+\d+)([A-Z]+\d+)$/, '$1-$2')
    .replace(/^([A-Z]+)(\d+)$/, '$1-$2')
}

function mapEntry(e: OptcgCard): Card {
  return {
    id: e.card_image_id,
    set_id: normalizeSetId(e.set_id),
    card_number: parseInt(e.card_set_id.split('-')[1], 10) || null,
    name: e.card_name,
    image_url: e.card_image,
    rarity: e.rarity ?? null,
    variants: null,
    market_price: e.market_price ?? null,
    price_source: e.market_price ? 'tcgapi' : null,
    price_updated_at: e.date_scraped ?? null,
  }
}

function groupIntoCard(entries: OptcgCard[]): Card {
  const base = entries[0]
  return {
    id: base.card_set_id,
    set_id: normalizeSetId(base.set_id),
    card_number: parseInt(base.card_set_id.split('-')[1], 10) || null,
    name: base.card_name,
    image_url: base.card_image,
    rarity: base.rarity ?? null,
    variants: null,
    market_price: base.market_price ?? null,
    price_source: base.market_price ? 'tcgapi' : null,
    price_updated_at: base.date_scraped ?? null,
  }
}

export async function getCardsByNumber(setId: string, cardNumber: string): Promise<Card[]> {
  const paddedNum = cardNumber.padStart(3, '0')
  const cardId = `${setId}-${paddedNum}`
  try {
    const res = await fetch(`${BASE_URL}/sets/card/${cardId}/`)
    if (!res.ok) return []
    const data: OptcgCard[] = await res.json()
    if (!data.length) return []
    // Une carte par variante → VariantPicker si plusieurs
    return data.map(mapEntry)
  } catch {
    return []
  }
}

export async function getCardById(cardId: string): Promise<Card | null> {
  try {
    const res = await fetch(`${BASE_URL}/sets/card/${cardId}/`)
    if (!res.ok) return null
    const data: OptcgCard[] = await res.json()
    if (!data.length) return null
    return groupIntoCard(data)
  } catch {
    return null
  }
}

let setsCache: Set[] | null = null

export async function getSets(): Promise<Set[]> {
  if (setsCache) return setsCache
  try {
    const res = await fetch(`${BASE_URL}/allSets/`)
    if (!res.ok) return []
    const data: { set_name: string; set_id: string }[] = await res.json()
    setsCache = data.map(s => ({
      id: normalizeSetId(s.set_id),
      name: s.set_name,
      release_date: null,
      total_cards: null,
      logo_url: null,
    }))
    return setsCache
  } catch {
    return []
  }
}

const setCardsCache = new Map<string, Card[]>()

export async function getCardsBySet(setId: string): Promise<Card[]> {
  if (setCardsCache.has(setId)) return setCardsCache.get(setId)!
  const apiId = toApiSetId(setId)
  try {
    const res = await fetch(`${BASE_URL}/sets/filtered/?set_id=${apiId}`)
    if (!res.ok) return []
    const data: OptcgCard[] = await res.json()
    // Déduplique par card_image_id (l'API peut retourner des doublons)
    const seen = new Set<string>()
    const cards = data.filter(e => !seen.has(e.card_image_id) && !!seen.add(e.card_image_id)).map(mapEntry)
    setCardsCache.set(setId, cards)
    return cards
  } catch {
    return []
  }
}

export async function getSetCardCount(setId: string): Promise<number> {
  const cards = await getCardsBySet(setId)
  return cards.length
}

export async function getSetCoverImage(setId: string): Promise<string | null> {
  const cards = await getCardsBySet(setId)
  const own = cards
    .filter(c => c.set_id === setId)
    .sort((a, b) => (a.card_number ?? 999) - (b.card_number ?? 999))
  return own[0]?.image_url ?? null
}

export async function fetchPriceFromApi(cardId: string): Promise<PriceData | null> {
  try {
    const res = await fetch(`${BASE_URL}/sets/card/${cardId}/`)
    if (!res.ok) return null
    const data: OptcgCard[] = await res.json()
    if (!data.length || !data[0].market_price) return null
    return {
      price: data[0].market_price,
      source: 'tcgapi',
      updated_at: data[0].date_scraped,
    }
  } catch {
    return null
  }
}

// For validation: check if a set ID exists
let knownSetIds: globalThis.Set<string> | null = null

export async function getKnownSetIds(): Promise<globalThis.Set<string>> {
  if (knownSetIds) return knownSetIds
  const sets = await getSets()
  knownSetIds = new globalThis.Set(sets.map(s => s.id))
  return knownSetIds
}

export async function validateCardCode(cardCode: string): Promise<boolean> {
  const parts = cardCode.split('-')
  if (parts.length !== 2) return false
  const ids = await getKnownSetIds()
  return ids.has(parts[0])
}
