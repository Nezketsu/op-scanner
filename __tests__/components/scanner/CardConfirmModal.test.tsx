import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const { mockGetCardsByNumber, mockFetchPrice, mockAddCard } = vi.hoisted(() => ({
  mockGetCardsByNumber: vi.fn(),
  mockFetchPrice: vi.fn(),
  mockAddCard: vi.fn(),
}))

vi.mock('@/lib/optcgapi', () => ({ getCardsByNumber: mockGetCardsByNumber }))
vi.mock('@/lib/pricing', () => ({ fetchPrice: mockFetchPrice }))
vi.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ addCard: mockAddCard, entries: [], loading: false, loadCollection: vi.fn(), updateQuantity: vi.fn(), removeCard: vi.fn() }),
}))

import { CardConfirmModal } from '@/components/scanner/CardConfirmModal'
import type { Card } from '@/types'

const mockCard: Card = {
  id: 'OP01-001', set_id: 'OP01', card_number: 1,
  name: 'Monkey D. Luffy', image_url: null, rarity: 'L',
  variants: null, market_price: 12.50, price_source: 'tcgapi', price_updated_at: new Date().toISOString(),
}

describe('CardConfirmModal', () => {
  beforeEach(() => {
    mockGetCardsByNumber.mockReset()
    mockFetchPrice.mockReset()
    mockAddCard.mockReset()
  })

  it('shows card info after loading', async () => {
    mockGetCardsByNumber.mockResolvedValue([mockCard])
    mockFetchPrice.mockResolvedValue({ price: 12.50, source: 'tcgapi', updated_at: '' })

    render(<CardConfirmModal cardNumber="OP01-001" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Monkey D. Luffy')).toBeInTheDocument()
    })
    expect(screen.getByText(/12.50/)).toBeInTheDocument()
  })

  it('shows VariantPicker when multiple cards returned', async () => {
    const cardAlt = { ...mockCard, id: 'OP01-001-alt', name: 'Alternate Art Luffy' }
    mockGetCardsByNumber.mockResolvedValue([mockCard, cardAlt])
    mockFetchPrice.mockResolvedValue(null)

    render(<CardConfirmModal cardNumber="OP01-001" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/quelle version/i)).toBeInTheDocument()
    })
  })

  it('calls addCard and onClose on confirm', async () => {
    mockGetCardsByNumber.mockResolvedValue([mockCard])
    mockFetchPrice.mockResolvedValue(null)
    mockAddCard.mockResolvedValue({ error: null })
    const onClose = vi.fn()

    render(<CardConfirmModal cardNumber="OP01-001" onClose={onClose} />)

    await waitFor(() => screen.getByText('Monkey D. Luffy'))
    fireEvent.click(screen.getByText('Ajouter à ma collection'))

    await waitFor(() => {
      expect(mockAddCard).toHaveBeenCalledWith(mockCard, null)
      expect(onClose).toHaveBeenCalled()
    })
  })
})
