import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockUpsert = vi.fn()
const mockFromCards = vi.fn(() => ({ select: mockSelect, upsert: mockUpsert }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFromCards }),
}))

describe('pricing', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockSingle.mockReset()
  })

  it('returns TCGApi.dev price when available', async () => {
    mockSingle.mockResolvedValue({ data: null })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { marketPrice: 12.50 } }),
    })
    mockUpsert.mockResolvedValue({ error: null })

    const { fetchPrice } = await import('@/lib/pricing')
    const result = await fetchPrice('OP01-001')
    expect(result?.price).toBe(12.50)
    expect(result?.source).toBe('tcgapi')
  })

  it('falls back to TCGfast when TCGApi.dev returns 429', async () => {
    mockSingle.mockResolvedValue({ data: null })
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ price: 11.00 }) })
    mockUpsert.mockResolvedValue({ error: null })

    const { fetchPrice } = await import('@/lib/pricing')
    const result = await fetchPrice('OP01-001')
    expect(result?.price).toBe(11.00)
    expect(result?.source).toBe('tcgfast')
  })

  it('returns stale cache when both APIs are rate-limited', async () => {
    mockSingle.mockResolvedValue({
      data: {
        market_price: 10.00,
        price_source: 'cache',
        price_updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    })
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: false, status: 429 })

    const { fetchPrice } = await import('@/lib/pricing')
    const result = await fetchPrice('OP01-001')
    expect(result?.price).toBe(10.00)
    expect(result?.stale).toBe(true)
  })
})
