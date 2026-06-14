import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

import { SetList } from '@/components/sets/SetList'
import type { Set } from '@/types'

const mockSets: Set[] = [
  { id: 'OP01', name: 'Romance Dawn', release_date: '2022-07-08', total_cards: 121, logo_url: null },
  { id: 'OP02', name: 'Paramount War', release_date: '2022-10-28', total_cards: 121, logo_url: null },
]

describe('SetList', () => {
  it('renders all sets', () => {
    render(<SetList sets={mockSets} collectionCounts={{}} />)
    expect(screen.getByText('Romance Dawn')).toBeInTheDocument()
    expect(screen.getByText('Paramount War')).toBeInTheDocument()
  })

  it('shows progress when collection count provided', () => {
    render(<SetList sets={mockSets} collectionCounts={{ OP01: 42 }} />)
    expect(screen.getByText(/42\/121/)).toBeInTheDocument()
  })

  it('links to set detail page', () => {
    render(<SetList sets={mockSets} collectionCounts={{}} />)
    const link = screen.getAllByRole('link')[0]
    expect(link).toHaveAttribute('href', '/sets/OP01')
  })
})
