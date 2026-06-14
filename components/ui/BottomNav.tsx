'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/scan', label: 'Scanner', icon: '📷' },
  { href: '/collection', label: 'Collection', icon: '📚' },
  { href: '/sets', label: 'Sets', icon: '🗂' },
  { href: '/profile', label: 'Profil', icon: '👤' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
            pathname.startsWith(tab.href) ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
