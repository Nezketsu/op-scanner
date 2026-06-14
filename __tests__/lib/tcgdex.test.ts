import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('tcgdex', () => {
  beforeEach(() => mockFetch.mockReset())

  describe('getCardsByNumber', () => {
    it('returns matching cards for a given number', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([
          { id: 'OP01-001', localId: '001', name: 'Monkey D. Luffy', image: 'https://cdn.tcgdex.net/img', rarity: 'L' }
        ]),
      })

      const { getCardsByNumber } = await import('@/lib/tcgdex')
      const cards = await getCardsByNumber('OP01', '001')
      expect(cards).toHaveLength(1)
      expect(cards[0].id).toBe('OP01-001')
      expect(cards[0].name).toBe('Monkey D. Luffy')
    })

    it('returns empty array when fetch fails', async () => {
      mockFetch.mockResolvedValue({ ok: false })
      const { getCardsByNumber } = await import('@/lib/tcgdex')
      const cards = await getCardsByNumber('OP01', '001')
      expect(cards).toEqual([])
    })
  })

  describe('getSets', () => {
    it('returns list of One Piece sets', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([
          { id: 'OP01', name: 'Romance Dawn', cardCount: { total: 121 } },
          { id: 'OP02', name: 'Paramount War', cardCount: { total: 121 } },
          { id: 'XY01', name: 'Other Game', cardCount: { total: 100 } },
        ]),
      })

      const { getSets } = await import('@/lib/tcgdex')
      const sets = await getSets()
      // Doit filtrer seulement les sets OP/ST/EB
      expect(sets).toHaveLength(2)
      expect(sets[0].id).toBe('OP01')
    })
  })
})
