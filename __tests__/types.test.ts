import type { Card, Set, CollectionEntry, PriceData, Variant, ScanResult } from '@/types'

describe('types', () => {
  it('Card shape is assignable', () => {
    const card: Card = {
      id: 'OP01-001',
      set_id: 'OP01',
      card_number: 1,
      name: 'Monkey D. Luffy',
      image_url: 'https://example.com/img.jpg',
      rarity: 'L',
      variants: null,
      market_price: 12.5,
      price_source: 'tcgapi',
      price_updated_at: '2026-06-14T00:00:00Z',
    }
    expect(card.id).toBe('OP01-001')
  })

  it('CollectionEntry has optional card join', () => {
    const entry: CollectionEntry = {
      id: 'uuid-1',
      user_id: 'user-uuid',
      card_id: 'OP01-001',
      variant_id: null,
      quantity: 1,
      added_at: '2026-06-14T00:00:00Z',
    }
    expect(entry.card).toBeUndefined()
  })
})
