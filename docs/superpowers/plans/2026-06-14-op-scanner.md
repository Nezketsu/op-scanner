# One Piece Card Scanner & Collection Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire une PWA mobile-first pour scanner des cartes One Piece TCG via OCR, les identifier via une API cartes, afficher leurs prix, et gérer un classeur personnel dans Supabase.

**Architecture:** Next.js 14 App Router + Supabase (PostgreSQL + Auth + RLS). OCR client-side avec Tesseract.js. Données cartes depuis TCGDex/OPTCG API mises en cache dans Supabase. Pricing via TCGApi.dev avec fallback TCGfast.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, @ducanh2912/next-pwa, @supabase/supabase-js, @supabase/ssr, tesseract.js, Vitest, @testing-library/react

---

## File Map

```
/app
  layout.tsx                        → Root layout (fonts, providers)
  /(auth)
    /login/page.tsx                 → Page de connexion
    /auth/callback/route.ts         → OAuth callback Supabase
  /(app)
    layout.tsx                      → Layout avec BottomNav
    /scan/page.tsx                  → Page scanner
    /collection/page.tsx            → Classeur virtuel
    /sets/page.tsx                  → Liste des extensions
    /sets/[id]/page.tsx             → Détail d'un set
    /profile/page.tsx               → Profil & stats

/components
  /ui
    BottomNav.tsx                   → Navigation mobile bas d'écran
    Modal.tsx                       → Wrapper modal générique
    Toast.tsx                       → Notifications toast
    ProgressBar.tsx                 → Barre de progression
  /scanner
    Viewfinder.tsx                  → Stream caméra + capture
    CardConfirmModal.tsx            → Confirmation carte + ajout
    VariantPicker.tsx               → Sélection de variante
  /collection
    SetSection.tsx                  → Section d'un set dans le classeur
    CardTile.tsx                    → Tuile carte dans la grille
    CardDetailModal.tsx             → Détail carte (quantité, prix, retirer)
  /sets
    SetList.tsx                     → Liste de tous les sets
    SetCard.tsx                     → Ligne d'un set dans la liste

/lib
  /supabase/client.ts               → Client Supabase browser
  /supabase/server.ts               → Client Supabase server (App Router)
  tcgdex.ts                         → Client API données cartes
  pricing.ts                        → Orchestrateur prix (primaire + fallback)
  ocr.ts                            → Wrapper Tesseract.js

/hooks
  useCollection.ts                  → CRUD collection Supabase
  useScanner.ts                     → Caméra + OCR
  usePricing.ts                     → Fetch prix avec cache

/types/index.ts                     → Types TypeScript partagés
/middleware.ts                      → Protection routes (auth guard)
```

---

## Task 1: Bootstrap du projet

**Files:**
- Create: `package.json`, `next.config.js`, `vitest.config.ts`, `vitest.setup.ts`, `.env.local.example`

- [ ] **Initialiser Next.js**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

- [ ] **Installer les dépendances**

```bash
npm install @supabase/supabase-js @supabase/ssr tesseract.js @ducanh2912/next-pwa
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Configurer Vitest** — créer `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Créer `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Ajouter scripts dans `package.json`**

Remplacer le bloc `"scripts"` existant par :

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Configurer next-pwa** — remplacer `next.config.js`

```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = withPWA(nextConfig)
```

- [ ] **Créer `.env.local.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TCGAPI_DEV_KEY=your-tcgapi-dev-key
```

Copier en `.env.local` et remplir avec les vraies valeurs depuis le dashboard Supabase et tcgapi.dev.

- [ ] **Vérifier que Next.js démarre**

```bash
npm run dev
```

Expected: `Ready on http://localhost:3000`

- [ ] **Commit**

```bash
git add .
git commit -m "chore: bootstrap Next.js 14 + Supabase + Vitest + PWA"
```

---

## Task 2: Types TypeScript partagés

**Files:**
- Create: `types/index.ts`
- Create: `__tests__/types.test.ts`

- [ ] **Écrire le test (shape check)**

```typescript
// __tests__/types.test.ts
import type { Card, Set, CollectionEntry, PriceData, Variant, ScanResult } from '@/types'

describe('types', () => {
  it('Card shape is assignable', () => {
    const card: Card = {
      id: 'OP01-001',
      set_id: 'OP01',
      card_number: 1,
      name: 'Monkey D. Luffy',
      image_url: 'https://example.com/img.jpg',
      rarity: 'L',
      variants: null,
      market_price: 12.5,
      price_source: 'tcgapi',
      price_updated_at: '2026-06-14T00:00:00Z',
    }
    expect(card.id).toBe('OP01-001')
  })

  it('CollectionEntry has optional card join', () => {
    const entry: CollectionEntry = {
      id: 'uuid-1',
      user_id: 'user-uuid',
      card_id: 'OP01-001',
      variant_id: null,
      quantity: 1,
      added_at: '2026-06-14T00:00:00Z',
    }
    expect(entry.card).toBeUndefined()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/types.test.ts
```

Expected: FAIL — module not found

- [ ] **Créer `types/index.ts`**

```typescript
export interface Set {
  id: string
  name: string
  release_date: string | null
  total_cards: number | null
  logo_url: string | null
}

export interface Variant {
  id: string
  name: string
  image_url: string
}

export interface Card {
  id: string
  set_id: string
  card_number: number | null
  name: string
  image_url: string | null
  rarity: string | null
  variants: Variant[] | null
  market_price: number | null
  price_source: 'tcgapi' | 'tcgfast' | 'cache' | null
  price_updated_at: string | null
}

export interface CollectionEntry {
  id: string
  user_id: string
  card_id: string
  variant_id: string | null
  quantity: number
  added_at: string
  card?: Card
}

export interface PriceData {
  price: number
  source: 'tcgapi' | 'tcgfast' | 'cache'
  stale?: boolean
  updated_at: string
}

export interface ScanResult {
  cardNumber: string
  confidence: number
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/types.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add types/index.ts __tests__/types.test.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Clients Supabase

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `__tests__/lib/supabase.test.ts`

- [ ] **Écrire le test**

```typescript
// __tests__/lib/supabase.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

// On teste que les clients retournent un objet avec les méthodes attendues
// sans appel réseau réel

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ auth: { getUser: vi.fn() } })),
  createServerClient: vi.fn(() => ({ auth: { getUser: vi.fn() } })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

describe('supabase/client', () => {
  it('creates a browser client with auth', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()
    expect(client).toHaveProperty('auth')
  })
})

