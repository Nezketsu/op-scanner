import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

import { SetSection } from '@/components/collection/SetSection'
import type { CollectionEntry } from '@/types'

const mockEntries: CollectionEntry[] = [
  {
    id: '1', user_id: 'u1', card_id: 'OP01-001', variant_id: null,
    quantity: 1, added_at: '2026-01-01',
    card: { id: 'OP01-001', set_id: 'OP01', card_number: 1, name: 'Monkey D. Luffy', image_url: null, rarity: 'L', variants: null, market_price: 12, price_source: 'tcgapi', price_updated_at: null },
  },
]

describe('SetSection', () => {
  it('renders set name and progress', () => {
    render(<SetSection setId="OP01" setName="Romance Dawn" totalCards={121} entries={mockEntries} onCardTap={vi.fn()} />)
    expect(screen.getByText('Romance Dawn')).toBeInTheDocument()
    expect(screen.getByText(/1\/121/)).toBeInTheDocument()
  })

  it('shows percentage rounded', () => {
    render(<SetSection setId="OP01" setName="Romance Dawn" totalCards={121} entries={mockEntries} onCardTap={vi.fn()} />)
    expect(screen.getByText(/\d+%/)).toBeInTheDocument()
  })
})
