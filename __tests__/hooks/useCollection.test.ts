import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockUpsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: mockSelect,
      upsert: mockUpsert,
      delete: () => ({ eq: mockEq }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  }),
}))

describe('useCollection', () => {
  beforeEach(() => {
    mockUpsert.mockReset()
    mockDelete.mockReset()
    mockEq.mockReset()
    mockSelect.mockReset()
  })

  it('loadCollection fetches entries for current user', async () => {
    mockSelect.mockReturnValue({
      eq: () => Promise.resolve({
        data: [{ id: '1', card_id: 'OP01-001', quantity: 1, user_id: 'user-1' }],
        error: null,
      }),
    })

    const { useCollection } = await import('@/hooks/useCollection')
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.loadCollection()
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].card_id).toBe('OP01-001')
  })

  it('addCard calls upsert with correct payload', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    mockSelect.mockReturnValue({
      eq: () => Promise.resolve({ data: [], error: null }),
    })

    const { useCollection } = await import('@/hooks/useCollection')
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.addCard('OP01-001', null)
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ card_id: 'OP01-001', user_id: 'user-1' }),
      expect.any(Object)
    )
  })

  it('removeCard calls delete with entry id', async () => {
    mockEq.mockResolvedValue({ error: null })
    mockSelect.mockReturnValue({
      eq: () => Promise.resolve({ data: [], error: null }),
    })

    const { useCollection } = await import('@/hooks/useCollection')
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.removeCard('entry-1')
    })

    expect(mockEq).toHaveBeenCalledWith('id', 'entry-1')
  })
})
