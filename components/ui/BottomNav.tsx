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

const W = 100 / tabs.length

export function BottomNav() {
  const pathname = usePathname()
  const activeIndex = tabs.findIndex(t => pathname.startsWith(t.href))

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
      <div className="relative flex">
        {activeIndex >= 0 && (
          <span
            className="absolute top-2 h-7 w-14 rounded-full bg-indigo-50 pointer-events-none"
            style={{
              left: `calc(${activeIndex} * ${W}% + ${W / 2}% - 28px)`,
              transition: 'left 300ms ease-in-out',
            }}
          />
        )}
        {tabs.map(({ href, label, Icon }, i) => {
          const active = i === activeIndex
          return (
            <Link
              key={href}
              href={href}
              className="relative flex-1 flex flex-col items-center py-2 gap-1"
            >
              <div className="px-3 py-1">
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
      </div>
    </nav>
  )
}