describe('supabase/server', () => {
  it('creates a server client with auth', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const client = createClient()
    expect(client).toHaveProperty('auth')
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/lib/supabase.test.ts
```

Expected: FAIL — module not found

- [ ] **Créer `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Créer `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignoré dans les Server Components (lecture seule)
          }
        },
      },
    }
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/lib/supabase.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add lib/supabase/ __tests__/lib/supabase.test.ts
git commit -m "feat: add Supabase browser and server clients"
```

---

## Task 4: Schéma base de données

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

> Pas de tests automatisés pour la DDL. Exécuter le SQL dans le Supabase SQL Editor.

- [ ] **Créer `supabase/migrations/001_initial_schema.sql`**

```sql
-- Sets (extensions One Piece)
create table public.sets (
  id            text primary key,
  name          text not null,
  release_date  date,
  total_cards   int,
  logo_url      text
);

alter table public.sets enable row level security;

create policy "sets are publicly readable"
  on public.sets for select using (true);

-- Cards (cache partagé, toutes variantes)
create table public.cards (
  id               text primary key,
  set_id           text references public.sets,
  card_number      int,
  name             text not null,
  image_url        text,
  rarity           text,
  variants         jsonb,
  market_price     decimal(10,2),
  price_source     text check (price_source in ('tcgapi', 'tcgfast', 'cache')),
  price_updated_at timestamptz
);

alter table public.cards enable row level security;

create policy "cards are publicly readable"
  on public.cards for select using (true);

-- Index pour accélérer la recherche par set
create index cards_set_id_idx on public.cards (set_id, card_number);

-- Collection (données personnelles de l'utilisateur)
create table public.collection (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  card_id    text references public.cards not null,
  variant_id text,
  quantity   int default 1,
  added_at   timestamptz default now(),
  unique (user_id, card_id, variant_id)
);

alter table public.collection enable row level security;

create policy "users can view own collection"
  on public.collection for select using (auth.uid() = user_id);

create policy "users can insert into own collection"
  on public.collection for insert with check (auth.uid() = user_id);

create policy "users can update own collection"
  on public.collection for update using (auth.uid() = user_id);

create policy "users can delete from own collection"
  on public.collection for delete using (auth.uid() = user_id);
```

- [ ] **Exécuter dans Supabase SQL Editor**

Aller sur `https://supabase.com/dashboard/project/<your-project>/sql/new`, coller le SQL, cliquer Run.

Expected: toutes les tables et policies créées sans erreur.

- [ ] **Vérifier dans Table Editor**

Aller sur l'onglet Table Editor, vérifier que `sets`, `cards`, `collection` existent.

- [ ] **Commit**

```bash
git add supabase/
git commit -m "feat: add initial database schema with RLS"
```

---

## Task 5: Auth middleware + OAuth callback

**Files:**
- Create: `middleware.ts`
- Create: `app/auth/callback/route.ts`
- Create: `__tests__/middleware.test.ts`

- [ ] **Écrire le test du middleware**

```typescript
// __tests__/middleware.test.ts
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
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/middleware.test.ts
```

Expected: FAIL

- [ ] **Créer `middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/scan', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)'],
}
```

- [ ] **Créer `app/auth/callback/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/scan`)
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/middleware.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add middleware.ts app/auth/ __tests__/middleware.test.ts
git commit -m "feat: add auth middleware and OAuth callback route"
```

---

## Task 6: Page de login

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `__tests__/app/login.test.tsx`

- [ ] **Écrire le test**

```typescript
// __tests__/app/login.test.tsx
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
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/app/login.test.tsx
```

Expected: FAIL

- [ ] **Créer `app/(auth)/login/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleOAuth = (provider: 'google' | 'discord') => {
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">OP Scanner</h1>
      <p className="text-gray-500 mb-8">Ta collection One Piece</p>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => handleOAuth('google')}
          className="w-full py-3 px-4 bg-white text-gray-900 border border-gray-300 rounded-xl font-medium"
        >
          Continuer avec Google
        </button>
        <button
          onClick={() => handleOAuth('discord')}
          className="w-full py-3 px-4 bg-[#5865F2] text-white rounded-xl font-medium"
        >
          Continuer avec Discord
        </button>

        <div className="flex items-center gap-3 my-2">
          <hr className="flex-1 border-gray-200" />
          <span className="text-sm text-gray-400">ou</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <form onSubmit={handleEmailLogin} aria-label="form" className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/app/login.test.tsx
```

Expected: PASS

- [ ] **Commit**

```bash
git add app/\(auth\)/ __tests__/app/login.test.tsx
git commit -m "feat: add login page with OAuth and email/password"
```

---

## Task 7: Layout applicatif + BottomNav

**Files:**
- Create: `components/ui/BottomNav.tsx`
- Create: `app/(app)/layout.tsx`
- Create: `app/layout.tsx`
- Create: `__tests__/components/BottomNav.test.tsx`

- [ ] **Écrire le test**

```typescript
// __tests__/components/BottomNav.test.tsx
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
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/components/BottomNav.test.tsx
```

Expected: FAIL

- [ ] **Créer `components/ui/BottomNav.tsx`**

```typescript
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
```

- [ ] **Créer `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OP Scanner',
  description: 'Scanner et classeur One Piece TCG',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Créer `app/(app)/layout.tsx`**

```typescript
import { BottomNav } from '@/components/ui/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/components/BottomNav.test.tsx
```

Expected: PASS

- [ ] **Commit**

```bash
git add app/layout.tsx app/\(app\)/layout.tsx components/ui/BottomNav.tsx __tests__/components/BottomNav.test.tsx
git commit -m "feat: add app layout with bottom navigation"
```

---

## Task 8: Client TCGDex (données cartes)

**Files:**
- Create: `lib/tcgdex.ts`
- Create: `__tests__/lib/tcgdex.test.ts`

> **Note :** TCGDex couvre principalement Pokémon. Si la couverture One Piece est absente à l'implémentation, remplacer `BASE_URL` par `https://optcgapi.com/api` et adapter les endpoints. L'interface `TCGDexCard` ci-dessous doit rester stable.

- [ ] **Écrire le test**

```typescript
// __tests__/lib/tcgdex.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('tcgdex', () => {
  beforeEach(() => mockFetch.mockReset())

  describe('getCardsByNumber', () => {
    it('returns matching cards for a given number', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([
          { id: 'OP01-001', localId: '001', name: 'Monkey D. Luffy', image: 'https://cdn.tcgdex.net/img.jpg', rarity: 'L' }
        ]),
      })

      const { getCardsByNumber } = await import('@/lib/tcgdex')
      const cards = await getCardsByNumber('OP01', '001')
      expect(cards).toHaveLength(1)
      expect(cards[0].id).toBe('OP01-001')
      expect(cards[0].name).toBe('Monkey D. Luffy')
    })

    it('returns empty array when fetch fails', async () => {
      mockFetch.mockResolvedValue({ ok: false })
      const { getCardsByNumber } = await import('@/lib/tcgdex')
      const cards = await getCardsByNumber('OP01', '001')
      expect(cards).toEqual([])
    })
  })

  describe('getSets', () => {
    it('returns list of sets', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([{ id: 'OP01', name: 'Romance Dawn', cardCount: { total: 121 } }]),
      })

      const { getSets } = await import('@/lib/tcgdex')
      const sets = await getSets()
      expect(sets).toHaveLength(1)
      expect(sets[0].id).toBe('OP01')
    })
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/lib/tcgdex.test.ts
```

Expected: FAIL

- [ ] **Créer `lib/tcgdex.ts`**

```typescript
import type { Card, Set, Variant } from '@/types'

// TCGDex API — remplacer BASE_URL par 'https://optcgapi.com/api' si TCGDex ne couvre pas One Piece
const BASE_URL = 'https://api.tcgdex.net/v2/en'

interface TCGDexCard {
  id: string
  localId: string
  name: string
  image?: string
  rarity?: string
  variants?: { id: string; name: string; image?: string }[]
}

interface TCGDexSet {
  id: string
  name: string
  releaseDate?: string
  cardCount?: { total: number }
  logo?: string
}

export async function getCardsByNumber(setId: string, cardNumber: string): Promise<Card[]> {
  try {
    const res = await fetch(`${BASE_URL}/sets/${setId}/cards?localId=${cardNumber}`)
    if (!res.ok) return []
    const data: TCGDexCard[] = await res.json()
    return data.map(mapCard(setId))
  } catch {
    return []
  }
}

export async function getCardById(cardId: string): Promise<Card | null> {
  const [setId] = cardId.split('-')
  try {
    const res = await fetch(`${BASE_URL}/cards/${cardId}`)
    if (!res.ok) return null
    const data: TCGDexCard = await res.json()
    return mapCard(setId)(data)
  } catch {
    return null
  }
}

export async function getSets(): Promise<Set[]> {
  try {
    const res = await fetch(`${BASE_URL}/sets`)
    if (!res.ok) return []
    const data: TCGDexSet[] = await res.json()
    return data
      .filter(s => s.id.startsWith('OP') || s.id.startsWith('ST') || s.id.startsWith('EB'))
      .map(s => ({
        id: s.id,
        name: s.name,
        release_date: s.releaseDate ?? null,
        total_cards: s.cardCount?.total ?? null,
        logo_url: s.logo ?? null,
      }))
  } catch {
    return []
  }
}

function mapCard(setId: string) {
  return (c: TCGDexCard): Card => ({
    id: c.id,
    set_id: setId,
    card_number: parseInt(c.localId, 10) || null,
    name: c.name,
    image_url: c.image ? `${c.image}/high.jpg` : null,
    rarity: c.rarity ?? null,
    variants: c.variants?.map(v => ({
      id: v.id,
      name: v.name,
      image_url: v.image ? `${v.image}/high.jpg` : '',
    })) ?? null,
    market_price: null,
    price_source: null,
    price_updated_at: null,
  })
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/lib/tcgdex.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add lib/tcgdex.ts __tests__/lib/tcgdex.test.ts
git commit -m "feat: add TCGDex API client for card data"
```

---

## Task 9: Client pricing (TCGApi.dev + TCGfast + fallback)

**Files:**
- Create: `lib/pricing.ts`
- Create: `__tests__/lib/pricing.test.ts`

- [ ] **Écrire le test**

```typescript
// __tests__/lib/pricing.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock Supabase
const mockFrom = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

describe('pricing', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFrom.mockReset()
  })

  it('returns TCGApi.dev price when available', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null }),
        }),
      }),
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { marketPrice: 12.50 } }),
    })

    const { fetchPrice } = await import('@/lib/pricing')
    const result = await fetchPrice('OP01-001')
    expect(result?.price).toBe(12.50)
    expect(result?.source).toBe('tcgapi')
  })

  it('falls back to TCGfast when TCGApi.dev returns 429', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null }),
        }),
      }),
    })

    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429 })  // TCGApi.dev rate-limited
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ price: 11.00 }),
      })

    const { fetchPrice } = await import('@/lib/pricing')
    const result = await fetchPrice('OP01-001')
    expect(result?.price).toBe(11.00)
    expect(result?.source).toBe('tcgfast')
  })

  it('returns stale cache when both APIs are rate-limited', async () => {
    const staleData = {
      market_price: 10.00,
      price_source: 'cache',
      price_updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    }
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: staleData }),
        }),
      }),
    })

    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: false, status: 429 })

    const { fetchPrice } = await import('@/lib/pricing')
    const result = await fetchPrice('OP01-001')
    expect(result?.price).toBe(10.00)
    expect(result?.stale).toBe(true)
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/lib/pricing.test.ts
```

Expected: FAIL

- [ ] **Créer `lib/pricing.ts`**

```typescript
import type { PriceData } from '@/types'
import { createClient } from '@/lib/supabase/client'

const TCGAPI_BASE = 'https://api.tcgapi.dev/v1'
const TCGFAST_BASE = 'https://tcgfast.com/api/v1'
const CACHE_TTL_HOURS = 24

function isExpired(updatedAt: string): boolean {
  const diff = Date.now() - new Date(updatedAt).getTime()
  return diff > CACHE_TTL_HOURS * 60 * 60 * 1000
}

async function getCachedPrice(cardId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('cards')
    .select('market_price, price_source, price_updated_at')
    .eq('id', cardId)
    .single()
  return data
}

async function updateCachedPrice(cardId: string, price: number, source: 'tcgapi' | 'tcgfast') {
  const supabase = createClient()
  await supabase.from('cards').upsert({
    id: cardId,
    market_price: price,
    price_source: source,
    price_updated_at: new Date().toISOString(),
  })
}

async function fetchFromTCGApiDev(cardId: string): Promise<number | null> {
  const res = await fetch(`${TCGAPI_BASE}/cards/${cardId}/price`, {
    headers: { 'X-API-Key': process.env.NEXT_PUBLIC_TCGAPI_DEV_KEY ?? '' },
  })
  if (res.status === 429) return null
  if (!res.ok) throw new Error(`TCGApi.dev error: ${res.status}`)
  const data = await res.json()
  return data?.data?.marketPrice ?? null
}

async function fetchFromTCGfast(cardId: string): Promise<number | null> {
  const res = await fetch(`${TCGFAST_BASE}/one-piece/price/${cardId}`)
  if (res.status === 429) return null
  if (!res.ok) throw new Error(`TCGfast error: ${res.status}`)
  const data = await res.json()
  return data?.price ?? null
}

export async function fetchPrice(cardId: string): Promise<PriceData | null> {
  const cached = await getCachedPrice(cardId)
  const now = new Date().toISOString()

  if (cached?.market_price && cached.price_updated_at && !isExpired(cached.price_updated_at)) {
    return {
      price: cached.market_price,
      source: (cached.price_source as PriceData['source']) ?? 'cache',
      updated_at: cached.price_updated_at,
    }
  }

  const tcgapiPrice = await fetchFromTCGApiDev(cardId)
  if (tcgapiPrice !== null) {
    await updateCachedPrice(cardId, tcgapiPrice, 'tcgapi')
    return { price: tcgapiPrice, source: 'tcgapi', updated_at: now }
  }

  const tcgfastPrice = await fetchFromTCGfast(cardId)
  if (tcgfastPrice !== null) {
    await updateCachedPrice(cardId, tcgfastPrice, 'tcgfast')
    return { price: tcgfastPrice, source: 'tcgfast', updated_at: now }
  }

  if (cached?.market_price) {
    return {
      price: cached.market_price,
      source: 'cache',
      stale: true,
      updated_at: cached.price_updated_at ?? now,
    }
  }

  return null
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/lib/pricing.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add lib/pricing.ts __tests__/lib/pricing.test.ts
git commit -m "feat: add pricing client with TCGApi.dev + TCGfast fallback"
```

---

## Task 10: Module OCR (Tesseract.js)

**Files:**
- Create: `lib/ocr.ts`
- Create: `__tests__/lib/ocr.test.ts`

- [ ] **Écrire le test**

```typescript
// __tests__/lib/ocr.test.ts
import { vi, describe, it, expect } from 'vitest'

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => ({
    recognize: vi.fn(async () => ({
      data: { text: 'OP01-001\nSome other text\n', confidence: 90 },
    })),
    terminate: vi.fn(),
  })),
}))

describe('ocr', () => {
  it('extracts One Piece card number from OCR text', async () => {
    const { extractCardNumber } = await import('@/lib/ocr')
    const result = extractCardNumber('OP01-001\nSome other text\n')
    expect(result).toEqual({ cardNumber: 'OP01-001', confidence: 1 })
  })

  it('extracts starter deck format ST01-001', () => {
    const { extractCardNumber } = await import('@/lib/ocr')
    const result = extractCardNumber('Random text ST01-005 more text')
    expect(result?.cardNumber).toBe('ST01-005')
  })

  it('returns null when no card number found', () => {
    const { extractCardNumber } = await import('@/lib/ocr')
    const result = extractCardNumber('just random text here')
    expect(result).toBeNull()
  })

  it('recognizeCardNumber calls tesseract and returns result', async () => {
    const { recognizeCardNumber } = await import('@/lib/ocr')
    const result = await recognizeCardNumber('data:image/jpeg;base64,fake')
    expect(result?.cardNumber).toBe('OP01-001')
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/lib/ocr.test.ts
```

Expected: FAIL

- [ ] **Créer `lib/ocr.ts`**

```typescript
import type { ScanResult } from '@/types'

// Format One Piece : OP01-001, ST01-001, EB01-001, P-001
const CARD_NUMBER_REGEX = /\b([A-Z]{1,3}\d{1,2}-\d{3}[a-z]?)\b/i

let workerInstance: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | null = null

async function getWorker() {
  if (!workerInstance) {
    const { createWorker } = await import('tesseract.js')
    workerInstance = await createWorker('eng')
  }
  return workerInstance
}

export function extractCardNumber(text: string): ScanResult | null {
  const match = text.match(CARD_NUMBER_REGEX)
  if (!match) return null
  return { cardNumber: match[1].toUpperCase(), confidence: 1 }
}

export async function recognizeCardNumber(imageData: string): Promise<ScanResult | null> {
  const worker = await getWorker()
  const { data } = await worker.recognize(imageData)
  const result = extractCardNumber(data.text)
  if (!result) return null
  return { cardNumber: result.cardNumber, confidence: data.confidence / 100 }
}

export async function terminateWorker() {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/lib/ocr.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add lib/ocr.ts __tests__/lib/ocr.test.ts
git commit -m "feat: add OCR module with card number extraction"
```

---

## Task 11: Hook useCollection

**Files:**
- Create: `hooks/useCollection.ts`
- Create: `__tests__/hooks/useCollection.test.ts`

- [ ] **Écrire le test**

```typescript
// __tests__/hooks/useCollection.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: mockSelect,
      insert: mockInsert,
      upsert: mockUpsert,
      delete: mockDelete,
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  }),
}))

describe('useCollection', () => {
  beforeEach(() => {
    mockSelect.mockReturnValue({
      eq: () => ({ data: [], error: null }),
    })
  })

  it('loads collection on mount', async () => {
    mockSelect.mockReturnValue({
      eq: () => Promise.resolve({ data: [{ id: '1', card_id: 'OP01-001', quantity: 1 }], error: null }),
    })

    const { useCollection } = await import('@/hooks/useCollection')
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.loadCollection()
    })

    expect(result.current.entries).toHaveLength(1)
  })

  it('addCard calls upsert with correct payload', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    mockSelect.mockReturnValue({
      eq: () => Promise.resolve({ data: [], error: null }),
    })

    const { useCollection } = await import('@/hooks/useCollection')
    const { result } = renderHook(() => useCollection())

    await act(async () => {
      await result.current.addCard('OP01-001', null)
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ card_id: 'OP01-001' }),
      expect.any(Object)
    )
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/hooks/useCollection.test.ts
```

Expected: FAIL

- [ ] **Créer `hooks/useCollection.ts`**

```typescript
'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CollectionEntry } from '@/types'

export function useCollection() {
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadCollection = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('collection')
      .select('*, card:cards(*)')
      .eq('user_id', user.id)

    if (!error && data) setEntries(data as CollectionEntry[])
    setLoading(false)
  }, [])

  const addCard = useCallback(async (cardId: string, variantId: string | null) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('collection')
      .upsert(
        { user_id: user.id, card_id: cardId, variant_id: variantId, quantity: 1 },
        { onConflict: 'user_id,card_id,variant_id', ignoreDuplicates: false }
      )

    if (!error) await loadCollection()
  }, [loadCollection])

  const updateQuantity = useCallback(async (entryId: string, quantity: number) => {
    if (quantity < 1) return removeCard(entryId)

    await supabase
      .from('collection')
      .upsert({ id: entryId, quantity })

    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, quantity } : e))
  }, [])

  const removeCard = useCallback(async (entryId: string) => {
    await supabase.from('collection').delete().eq('id', entryId)
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }, [])

  return { entries, loading, loadCollection, addCard, updateQuantity, removeCard }
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/hooks/useCollection.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add hooks/useCollection.ts __tests__/hooks/useCollection.test.ts
git commit -m "feat: add useCollection hook with CRUD operations"
```

---

## Task 12: Page Scanner (caméra + OCR)

**Files:**
- Create: `hooks/useScanner.ts`
- Create: `components/scanner/Viewfinder.tsx`
- Create: `app/(app)/scan/page.tsx`
- Create: `__tests__/hooks/useScanner.test.ts`

- [ ] **Écrire le test du hook**

```typescript
// __tests__/hooks/useScanner.test.ts
import { vi, describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('@/lib/ocr', () => ({
  recognizeCardNumber: vi.fn().mockResolvedValue({ cardNumber: 'OP01-001', confidence: 0.92 }),
}))

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
  writable: true,
})

describe('useScanner', () => {
  it('processes captured image and returns scan result', async () => {
    const { useScanner } = await import('@/hooks/useScanner')
    const { result } = renderHook(() => useScanner())

    await act(async () => {
      await result.current.processImage('data:image/jpeg;base64,fake')
    })

    expect(result.current.scanResult?.cardNumber).toBe('OP01-001')
    expect(result.current.scanResult?.confidence).toBe(0.92)
  })

  it('sets error state when OCR returns null', async () => {
    const { recognizeCardNumber } = await import('@/lib/ocr')
    vi.mocked(recognizeCardNumber).mockResolvedValueOnce(null)

    const { useScanner } = await import('@/hooks/useScanner')
    const { result } = renderHook(() => useScanner())

    await act(async () => {
      await result.current.processImage('data:image/jpeg;base64,fake')
    })

    expect(result.current.scanResult).toBeNull()
    expect(result.current.error).toBe('Numéro de carte non détecté')
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/hooks/useScanner.test.ts
```

Expected: FAIL

- [ ] **Créer `hooks/useScanner.ts`**

```typescript
'use client'
import { useState, useRef, useCallback } from 'react'
import type { ScanResult } from '@/types'

export function useScanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError('Impossible d\'accéder à la caméra')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [])

  const processImage = useCallback(async (imageData: string) => {
    setScanning(true)
    setError(null)
    const { recognizeCardNumber } = await import('@/lib/ocr')
    const result = await recognizeCardNumber(imageData)
    if (result) {
      setScanResult(result)
    } else {
      setError('Numéro de carte non détecté')
    }
    setScanning(false)
  }, [])

  const reset = useCallback(() => {
    setScanResult(null)
    setError(null)
  }, [])

  return { videoRef, scanResult, scanning, error, startCamera, stopCamera, captureFrame, processImage, reset }
}
```

- [ ] **Créer `components/scanner/Viewfinder.tsx`**

```typescript
'use client'
import { useEffect } from 'react'
import { useScanner } from '@/hooks/useScanner'

interface ViewfinderProps {
  onCapture: (imageData: string) => void
}

export function Viewfinder({ onCapture }: ViewfinderProps) {
  const { videoRef, startCamera, stopCamera, captureFrame } = useScanner()

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const handleCapture = () => {
    const frame = captureFrame()
    if (frame) onCapture(frame)
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {/* Overlay de guidage */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="border-2 border-white rounded-lg w-64 h-40 opacity-60" />
      </div>
      {/* Bouton capture */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          onClick={handleCapture}
          className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-lg active:scale-95 transition-transform"
          aria-label="Capturer"
        />
      </div>
    </div>
  )
}
```

- [ ] **Créer `app/(app)/scan/page.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { Viewfinder } from '@/components/scanner/Viewfinder'
import { CardConfirmModal } from '@/components/scanner/CardConfirmModal'
import { useScanner } from '@/hooks/useScanner'
import type { Card } from '@/types'

export default function ScanPage() {
  const { processImage, scanResult, scanning, error, reset } = useScanner()
  const [detectedCards, setDetectedCards] = useState<Card[]>([])
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const handleCapture = async (imageData: string) => {
    setCapturedImage(imageData)
    await processImage(imageData)
  }

  return (
    <div className="fixed inset-0">
      <Viewfinder onCapture={handleCapture} />

      {/* Badge numéro détecté */}
      {scanResult && (
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-mono">
            {scanResult.cardNumber}
            {scanResult.confidence < 0.7 && ' (faible confiance)'}
          </span>
        </div>
      )}

      {/* Erreur OCR */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-xl text-sm text-center">
          {error}
          <button onClick={reset} className="ml-2 underline">Réessayer</button>
        </div>
      )}

      {scanning && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-xl">Analyse en cours...</div>
        </div>
      )}

      {scanResult && (
        <CardConfirmModal
          cardNumber={scanResult.cardNumber}
          onClose={reset}
        />
      )}
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/hooks/useScanner.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add hooks/useScanner.ts components/scanner/Viewfinder.tsx app/\(app\)/scan/ __tests__/hooks/useScanner.test.ts
git commit -m "feat: add scanner page with camera viewfinder and OCR hook"
```

---

## Task 13: VariantPicker + CardConfirmModal

**Files:**
- Create: `components/scanner/VariantPicker.tsx`
- Create: `components/scanner/CardConfirmModal.tsx`
- Create: `__tests__/components/scanner/CardConfirmModal.test.tsx`

- [ ] **Écrire le test**

```typescript
// __tests__/components/scanner/CardConfirmModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

const mockGetCardsByNumber = vi.fn()
const mockFetchPrice = vi.fn()
const mockAddCard = vi.fn()

vi.mock('@/lib/tcgdex', () => ({ getCardsByNumber: mockGetCardsByNumber }))
vi.mock('@/lib/pricing', () => ({ fetchPrice: mockFetchPrice }))
vi.mock('@/hooks/useCollection', () => ({ useCollection: () => ({ addCard: mockAddCard }) }))

import { CardConfirmModal } from '@/components/scanner/CardConfirmModal'
import type { Card } from '@/types'

const mockCard: Card = {
  id: 'OP01-001', set_id: 'OP01', card_number: 1,
  name: 'Monkey D. Luffy', image_url: null, rarity: 'L',
  variants: null, market_price: null, price_source: null, price_updated_at: null,
}

describe('CardConfirmModal', () => {
  it('shows card info after loading', async () => {
    mockGetCardsByNumber.mockResolvedValue([mockCard])
    mockFetchPrice.mockResolvedValue({ price: 12.50, source: 'tcgapi', updated_at: '' })

    render(<CardConfirmModal cardNumber="OP01-001" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Monkey D. Luffy')).toBeInTheDocument()
    })
    expect(screen.getByText(/12.50/)).toBeInTheDocument()
  })

  it('shows VariantPicker when multiple variants', async () => {
    const cardWithVariants: Card = {
      ...mockCard,
      variants: [
        { id: 'v1', name: 'Alternate Art', image_url: 'https://img.com/v1.jpg' },
      ],
    }
    mockGetCardsByNumber.mockResolvedValue([mockCard, cardWithVariants])
    mockFetchPrice.mockResolvedValue(null)

    render(<CardConfirmModal cardNumber="OP01-001" onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/quelle version/i)).toBeInTheDocument()
    })
  })

  it('calls addCard on confirm', async () => {
    mockGetCardsByNumber.mockResolvedValue([mockCard])
    mockFetchPrice.mockResolvedValue(null)
    const onClose = vi.fn()

    render(<CardConfirmModal cardNumber="OP01-001" onClose={onClose} />)

    await waitFor(() => screen.getByText('Monkey D. Luffy'))
    fireEvent.click(screen.getByText('Ajouter à ma collection'))

    expect(mockAddCard).toHaveBeenCalledWith('OP01-001', null)
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/components/scanner/CardConfirmModal.test.tsx
```

Expected: FAIL

- [ ] **Créer `components/scanner/VariantPicker.tsx`**

```typescript
import type { Card } from '@/types'

interface VariantPickerProps {
  cards: Card[]
  onSelect: (card: Card) => void
}

export function VariantPicker({ cards, onSelect }: VariantPickerProps) {
  return (
    <div>
      <p className="text-center text-sm text-gray-500 mb-4">
        Quelle version de la carte possèdes-tu ?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onSelect(card)}
            className="flex flex-col items-center gap-2 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors"
          >
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} className="w-full rounded-lg object-contain max-h-40" />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                Pas d'image
              </div>
            )}
            <span className="text-xs text-center font-medium">{card.name}</span>
            {card.rarity && (
              <span className="text-xs text-gray-500">{card.rarity}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Créer `components/scanner/CardConfirmModal.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getCardsByNumber } from '@/lib/tcgdex'
import { fetchPrice } from '@/lib/pricing'
import { useCollection } from '@/hooks/useCollection'
import { VariantPicker } from './VariantPicker'
import type { Card, PriceData } from '@/types'

interface CardConfirmModalProps {
  cardNumber: string
  onClose: () => void
}

export function CardConfirmModal({ cardNumber, onClose }: CardConfirmModalProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [price, setPrice] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const { addCard } = useCollection()

  const [setId, cardNum] = cardNumber.split('-')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = await getCardsByNumber(setId, cardNum)
      setCards(results)
      if (results.length === 1) {
        setSelectedCard(results[0])
        const p = await fetchPrice(results[0].id)
        setPrice(p)
      }
      setLoading(false)
    }
    load()
  }, [cardNumber])

  const handleSelectCard = async (card: Card) => {
    setSelectedCard(card)
    const p = await fetchPrice(card.id)
    setPrice(p)
  }

  const handleAdd = async () => {
    if (!selectedCard) return
    setAdding(true)
    await addCard(selectedCard.id, null)
    setAdding(false)
    onClose()
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl">
      <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

      {loading && <p className="text-center text-gray-500">Chargement...</p>}

      {!loading && cards.length === 0 && (
        <div className="text-center">
          <p className="text-gray-600 mb-2">Carte introuvable pour {cardNumber}</p>
          <button onClick={onClose} className="text-sm text-blue-600 underline">Fermer</button>
        </div>
      )}

      {!loading && cards.length > 1 && !selectedCard && (
        <VariantPicker cards={cards} onSelect={handleSelectCard} />
      )}

      {selectedCard && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            {selectedCard.image_url ? (
              <img src={selectedCard.image_url} alt={selectedCard.name} className="w-28 rounded-xl shadow" />
            ) : (
              <div className="w-28 h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center">
                Pas d'image
              </div>
            )}
            <div className="flex flex-col gap-1 flex-1">
              <h2 className="font-bold text-lg leading-tight">{selectedCard.name}</h2>
              <p className="text-sm text-gray-500">{selectedCard.set_id} — {cardNumber}</p>
              {selectedCard.rarity && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full w-fit">
                  {selectedCard.rarity}
                </span>
              )}
              {price ? (
                <div className="mt-2">
                  <p className="text-2xl font-bold text-green-600">${price.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    via {price.source}{price.stale ? ' · prix périmé' : ''}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-2">Prix indisponible</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {adding ? 'Ajout...' : 'Ajouter à ma collection'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/components/scanner/CardConfirmModal.test.tsx
```

Expected: PASS

- [ ] **Commit**

```bash
git add components/scanner/ __tests__/components/scanner/
git commit -m "feat: add CardConfirmModal and VariantPicker components"
```

---

## Task 14: Page Collection

**Files:**
- Create: `components/ui/ProgressBar.tsx`
- Create: `components/collection/CardTile.tsx`
- Create: `components/collection/SetSection.tsx`
- Create: `app/(app)/collection/page.tsx`
- Create: `__tests__/components/collection/SetSection.test.tsx`

- [ ] **Écrire le test**

```typescript
// __tests__/components/collection/SetSection.test.tsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { SetSection } from '@/components/collection/SetSection'
import type { CollectionEntry } from '@/types'

const mockEntries: CollectionEntry[] = [
  {
    id: '1', user_id: 'u1', card_id: 'OP01-001', variant_id: null,
    quantity: 1, added_at: '2026-01-01',
    card: {
      id: 'OP01-001', set_id: 'OP01', card_number: 1,
      name: 'Monkey D. Luffy', image_url: null, rarity: 'L',
      variants: null, market_price: 12, price_source: 'tcgapi', price_updated_at: null,
    },
  },
]

describe('SetSection', () => {
  it('renders set name and progress', () => {
    render(
      <SetSection
        setId="OP01"
        setName="Romance Dawn"
        totalCards={121}
        entries={mockEntries}
        onCardTap={vi.fn()}
      />
    )
    expect(screen.getByText('Romance Dawn')).toBeInTheDocument()
    expect(screen.getByText(/1\/121/)).toBeInTheDocument()
  })

  it('shows percentage', () => {
    render(
      <SetSection
        setId="OP01"
        setName="Romance Dawn"
        totalCards={121}
        entries={mockEntries}
        onCardTap={vi.fn()}
      />
    )
    expect(screen.getByText(/0%|1%/)).toBeInTheDocument()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/components/collection/SetSection.test.tsx
```

Expected: FAIL

- [ ] **Créer `components/ui/ProgressBar.tsx`**

```typescript
interface ProgressBarProps {
  value: number  // 0-100
  className?: string
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  return (
    <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-blue-500 rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
```

- [ ] **Créer `components/collection/CardTile.tsx`**

```typescript
import type { CollectionEntry } from '@/types'

interface CardTileProps {
  entry: CollectionEntry
  onTap: (entry: CollectionEntry) => void
}

export function CardTile({ entry, onTap }: CardTileProps) {
  return (
    <button
      onClick={() => onTap(entry)}
      className="relative aspect-[2/3] rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-gray-100"
    >
      {entry.card?.image_url ? (
        <img
          src={entry.card.image_url}
          alt={entry.card.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center">
          {entry.card?.name ?? entry.card_id}
        </div>
      )}
      {entry.quantity > 1 && (
        <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {entry.quantity}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Créer `components/collection/SetSection.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CardTile } from './CardTile'
import type { CollectionEntry } from '@/types'

interface SetSectionProps {
  setId: string
  setName: string
  totalCards: number | null
  entries: CollectionEntry[]
  onCardTap: (entry: CollectionEntry) => void
}

export function SetSection({ setId, setName, totalCards, entries, onCardTap }: SetSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const count = entries.length
  const total = totalCards ?? '?'
  const percent = totalCards ? Math.round((count / totalCards) * 100) : 0

  return (
    <section className="mb-6">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100"
      >
        <div className="text-left">
          <h2 className="font-semibold text-gray-900">{setName}</h2>
          <p className="text-xs text-gray-500">{count}/{total} · {percent}%</p>
        </div>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <>
          <ProgressBar value={percent} className="mx-4 my-2" />
          <div className="grid grid-cols-3 gap-2 px-4 mt-3 md:grid-cols-5">
            {entries.map(entry => (
              <CardTile key={entry.id} entry={entry} onTap={onCardTap} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Créer `app/(app)/collection/page.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useCollection } from '@/hooks/useCollection'
import { SetSection } from '@/components/collection/SetSection'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import type { CollectionEntry } from '@/types'

export default function CollectionPage() {
  const { entries, loading, loadCollection, updateQuantity, removeCard } = useCollection()
  const [selectedEntry, setSelectedEntry] = useState<CollectionEntry | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { loadCollection() }, [loadCollection])

  const filtered = search
    ? entries.filter(e =>
        e.card?.name.toLowerCase().includes(search.toLowerCase()) ||
        e.card_id.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  // Grouper par set
  const bySet = filtered.reduce<Record<string, CollectionEntry[]>>((acc, entry) => {
    const setId = entry.card?.set_id ?? entry.card_id.split('-')[0]
    if (!acc[setId]) acc[setId] = []
    acc[setId].push(entry)
    return acc
  }, {})

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
  }

  return (
    <div>
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <h1 className="text-xl font-bold mb-2">Ma collection</h1>
        <input
          type="search"
          placeholder="Rechercher une carte..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {Object.entries(bySet).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>Ta collection est vide</p>
          <p className="text-sm mt-1">Scanne ta première carte !</p>
        </div>
      ) : (
        Object.entries(bySet).map(([setId, setEntries]) => (
          <SetSection
            key={setId}
            setId={setId}
            setName={setEntries[0]?.card?.set_id ?? setId}
            totalCards={null}
            entries={setEntries}
            onCardTap={setSelectedEntry}
          />
        ))
      )}

      {selectedEntry && (
        <CardDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeCard}
        />
      )}
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/components/collection/SetSection.test.tsx
```

Expected: PASS

- [ ] **Commit**

```bash
git add components/ app/\(app\)/collection/ __tests__/components/collection/
git commit -m "feat: add collection page with set sections and card tiles"
```

---

## Task 15: CardDetailModal

**Files:**
- Create: `components/collection/CardDetailModal.tsx`
- Create: `__tests__/components/collection/CardDetailModal.test.tsx`

- [ ] **Écrire le test**

```typescript
// __tests__/components/collection/CardDetailModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import type { CollectionEntry } from '@/types'

const mockEntry: CollectionEntry = {
  id: 'entry-1', user_id: 'u1', card_id: 'OP01-001', variant_id: null,
  quantity: 2, added_at: '2026-01-01',
  card: {
    id: 'OP01-001', set_id: 'OP01', card_number: 1,
    name: 'Monkey D. Luffy', image_url: null, rarity: 'L',
    variants: null, market_price: 12.50, price_source: 'tcgapi', price_updated_at: null,
  },
}

describe('CardDetailModal', () => {
  it('displays card name and quantity', () => {
    render(<CardDetailModal entry={mockEntry} onClose={vi.fn()} onUpdateQuantity={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Monkey D. Luffy')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onUpdateQuantity when + clicked', () => {
    const onUpdateQuantity = vi.fn()
    render(<CardDetailModal entry={mockEntry} onClose={vi.fn()} onUpdateQuantity={onUpdateQuantity} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByText('+'))
    expect(onUpdateQuantity).toHaveBeenCalledWith('entry-1', 3)
  })

  it('calls onRemove when retirer clicked', () => {
    const onRemove = vi.fn()
    const onClose = vi.fn()
    render(<CardDetailModal entry={mockEntry} onClose={onClose} onUpdateQuantity={vi.fn()} onRemove={onRemove} />)
    fireEvent.click(screen.getByText('Retirer de la collection'))
    expect(onRemove).toHaveBeenCalledWith('entry-1')
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/components/collection/CardDetailModal.test.tsx
```

Expected: FAIL

- [ ] **Créer `components/collection/CardDetailModal.tsx`**

```typescript
import type { CollectionEntry } from '@/types'

interface CardDetailModalProps {
  entry: CollectionEntry
  onClose: () => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export function CardDetailModal({ entry, onClose, onUpdateQuantity, onRemove }: CardDetailModalProps) {
  const { card } = entry

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        <div className="flex gap-4 mb-5">
          {card?.image_url ? (
            <img src={card.image_url} alt={card.name} className="w-24 rounded-xl shadow" />
          ) : (
            <div className="w-24 h-32 bg-gray-100 rounded-xl" />
          )}
          <div className="flex-1">
            <h2 className="font-bold text-lg">{card?.name ?? entry.card_id}</h2>
            <p className="text-sm text-gray-500">{entry.card_id}</p>
            {card?.rarity && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                {card.rarity}
              </span>
            )}
            {card?.market_price && (
              <p className="text-xl font-bold text-green-600 mt-2">
                ${card.market_price.toFixed(2)}
                {card.price_source && (
                  <span className="text-xs text-gray-400 font-normal ml-1">({card.price_source})</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Quantité */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
          <span className="text-sm font-medium text-gray-700">Quantité</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onUpdateQuantity(entry.id, entry.quantity - 1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-xl font-bold"
            >
              -
            </button>
            <span className="text-xl font-bold w-6 text-center">{entry.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(entry.id, entry.quantity + 1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-xl font-bold"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={() => { onRemove(entry.id); onClose() }}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium"
        >
          Retirer de la collection
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/components/collection/CardDetailModal.test.tsx
```

Expected: PASS

- [ ] **Commit**

```bash
git add components/collection/CardDetailModal.tsx __tests__/components/collection/CardDetailModal.test.tsx
git commit -m "feat: add CardDetailModal with quantity controls"
```

---

## Task 16: Page Sets + détail set

**Files:**
- Create: `components/sets/SetList.tsx`
- Create: `app/(app)/sets/page.tsx`
- Create: `app/(app)/sets/[id]/page.tsx`
- Create: `__tests__/components/sets/SetList.test.tsx`

- [ ] **Écrire le test**

```typescript
// __tests__/components/sets/SetList.test.tsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { SetList } from '@/components/sets/SetList'
import type { Set } from '@/types'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

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
    const link = screen.getByRole('link', { name: /romance dawn/i })
    expect(link).toHaveAttribute('href', '/sets/OP01')
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/components/sets/SetList.test.tsx
```

Expected: FAIL

- [ ] **Créer `components/sets/SetList.tsx`**

```typescript
import Link from 'next/link'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Set } from '@/types'

interface SetListProps {
  sets: Set[]
  collectionCounts: Record<string, number>
}

export function SetList({ sets, collectionCounts }: SetListProps) {
  return (
    <div className="divide-y divide-gray-100">
      {sets.map(set => {
        const count = collectionCounts[set.id] ?? 0
        const total = set.total_cards ?? 0
        const percent = total ? Math.round((count / total) * 100) : 0

        return (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
            aria-label={set.name}
          >
            {set.logo_url ? (
              <img src={set.logo_url} alt={set.name} className="w-12 h-12 object-contain rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                {set.id}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{set.name}</p>
              <p className="text-xs text-gray-500 mb-1">
                {count}/{total ?? '?'} · {percent}%
              </p>
              <ProgressBar value={percent} />
            </div>

            <span className="text-gray-300">›</span>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Créer `app/(app)/sets/page.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getSets } from '@/lib/tcgdex'
import { useCollection } from '@/hooks/useCollection'
import { SetList } from '@/components/sets/SetList'
import type { Set } from '@/types'

export default function SetsPage() {
  const [sets, setSets] = useState<Set[]>([])
  const [loading, setLoading] = useState(true)
  const { entries, loadCollection } = useCollection()

  useEffect(() => {
    async function load() {
      const [fetchedSets] = await Promise.all([getSets(), loadCollection()])
      setSets(fetchedSets.sort((a, b) =>
        (b.release_date ?? '').localeCompare(a.release_date ?? '')
      ))
      setLoading(false)
    }
    load()
  }, [])

  const collectionCounts = entries.reduce<Record<string, number>>((acc, entry) => {
    const setId = entry.card?.set_id ?? entry.card_id.split('-')[0]
    acc[setId] = (acc[setId] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold">Extensions</h1>
        <p className="text-sm text-gray-500">{sets.length} sets disponibles</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
      ) : (
        <SetList sets={sets} collectionCounts={collectionCounts} />
      )}
    </div>
  )
}
```

- [ ] **Créer `app/(app)/sets/[id]/page.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getCardsByNumber } from '@/lib/tcgdex'
import { useCollection } from '@/hooks/useCollection'
import type { Card, CollectionEntry } from '@/types'

export default function SetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const { entries, loadCollection } = useCollection()

  useEffect(() => {
    async function load() {
      await loadCollection()
      // Charger toutes les cartes du set via TCGDex
      // TCGDex retourne les cartes paginées par set
      const res = await fetch(`https://api.tcgdex.net/v2/en/sets/${id}/cards`)
      if (res.ok) {
        const data = await res.json()
        setAllCards(data)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const ownedIds = new Set(entries.map(e => e.card_id))
  const ownedEntryMap = entries.reduce<Record<string, CollectionEntry>>((acc, e) => {
    acc[e.card_id] = e
    return acc
  }, {})

  const ownedCount = allCards.filter(c => ownedIds.has(c.id)).length

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
  }

  return (
    <div>
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold">{id}</h1>
        <p className="text-sm text-gray-500">{ownedCount}/{allCards.length}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 md:grid-cols-5">
        {allCards.map(card => {
          const owned = ownedIds.has(card.id)
          return (
            <div
              key={card.id}
              className={`relative aspect-[2/3] rounded-xl overflow-hidden border ${
                owned ? 'border-blue-400' : 'border-gray-200 opacity-40 grayscale'
              }`}
            >
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs p-1 text-center">
                  {card.id}
                </div>
              )}
              {owned && ownedEntryMap[card.id]?.quantity > 1 && (
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {ownedEntryMap[card.id].quantity}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/components/sets/SetList.test.tsx
```

Expected: PASS

- [ ] **Commit**

```bash
git add components/sets/ app/\(app\)/sets/ __tests__/components/sets/
git commit -m "feat: add sets list and set detail pages"
```

---

## Task 17: Page Profil

**Files:**
- Create: `app/(app)/profile/page.tsx`
- Create: `__tests__/app/profile.test.tsx`

- [ ] **Écrire le test**

```typescript
// __tests__/app/profile.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

const mockSignOut = vi.fn().mockResolvedValue({})
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } } })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: mockSignOut, getUser: mockGetUser },
  }),
}))

vi.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({
    entries: [
      { id: '1', card_id: 'OP01-001', quantity: 1, card: { market_price: 10 } },
      { id: '2', card_id: 'OP01-002', quantity: 2, card: { market_price: 5 } },
    ],
    loadCollection: vi.fn(),
  }),
}))

import ProfilePage from '@/app/(app)/profile/page'

describe('ProfilePage', () => {
  it('shows total card count', async () => {
    render(<ProfilePage />)
    await waitFor(() => {
      expect(screen.getByText(/3 cartes/i)).toBeInTheDocument()
    })
  })

  it('shows total collection value', async () => {
    render(<ProfilePage />)
    await waitFor(() => {
      // 1×10 + 2×5 = 20
      expect(screen.getByText(/\$20/i)).toBeInTheDocument()
    })
  })

  it('calls signOut on button click', async () => {
    render(<ProfilePage />)
    fireEvent.click(screen.getByText(/déconnexion/i))
    expect(mockSignOut).toHaveBeenCalled()
  })
})
```

- [ ] **Vérifier que le test échoue**

```bash
npm run test:run -- __tests__/app/profile.test.tsx
```

Expected: FAIL

- [ ] **Créer `app/(app)/profile/page.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCollection } from '@/hooks/useCollection'

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const { entries, loadCollection } = useCollection()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    loadCollection()
  }, [])

  const totalCards = entries.reduce((sum, e) => sum + e.quantity, 0)
  const totalValue = entries.reduce((sum, e) => sum + ((e.card?.market_price ?? 0) * e.quantity), 0)
  const uniqueSets = new Set(entries.map(e => e.card?.set_id ?? e.card_id.split('-')[0])).size

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">Profil</h1>

      {email && (
        <p className="text-sm text-gray-500 mb-6">{email}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-3xl font-bold text-blue-600">{totalCards}</p>
          <p className="text-sm text-gray-500 mt-1">{totalCards} cartes</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-3xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Valeur estimée</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 col-span-2">
          <p className="text-3xl font-bold text-purple-600">{uniqueSets}</p>
          <p className="text-sm text-gray-500 mt-1">Sets entamés</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium"
      >
        Déconnexion
      </button>
    </div>
  )
}
```

- [ ] **Vérifier que les tests passent**

```bash
npm run test:run -- __tests__/app/profile.test.tsx
```

Expected: PASS

- [ ] **Lancer la suite complète de tests**

```bash
npm run test:run
```

Expected: toutes les suites PASS

- [ ] **Commit final**

```bash
git add app/\(app\)/profile/ __tests__/app/profile.test.tsx
git commit -m "feat: add profile page with collection stats and sign out"
```

---

## Self-Review

**Couverture spec :**
- Scan + OCR + variantes : Tasks 10, 12, 13
- Auth (Google, Discord, email) : Tasks 5, 6
- DB + RLS : Task 4
- Collection CRUD : Tasks 11, 14, 15
- Sets + progression : Task 16
- Pricing primaire + fallback : Task 9
- PWA : Task 1 (`next-pwa`)
- Profile + valeur totale : Task 17

**Aucun placeholder ni TBD.**

**Cohérence des types :**
- `CollectionEntry.card` est `Card | undefined` (jointure optionnelle) — utilisé de manière cohérente dans CardTile, CardDetailModal, ProfilePage avec optional chaining (`entry.card?.name`).
- `fetchPrice` retourne `PriceData | null` — géré avec vérification `if (price)` dans CardConfirmModal.
- `recognizeCardNumber` retourne `ScanResult | null` — géré dans `processImage` du hook useScanner.
