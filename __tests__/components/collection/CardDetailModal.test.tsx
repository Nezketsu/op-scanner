import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import type { CollectionEntry } from '@/types'

const mockEntry: CollectionEntry = {
  id: 'entry-1', user_id: 'u1', card_id: 'OP01-001', variant_id: null,
  quantity: 2, added_at: '2026-01-01',
  card: { id: 'OP01-001', set_id: 'OP01', card_number: 1, name: 'Monkey D. Luffy', image_url: null, rarity: 'L', variants: null, market_price: 12.50, price_source: 'tcgapi', price_updated_at: null },
}

describe('CardDetailModal', () => {
  it('displays card name and quantity', () => {
    render(<CardDetailModal entry={mockEntry} onClose={vi.fn()} onUpdateQuantity={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Monkey D. Luffy')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onUpdateQuantity +1 when + clicked', () => {
    const onUpdateQuantity = vi.fn()
    render(<CardDetailModal entry={mockEntry} onClose={vi.fn()} onUpdateQuantity={onUpdateQuantity} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByText('+'))
    expect(onUpdateQuantity).toHaveBeenCalledWith('entry-1', 3)
  })

  it('calls onRemove and onClose when retirer clicked', () => {
    const onRemove = vi.fn()
    const onClose = vi.fn()
    render(<CardDetailModal entry={mockEntry} onClose={onClose} onUpdateQuantity={vi.fn()} onRemove={onRemove} />)
    fireEvent.click(screen.getByText('Retirer de la collection'))
    expect(onRemove).toHaveBeenCalledWith('entry-1')
    expect(onClose).toHaveBeenCalled()
  })
})
