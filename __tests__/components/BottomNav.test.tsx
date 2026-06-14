import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { BottomNav } from '@/components/ui/BottomNav'

vi.mock('next/navigation', () => ({ usePathname: () => '/scan' }))
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('BottomNav', () => {
  it('renders 4 tabs', () => {
    render(<BottomNav />)
    expect(screen.getByText('Scanner')).toBeInTheDocument()
    expect(screen.getByText('Collection')).toBeInTheDocument()
    expect(screen.getByText('Sets')).toBeInTheDocument()
    expect(screen.getByText('Profil')).toBeInTheDocument()
  })

  it('marks active tab with text-blue-600', () => {
    render(<BottomNav />)
    const scannerLink = screen.getByRole('link', { name: /scanner/i })
    expect(scannerLink.className).toContain('text-blue-600')
  })

  it('marks inactive tabs with text-gray-400', () => {
    render(<BottomNav />)
    const collectionLink = screen.getByRole('link', { name: /collection/i })
    expect(collectionLink.className).toContain('text-gray-400')
  })
})
