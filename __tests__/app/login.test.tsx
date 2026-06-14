import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null })
const mockSignInWithOAuth = vi.fn().mockResolvedValue({})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}))

import LoginPage from '@/app/(auth)/login/page'

describe('LoginPage', () => {
  it('renders OAuth buttons and email form', () => {
    render(<LoginPage />)
    expect(screen.getByText(/google/i)).toBeInTheDocument()
    expect(screen.getByText(/discord/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument()
  })

  it('calls signInWithOAuth on Google button click', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText(/google/i))
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
  })

  it('calls signInWithPassword on form submit', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('form'))
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    })
  })
})
