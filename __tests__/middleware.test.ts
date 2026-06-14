import { vi, describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

describe('middleware', () => {
  it('redirects unauthenticated user to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { middleware } = await import('@/middleware')
    const request = new NextRequest('http://localhost:3000/scan')
    const response = await middleware(request)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('redirects authenticated user away from /login to /scan', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const { middleware } = await import('@/middleware')
    const request = new NextRequest('http://localhost:3000/login')
    const response = await middleware(request)
    expect(response.headers.get('location')).toContain('/scan')
  })

  it('allows authenticated user through to /collection', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const { middleware } = await import('@/middleware')
    const request = new NextRequest('http://localhost:3000/collection')
    const response = await middleware(request)
    expect(response.headers.get('location')).toBeNull()
  })
})
