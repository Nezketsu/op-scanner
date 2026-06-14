import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

const mockSignOut = vi.fn().mockResolvedValue({})
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } } })
const mockPush = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: mockSignOut, getUser: mockGetUser },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/profile',
}))

vi.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({
    entries: [
      { id: '1', card_id: 'OP01-001', quantity: 1, added_at: '', user_id: 'u1', variant_id: null, card: { market_price: 10, set_id: 'OP01', id: 'OP01-001', name: 'Card 1', image_url: null, rarity: null, variants: null, price_source: null, price_updated_at: null, card_number: 1 } },
      { id: '2', card_id: 'OP01-002', quantity: 2, added_at: '', user_id: 'u1', variant_id: null, card: { market_price: 5, set_id: 'OP01', id: 'OP01-002', name: 'Card 2', image_url: null, rarity: null, variants: null, price_source: null, price_updated_at: null, card_number: 2 } },
    ],
    loadCollection: vi.fn(),
  }),
}))

import ProfilePage from '@/app/(app)/profile/page'

describe('ProfilePage', () => {
  it('shows total card count', async () => {
    render(<ProfilePage />)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('shows total collection value (1×10 + 2×5 = 20)', async () => {
    render(<ProfilePage />)
    await waitFor(() => {
      expect(screen.getByText('$20.00')).toBeInTheDocument()
    })
  })

  it('calls signOut and redirects on button click', async () => {
    render(<ProfilePage />)
    await waitFor(() => screen.getByText(/déconnexion/i))
    fireEvent.click(screen.getByText(/déconnexion/i))
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})
