export interface Set {
  id: string
  name: string
  release_date: string | null
  total_cards: number | null
  logo_url: string | null
}

export interface Variant {
  id: string
  name: string
  image_url: string
}

export interface Card {
  id: string
  set_id: string
  card_number: number | null
  name: string
  image_url: string | null
  rarity: string | null
  variants: Variant[] | null
  market_price: number | null
  price_source: 'tcgapi' | 'tcgfast' | 'cache' | null
  price_updated_at: string | null
}

export interface CollectionEntry {
  id: string
  user_id: string
  card_id: string
  variant_id: string | null
  quantity: number
  added_at: string
  card?: Card
}

export interface PriceData {
  price: number
  source: 'tcgapi' | 'tcgfast' | 'cache'
  stale?: boolean
  updated_at: string
}

export interface ScanResult {
  cardNumber: string
  confidence: number
}
