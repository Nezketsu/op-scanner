'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, BookOpen, Grid2X2, User } from 'lucide-react'

const tabs = [
  { href: '/scan', label: 'Scanner', Icon: Camera },
  { href: '/collection', label: 'Collection', Icon: BookOpen },
  { href: '/sets', label: 'Sets', Icon: Grid2X2 },
  { href: '/profile', label: 'Profil', Icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center py-2 gap-1"
          >
            <div className={`px-3 py-1 rounded-full ${active ? 'bg-indigo-50' : ''}`}>
              <Icon
                size={18}
                strokeWidth={active ? 2.5 : 2}
                className={active ? 'text-indigo-500' : 'text-slate-400'}
              />
            </div>
            <span className={`text-[10px] font-medium ${active ? 'text-indigo-500 font-semibold' : 'text-slate-400'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
