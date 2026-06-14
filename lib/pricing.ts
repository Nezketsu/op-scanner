import type { PriceData } from '@/types'
import { createClient } from '@/lib/supabase/client'

const TCGAPI_BASE = 'https://api.tcgapi.dev/v1'
const TCGFAST_BASE = 'https://tcgfast.com/api/v1'
const CACHE_TTL_HOURS = 24

function isExpired(updatedAt: string): boolean {
  return Date.now() - new Date(updatedAt).getTime() > CACHE_TTL_HOURS * 3_600_000
}

async function getCachedPrice(cardId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('cards')
    .select('market_price, price_source, price_updated_at')
    .eq('id', cardId)
    .single()
  return data
}

async function updateCachedPrice(cardId: string, price: number, source: 'tcgapi' | 'tcgfast') {
  const supabase = createClient()
  await supabase.from('cards').upsert({
    id: cardId,
    market_price: price,
    price_source: source,
    price_updated_at: new Date().toISOString(),
  })
}

async function fetchFromTCGApiDev(cardId: string): Promise<number | null> {
  const res = await fetch(`${TCGAPI_BASE}/cards/${cardId}/price`, {
    headers: { 'X-API-Key': process.env.TCGAPI_DEV_KEY ?? '' },
  })
  if (res.status === 429) return null
  if (!res.ok) throw new Error(`TCGApi.dev error: ${res.status}`)
  const data = await res.json()
  return data?.data?.marketPrice ?? null
}

async function fetchFromTCGfast(cardId: string): Promise<number | null> {
  const res = await fetch(`${TCGFAST_BASE}/one-piece/price/${cardId}`)
  if (res.status === 429) return null
  if (!res.ok) throw new Error(`TCGfast error: ${res.status}`)
  const data = await res.json()
  return data?.price ?? null
}

export async function fetchPrice(cardId: string): Promise<PriceData | null> {
  const cached = await getCachedPrice(cardId)
  const now = new Date().toISOString()

  if (cached?.market_price && cached.price_updated_at && !isExpired(cached.price_updated_at)) {
    return {
      price: cached.market_price,
      source: (cached.price_source as PriceData['source']) ?? 'cache',
      updated_at: cached.price_updated_at,
    }
  }

  const tcgapiPrice = await fetchFromTCGApiDev(cardId)
  if (tcgapiPrice !== null) {
    await updateCachedPrice(cardId, tcgapiPrice, 'tcgapi')
    return { price: tcgapiPrice, source: 'tcgapi', updated_at: now }
  }

  const tcgfastPrice = await fetchFromTCGfast(cardId)
  if (tcgfastPrice !== null) {
    await updateCachedPrice(cardId, tcgfastPrice, 'tcgfast')
    return { price: tcgfastPrice, source: 'tcgfast', updated_at: now }
  }

  if (cached?.market_price) {
    return {
      price: cached.market_price,
      source: 'cache',
      stale: true,
      updated_at: cached.price_updated_at ?? now,
    }
  }

  return null
}
