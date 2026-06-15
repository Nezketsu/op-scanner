# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign toute l'app OP Scanner avec la police Outfit, une palette indigo/slate, des icônes Lucide, des filtres/tri dans la collection, et un profil dark header.

**Architecture:** Chaque composant UI est modifié indépendamment. La logique de filtre/tri est extraite dans `lib/collection-filters.ts` pour être testable. Aucune modification des hooks, API calls, ou types.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Vitest 4, `lucide-react`, `next/font/google` (Outfit)

> ⚠️ **IMPORTANT:** Ce projet utilise **Tailwind CSS v4** — la config est dans `app/globals.css` via `@theme`, pas dans `tailwind.config.js`. Lire `node_modules/next/dist/docs/` si une API Next.js semble différente de ce que tu connais.

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `package.json` | + `lucide-react` |
| `app/layout.tsx` | Outfit font à la place d'Inter |
| `app/globals.css` | `bg-slate-50` sur body, plus besoin de Inter |
| `lib/collection-filters.ts` | **Créer** — logique filtre/tri pure |
| `__tests__/lib/collection-filters.test.ts` | **Créer** — tests unitaires |
| `components/ui/ProgressBar.tsx` | Couleur indigo, épaisseur ajustable |
| `components/ui/BottomNav.tsx` | Lucide icons, pilule active |
| `components/scanner/Viewfinder.tsx` | Viseur centré, coins indigo, bouton indigo |
| `components/scanner/CardConfirmModal.tsx` | Redesign complet |
| `components/scanner/VariantPicker.tsx` | Palette indigo |
| `components/collection/CardTile.tsx` | Pointillé au lieu de grayscale |
| `components/collection/SetSection.tsx` | Valeur par set, grille 4 cols |
| `components/collection/CardDetailModal.tsx` | Palette indigo/slate |
| `components/sets/SetList.tsx` | Palette indigo/slate |
| `app/(app)/scan/page.tsx` | Overlays erreur/scan, panel saisie |
| `app/(app)/collection/page.tsx` | Chips filtres, dropdown tri, skeleton, empty state |
| `app/(app)/sets/[id]/page.tsx` | Bouton retour, header, cards cliquables |
| `app/(app)/profile/page.tsx` | Dark header, stats, sets progression |

---

## Task 1: Installer lucide-react + passer à Outfit

**Files:**
- Modify: `package.json`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Installer lucide-react**

```bash
npm install lucide-react
```

Expected: `lucide-react` apparaît dans `package.json` dependencies.

- [ ] **Step 2: Remplacer Inter par Outfit dans layout.tsx**

Remplacer tout le contenu de `app/layout.tsx` :

```tsx
import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'OP Scanner',
  description: 'Scanner et classeur One Piece TCG',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={outfit.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Mettre à jour globals.css**

Remplacer tout le contenu de `app/globals.css` :

```css
@import "tailwindcss";

body {
  background-color: #f8fafc;
  color: #1e293b;
}
```

- [ ] **Step 4: Vérifier que le build passe**

```bash
npm run build
```

Expected: build sans erreur. Si erreur sur `Outfit` : vérifier que la font existe bien sur Google Fonts (elle existe — poids 400-800 disponibles).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app/layout.tsx app/globals.css
git commit -m "feat: install lucide-react, switch font to Outfit"
```

---

## Task 2: ProgressBar

**Files:**
- Modify: `components/ui/ProgressBar.tsx`

- [ ] **Step 1: Mettre à jour ProgressBar**

```tsx
interface ProgressBarProps {
  value: number
  className?: string
  thick?: boolean
}

export function ProgressBar({ value, className = '', thick = false }: ProgressBarProps) {
  const h = thick ? 'h-1.5' : 'h-0.75'
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`${h} bg-slate-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-indigo-500 rounded-full transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Vérifier visuellement (optionnel — ProgressBar est testé par ses usages)**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/ProgressBar.tsx
git commit -m "feat: update ProgressBar to indigo palette with thick variant"
```

---

## Task 3: BottomNav avec icônes Lucide

**Files:**
- Modify: `components/ui/BottomNav.tsx`

- [ ] **Step 1: Réécrire BottomNav**

```tsx
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
```

- [ ] **Step 2: Vérifier le test existant**

```bash
npm run test:run -- __tests__/components/BottomNav.test.tsx
```

Expected: PASS. Si le test vérifie les emojis par texte, le mettre à jour pour chercher les labels texte ("Scanner", "Collection", etc.) plutôt que les caractères emoji.

- [ ] **Step 3: Commit**

```bash
git add components/ui/BottomNav.tsx
git commit -m "feat: BottomNav with Lucide icons and active pill state"
```

---

## Task 4: CardTile — non-possédé en pointillé

**Files:**
- Modify: `components/collection/CardTile.tsx`

- [ ] **Step 1: Mettre à jour CardTile**

```tsx
import type { CollectionEntry, Card } from '@/types'

interface CardTileProps {
  card: Card
  entry?: CollectionEntry
  onTap: (entry: CollectionEntry) => void
}

export function CardTile({ card, entry, onTap }: CardTileProps) {
  const owned = !!entry

  return (
    <button
      onClick={() => entry && onTap(entry)}
      disabled={!owned}
      className={`relative aspect-2/3 rounded-xl overflow-hidden transition-colors ${
        owned
          ? 'border border-slate-200 hover:border-indigo-400 cursor-pointer bg-slate-100'
          : 'border border-dashed border-slate-200 cursor-default bg-slate-50'
      }`}
    >
      {card.image_url ? (
        <img
          src={card.image_url}
          alt={card.name}
          className={`w-full h-full object-cover ${!owned ? 'opacity-0' : ''}`}
          loading="lazy"
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center text-xs p-2 text-center ${
          owned ? 'text-slate-400' : 'text-slate-200'
        }`}>
          {owned ? (card.name ?? card.id) : '—'}
        </div>
      )}
      {owned && entry!.quantity > 1 && (
        <span className="absolute top-1 right-1 bg-indigo-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {entry!.quantity}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/collection/CardTile.tsx
git commit -m "feat: CardTile non-owned uses dashed border instead of grayscale"
```

---

## Task 5: Viewfinder redesign

**Files:**
- Modify: `components/scanner/Viewfinder.tsx`

- [ ] **Step 1: Réécrire Viewfinder**

```tsx
'use client'
import { RefObject } from 'react'
import { Camera } from 'lucide-react'

interface ViewfinderProps {
  videoRef: RefObject<HTMLVideoElement | null>
  onCapture: () => void
}

export function Viewfinder({ videoRef, onCapture }: ViewfinderProps) {
  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-6">
      {/* Flux vidéo en fond */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay sombre autour du viseur */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Texte + viseur centrés */}
      <div className="relative flex flex-col items-center gap-3 pointer-events-none">
        <p className="text-white/70 text-sm font-medium">
          Scanne le code de la carte
        </p>
        <p className="text-white/40 text-xs -mt-2">
          ex : OP01-001, ST01-002
        </p>

        {/* Cadre viseur */}
        <div className="relative w-64 h-20">
          {/* Coins indigo */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-indigo-500 rounded-tl-md" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-indigo-500 rounded-tr-md" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-indigo-500 rounded-bl-md" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-indigo-500 rounded-br-md" />
        </div>
      </div>

      {/* Bouton capture — au-dessus du panel saisie */}
      <button
        onClick={onCapture}
        className="relative z-10 w-14 h-14 rounded-full bg-indigo-500 border-2 border-white/30 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="Capturer"
      >
        <Camera size={22} strokeWidth={2} className="text-white" />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/scanner/Viewfinder.tsx
git commit -m "feat: Viewfinder centered frame with indigo corners and capture button"
```

---

## Task 6: VariantPicker styles

**Files:**
- Modify: `components/scanner/VariantPicker.tsx`

- [ ] **Step 1: Mettre à jour les styles**

```tsx
import type { Card } from '@/types'

interface VariantPickerProps {
  cards: Card[]
  onSelect: (card: Card) => void
}

export function VariantPicker({ cards, onSelect }: VariantPickerProps) {
  return (
    <div>
      <p className="text-center text-sm text-slate-500 mb-4 font-medium">
        Quelle version de la carte possèdes-tu ?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onSelect(card)}
            className="flex flex-col items-center gap-2 p-3 border-2 border-slate-200 rounded-xl hover:border-indigo-500 active:border-indigo-500 transition-colors"
          >
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                className="w-full rounded-lg object-contain max-h-40"
              />
            ) : (
              <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                Pas d'image
              </div>
            )}
            <span className="text-xs text-center font-semibold text-slate-700">{card.name}</span>
            {card.rarity && (
              <span className="text-xs text-slate-400">{card.rarity}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/scanner/VariantPicker.tsx
git commit -m "feat: VariantPicker indigo/slate palette"
```

---

## Task 7: CardConfirmModal redesign

**Files:**
- Modify: `components/scanner/CardConfirmModal.tsx`

- [ ] **Step 1: Réécrire CardConfirmModal**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { getCardsByNumber } from '@/lib/optcgapi'
import { useCollection } from '@/hooks/useCollection'
import { VariantPicker } from './VariantPicker'
import type { Card } from '@/types'

interface CardConfirmModalProps {
  cardNumber: string
  onClose: () => void
}

const RARITY_COLORS: Record<string, string> = {
  'Leader': 'bg-amber-100 text-amber-700',
  'Super Rare': 'bg-purple-100 text-purple-700',
  'Secret Rare': 'bg-red-100 text-red-600',
  'Rare': 'bg-blue-100 text-blue-700',
  'Uncommon': 'bg-slate-100 text-slate-600',
  'Common': 'bg-slate-100 text-slate-500',
}

export function CardConfirmModal({ cardNumber, onClose }: CardConfirmModalProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addCard } = useCollection()

  const [setId, cardNum] = cardNumber.split('-')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = await getCardsByNumber(setId, cardNum)
      setCards(results)
      if (results.length === 1) setSelectedCard(results[0])
      setLoading(false)
    }
    load()
  }, [cardNumber])

  const handleAdd = async () => {
    if (!selectedCard) return
    setAdding(true)
    setError(null)
    const result = await addCard(selectedCard, null)
    setAdding(false)
    if (result?.error) {
      setError('Impossible d\'ajouter la carte. Réessaie.')
      return
    }
    onClose()
  }

  const rarityClass = selectedCard?.rarity
    ? (RARITY_COLORS[selectedCard.rarity] ?? 'bg-slate-100 text-slate-500')
    : ''

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 pb-24 max-h-[85vh] overflow-y-auto shadow-2xl z-60">
      {/* Handle */}
      <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="flex gap-4">
            <div className="w-28 h-40 bg-slate-200 rounded-xl" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-6 bg-slate-200 rounded w-1/3 mt-4" />
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-500 text-center font-medium">{error}</p>
      )}

      {!loading && cards.length === 0 && (
        <div className="text-center py-4">
          <p className="text-slate-600 mb-3 font-medium">Carte introuvable pour {cardNumber}</p>
          <button onClick={onClose} className="text-sm text-indigo-500 font-semibold">
            Fermer
          </button>
        </div>
      )}

      {!loading && cards.length > 1 && !selectedCard && (
        <VariantPicker cards={cards} onSelect={setSelectedCard} />
      )}

      {selectedCard && (
        <div className="flex flex-col gap-5">
          <div className="flex gap-4">
            {selectedCard.image_url ? (
              <img
                src={selectedCard.image_url}
                alt={selectedCard.name}
                className="w-28 rounded-xl shadow-md"
              />
            ) : (
              <div className="w-28 h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-2">
                Pas d'image
              </div>
            )}
            <div className="flex flex-col gap-1.5 flex-1">
              <h2 className="font-bold text-lg text-slate-900 leading-tight">
                {selectedCard.name}
              </h2>
              <p className="text-sm text-slate-400">
                {selectedCard.set_id} · {cardNumber}
              </p>
              {selectedCard.rarity && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit ${rarityClass}`}>
                  {selectedCard.rarity}
                </span>
              )}
              <div className="mt-2">
                {selectedCard.market_price ? (
                  <>
                    <p className="text-2xl font-bold text-green-500">
                      ${selectedCard.market_price.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">TCGPlayer market price</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Prix indisponible</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {adding ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/scanner/CardConfirmModal.tsx
git commit -m "feat: CardConfirmModal full redesign with skeleton and rarity colors"
```

---

## Task 8: Scan page — overlays et panel saisie

**Files:**
- Modify: `app/(app)/scan/page.tsx`

- [ ] **Step 1: Mettre à jour scan/page.tsx**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Viewfinder } from '@/components/scanner/Viewfinder'
import { CardConfirmModal } from '@/components/scanner/CardConfirmModal'
import { useScanner } from '@/hooks/useScanner'

const CARD_FORMAT = /^[A-Z]{1,3}\d{1,2}-\d{3}[a-z]?$/i

export default function ScanPage() {
  const { videoRef, startCamera, stopCamera, captureFrame, processImage, scanResult, scanning, error, reset } = useScanner()
  const [manualInput, setManualInput] = useState('')
  const [activeCard, setActiveCard] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const handleCapture = async () => {
    const frame = captureFrame()
    if (frame) await processImage(frame)
  }

  useEffect(() => {
    if (scanResult?.cardNumber) {
      setManualInput(scanResult.cardNumber)
      setActiveCard(scanResult.cardNumber)
    }
  }, [scanResult])

  const handleManualSearch = () => {
    const trimmed = manualInput.trim().toUpperCase()
    if (CARD_FORMAT.test(trimmed)) setActiveCard(trimmed)
  }

  const handleClose = () => {
    reset()
    setActiveCard(null)
    setManualInput('')
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900">
      {/* Zone caméra */}
      <div className="flex-1 relative min-h-0">
        <Viewfinder videoRef={videoRef} onCapture={handleCapture} />

        {/* Overlay scanning */}
        {scanning && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
            <div className="bg-white px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 shadow-lg">
              Analyse en cours...
            </div>
          </div>
        )}

        {/* Overlay erreur — discret, sans stack trace */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-slate-800/90 text-white px-4 py-3 rounded-xl text-sm font-medium">
            Carte non reconnue. Réessaie ou saisis le code manuellement.
          </div>
        )}
      </div>

      {/* Panel saisie manuelle */}
      <div className="bg-white border-t border-slate-200 px-4 pt-3 pb-6">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Saisie manuelle
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="OP01-001"
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={handleManualSearch}
            disabled={!CARD_FORMAT.test(manualInput.trim())}
            className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40"
          >
            OK
          </button>
        </div>
      </div>

      {activeCard && (
        <CardConfirmModal cardNumber={activeCard} onClose={handleClose} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/scan/page.tsx
git commit -m "feat: scan page overlays and manual input panel redesign"
```

---

## Task 9: Logique filtre/tri collection (TDD)

**Files:**
- Create: `lib/collection-filters.ts`
- Create: `__tests__/lib/collection-filters.test.ts`

- [ ] **Step 1: Écrire les tests**

Créer `__tests__/lib/collection-filters.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { filterEntries, sortEntries, RARITY_ORDER } from '@/lib/collection-filters'
import type { CollectionEntry } from '@/types'

const makeEntry = (overrides: Partial<CollectionEntry> & { rarity?: string; price?: number; name?: string }): CollectionEntry => ({
  id: 'e1',
  user_id: 'u1',
  card_id: 'OP01-001',
  variant_id: null,
  quantity: 1,
  added_at: '2024-01-01',
  card: {
    id: 'OP01-001',
    set_id: 'OP01',
    card_number: 1,
    name: overrides.name ?? 'Test Card',
    image_url: null,
    rarity: overrides.rarity ?? null,
    variants: null,
    market_price: overrides.price ?? null,
    price_source: null,
    price_updated_at: null,
  },
  ...overrides,
})

describe('filterEntries', () => {
  const entries = [
    makeEntry({ card_id: 'OP01-001', rarity: 'Leader', name: 'Luffy' }),
    makeEntry({ card_id: 'OP01-002', rarity: 'Super Rare', name: 'Zoro' }),
    makeEntry({ card_id: 'OP01-003', rarity: 'Common', name: 'Nami' }),
  ]

  it('returns all entries when rarity is null', () => {
    expect(filterEntries(entries, null)).toHaveLength(3)
  })

  it('filters by rarity', () => {
    const result = filterEntries(entries, 'Leader')
    expect(result).toHaveLength(1)
    expect(result[0].card?.name).toBe('Luffy')
  })

  it('returns empty when no match', () => {
    expect(filterEntries(entries, 'Secret Rare')).toHaveLength(0)
  })
})

describe('sortEntries', () => {
  const entries = [
    makeEntry({ card_id: 'OP01-003', name: 'Nami', price: 5, rarity: 'Common' }),
    makeEntry({ card_id: 'OP01-001', name: 'Luffy', price: 25, rarity: 'Leader' }),
    makeEntry({ card_id: 'OP01-002', name: 'Zoro', price: 15, rarity: 'Super Rare' }),
  ]

  it('sorts by value descending', () => {
    const result = sortEntries(entries, 'value-desc')
    expect(result.map(e => e.card?.name)).toEqual(['Luffy', 'Zoro', 'Nami'])
  })

  it('sorts by value ascending', () => {
    const result = sortEntries(entries, 'value-asc')
    expect(result.map(e => e.card?.name)).toEqual(['Nami', 'Zoro', 'Luffy'])
  })

  it('sorts by name a-z', () => {
    const result = sortEntries(entries, 'name-asc')
    expect(result.map(e => e.card?.name)).toEqual(['Luffy', 'Nami', 'Zoro'])
  })

  it('sorts by rarity (Secret Rare first, Common last)', () => {
    const rarityEntries = [
      makeEntry({ card_id: 'a', name: 'A', rarity: 'Common' }),
      makeEntry({ card_id: 'b', name: 'B', rarity: 'Super Rare' }),
      makeEntry({ card_id: 'c', name: 'C', rarity: 'Secret Rare' }),
      makeEntry({ card_id: 'd', name: 'D', rarity: 'Leader' }),
    ]
    const result = sortEntries(rarityEntries, 'rarity')
    expect(result.map(e => e.card?.rarity)).toEqual(['Secret Rare', 'Super Rare', 'Common', 'Leader'])
  })

  it('treats null price as 0 for value sort', () => {
    const withNull = [
      makeEntry({ card_id: 'a', name: 'A', price: undefined }),
      makeEntry({ card_id: 'b', name: 'B', price: 10 }),
    ]
    const result = sortEntries(withNull, 'value-desc')
    expect(result[0].card?.name).toBe('B')
  })
})

describe('RARITY_ORDER', () => {
  it('Secret Rare has lower index than Common', () => {
    expect(RARITY_ORDER.indexOf('Secret Rare')).toBeLessThan(RARITY_ORDER.indexOf('Common'))
  })
})
```

- [ ] **Step 2: Lancer les tests — vérifier qu'ils échouent**

```bash
npm run test:run -- __tests__/lib/collection-filters.test.ts
```

Expected: FAIL avec "Cannot find module '@/lib/collection-filters'"

- [ ] **Step 3: Implémenter collection-filters.ts**

Créer `lib/collection-filters.ts` :

```ts
import type { CollectionEntry } from '@/types'

export const RARITY_ORDER = [
  'Secret Rare',
  'Super Rare',
  'Rare',
  'Uncommon',
  'Common',
  'Leader',
]

export type SortMode = 'value-desc' | 'value-asc' | 'name-asc' | 'rarity'

export function filterEntries(
  entries: CollectionEntry[],
  rarity: string | null
): CollectionEntry[] {
  if (!rarity) return entries
  return entries.filter(e => e.card?.rarity === rarity)
}

export function sortEntries(
  entries: CollectionEntry[],
  mode: SortMode
): CollectionEntry[] {
  const copy = [...entries]
  switch (mode) {
    case 'value-desc':
      return copy.sort((a, b) =>
        (b.card?.market_price ?? 0) * b.quantity - (a.card?.market_price ?? 0) * a.quantity
      )
    case 'value-asc':
      return copy.sort((a, b) =>
        (a.card?.market_price ?? 0) * a.quantity - (b.card?.market_price ?? 0) * b.quantity
      )
    case 'name-asc':
      return copy.sort((a, b) =>
        (a.card?.name ?? a.card_id).localeCompare(b.card?.name ?? b.card_id)
      )
    case 'rarity': {
      return copy.sort((a, b) => {
        const ai = RARITY_ORDER.indexOf(a.card?.rarity ?? '')
        const bi = RARITY_ORDER.indexOf(b.card?.rarity ?? '')
        const aIdx = ai === -1 ? RARITY_ORDER.length : ai
        const bIdx = bi === -1 ? RARITY_ORDER.length : bi
        return aIdx - bIdx
      })
    }
  }
}
```

- [ ] **Step 4: Relancer les tests — vérifier qu'ils passent**

```bash
npm run test:run -- __tests__/lib/collection-filters.test.ts
```

Expected: PASS (toutes les assertions vertes)

- [ ] **Step 5: Commit**

```bash
git add lib/collection-filters.ts __tests__/lib/collection-filters.test.ts
git commit -m "feat: collection filter/sort logic with tests"
```

---

## Task 10: SetSection redesign

**Files:**
- Modify: `components/collection/SetSection.tsx`

- [ ] **Step 1: Réécrire SetSection**

```tsx
'use client'
import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CardTile } from './CardTile'
import type { CollectionEntry, Card } from '@/types'

interface SetSectionProps {
  setId: string
  setName: string
  allCards: Card[]
  entries: CollectionEntry[]
  onCardTap: (entry: CollectionEntry) => void
}

export function SetSection({ setName, allCards, entries, onCardTap }: SetSectionProps) {
  const [expanded, setExpanded] = useState(true)

  const ownedMap = new Map(entries.map(e => [e.card_id, e]))
  const count = entries.length
  const total = allCards.length || '?'
  const percent = allCards.length ? Math.round((count / allCards.length) * 100) : 0
  const totalValue = entries.reduce((sum, e) => sum + (e.card?.market_price ?? 0) * e.quantity, 0)

  return (
    <section className="mb-2">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100"
      >
        <div className="text-left">
          <h2 className="font-bold text-slate-900">{setName}</h2>
          <p className="text-xs text-slate-400">{count}/{total} · {percent}%</p>
        </div>
        <div className="flex items-center gap-2">
          {totalValue > 0 && (
            <span className="text-sm font-semibold text-green-500">
              ${totalValue.toFixed(2)}
            </span>
          )}
          {expanded
            ? <ChevronUp size={16} className="text-slate-300" />
            : <ChevronDown size={16} className="text-slate-300" />
          }
        </div>
      </button>

      {expanded && (
        <>
          <ProgressBar value={percent} className="mx-4 my-2" />
          <div className="grid grid-cols-4 gap-1.5 px-4 mt-2 pb-3 md:grid-cols-6">
            {allCards.map(card => (
              <CardTile
                key={card.id}
                card={card}
                entry={ownedMap.get(card.id)}
                onTap={onCardTap}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/collection/SetSection.tsx
git commit -m "feat: SetSection with value display, 4-col grid, Lucide chevrons"
```

---

## Task 11: Collection page — chips filtres, tri, skeleton, empty state

**Files:**
- Modify: `app/(app)/collection/page.tsx`

- [ ] **Step 1: Réécrire collection/page.tsx**

```tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { getCardsBySet } from '@/lib/optcgapi'
import { filterEntries, sortEntries, type SortMode } from '@/lib/collection-filters'
import { SetSection } from '@/components/collection/SetSection'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import type { CollectionEntry, Card } from '@/types'

const RARITIES = ['Leader', 'Super Rare', 'Secret Rare', 'Rare', 'Uncommon', 'Common']

const RARITY_DOT: Record<string, string> = {
  'Leader': 'bg-amber-400',
  'Super Rare': 'bg-purple-400',
  'Secret Rare': 'bg-red-400',
}

const SORT_LABELS: Record<SortMode, string> = {
  'value-desc': 'Valeur ↓',
  'value-asc': 'Valeur ↑',
  'name-asc': 'Nom A→Z',
  'rarity': 'Rareté',
}

export default function CollectionPage() {
  const { entries, loading, loadCollection, updateQuantity, removeCard } = useCollection()
  const [selectedEntry, setSelectedEntry] = useState<CollectionEntry | null>(null)
  const [search, setSearch] = useState('')
  const [activeRarity, setActiveRarity] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('value-desc')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [setCards, setSetCards] = useState<Record<string, Card[]>>({})
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadCollection() }, [loadCollection])

  // Fermer le menu tri en cliquant ailleurs
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (entries.length === 0) return
    const setIds = [...new Set(entries.map(e => e.card?.set_id ?? e.card_id.split('-')[0]))]
    const missing = setIds.filter(id => !setCards[id])
    if (missing.length === 0) return
    Promise.all(
      missing.map(async setId => {
        const cards = await getCardsBySet(setId)
        return [setId, cards] as const
      })
    ).then(results => {
      setSetCards(prev => {
        const next = { ...prev }
        for (const [setId, cards] of results) next[setId] = cards
        return next
      })
    })
  }, [entries])

  const processed = sortEntries(
    filterEntries(
      search
        ? entries.filter(e =>
            e.card?.name.toLowerCase().includes(search.toLowerCase()) ||
            e.card_id.toLowerCase().includes(search.toLowerCase())
          )
        : entries,
      activeRarity
    ),
    sortMode
  )

  const bySet = processed.reduce<Record<string, CollectionEntry[]>>((acc, entry) => {
    const setId = entry.card?.set_id ?? entry.card_id.split('-')[0]
    if (!acc[setId]) acc[setId] = []
    acc[setId].push(entry)
    return acc
  }, {})

  return (
    <div>
      {/* Header sticky */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 pt-4 pb-3 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-extrabold text-slate-900">Ma collection</h1>
          {/* Dropdown tri */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setShowSortMenu(v => !v)}
              className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600"
            >
              <SlidersHorizontal size={13} strokeWidth={2.5} />
              {SORT_LABELS[sortMode]}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-35 overflow-hidden">
                {(Object.entries(SORT_LABELS) as [SortMode, string][]).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => { setSortMode(mode); setShowSortMenu(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                      sortMode === mode
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Barre recherche */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 mb-3">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="search"
            placeholder="Rechercher une carte..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Chips rareté */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveRarity(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeRarity === null
                ? 'bg-indigo-500 text-white'
                : 'bg-white border border-slate-200 text-slate-500'
            }`}
          >
            Tout
          </button>
          {RARITIES.map(r => (
            <button
              key={r}
              onClick={() => setActiveRarity(activeRarity === r ? null : r)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeRarity === r
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-500'
              }`}
            >
              {RARITY_DOT[r] && activeRarity !== r && (
                <span className={`w-1.5 h-1.5 rounded-full ${RARITY_DOT[r]}`} />
              )}
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="grid grid-cols-4 gap-1.5 px-4 pt-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="aspect-2/3 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : Object.entries(bySet).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 px-8 text-center">
          <BookOpenIcon />
          <p className="font-semibold text-slate-500">Ta collection est vide</p>
          <p className="text-sm text-slate-400">Scanne ta première carte pour commencer</p>
          <a
            href="/scan"
            className="mt-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold"
          >
            Scanner maintenant
          </a>
        </div>
      ) : (
        Object.entries(bySet).map(([setId, setEntries]) => (
          <SetSection
            key={setId}
            setId={setId}
            setName={setEntries[0]?.card?.set_id ?? setId}
            allCards={setCards[setId] ?? setEntries.map(e => e.card!).filter(Boolean)}
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

function BookOpenIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/collection/page.tsx
git commit -m "feat: collection page with rarity chips, sort dropdown, skeleton and empty state"
```

---

## Task 12: SetList styles

**Files:**
- Modify: `components/sets/SetList.tsx`

- [ ] **Step 1: Mettre à jour SetList**

```tsx
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Set } from '@/types'

interface SetListProps {
  sets: Set[]
  collectionCounts: Record<string, number>
}

export function SetList({ sets, collectionCounts }: SetListProps) {
  return (
    <div className="divide-y divide-slate-100">
      {sets.map(set => {
        const count = collectionCounts[set.id] ?? 0
        const total = set.total_cards ?? 0
        const percent = total ? Math.round((count / total) * 100) : 0

        return (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50 transition-colors"
          >
            {set.logo_url ? (
              <img src={set.logo_url} alt={set.name} className="w-12 h-12 object-contain rounded-lg shrink-0" />
            ) : (
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 font-bold text-xs shrink-0">
                {set.id}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{set.name}</p>
              <p className="text-xs text-slate-400 mb-1.5">{count}/{total || '?'} · {percent}%</p>
              <ProgressBar value={percent} />
            </div>
            <ChevronRight size={16} className="text-slate-300 shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sets/SetList.tsx
git commit -m "feat: SetList with Lucide chevron and indigo palette"
```

---

## Task 13: Set Detail page redesign

**Files:**
- Modify: `app/(app)/sets/[id]/page.tsx`

- [ ] **Step 1: Réécrire sets/[id]/page.tsx**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { getCardsBySet } from '@/lib/optcgapi'
import { CardDetailModal } from '@/components/collection/CardDetailModal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Card, CollectionEntry } from '@/types'

export default function SetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<CollectionEntry | null>(null)
  const { entries, loadCollection, updateQuantity, removeCard } = useCollection()

  useEffect(() => {
    async function load() {
      await loadCollection()
      const cards = await getCardsBySet(id)
      setAllCards(cards)
      setLoading(false)
    }
    load()
  }, [id])

  const ownedEntryMap = entries.reduce<Record<string, CollectionEntry>>((acc, e) => {
    acc[e.card_id] = e
    return acc
  }, {})
  const ownedCount = allCards.filter(c => ownedEntryMap[c.id]).length
  const percent = allCards.length ? Math.round((ownedCount / allCards.length) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">{id}</h1>
            <p className="text-xs text-slate-400">
              {loading ? '...' : `${ownedCount} / ${allCards.length} cartes`}
            </p>
          </div>
          {!loading && (
            <span className="ml-auto text-base font-bold text-indigo-500">{percent}%</span>
          )}
        </div>
        {!loading && <ProgressBar value={percent} thick />}
      </div>

      {/* Grille */}
      {loading ? (
        <div className="grid grid-cols-4 gap-1.5 p-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-2/3 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1.5 p-4 md:grid-cols-6">
            {allCards.map(card => {
              const entry = ownedEntryMap[card.id]
              const owned = !!entry
              return (
                <button
                  key={card.id}
                  onClick={() => entry && setSelectedEntry(entry)}
                  disabled={!owned}
                  className={`relative aspect-2/3 rounded-xl overflow-hidden transition-colors ${
                    owned
                      ? 'border border-slate-200 hover:border-indigo-400 cursor-pointer bg-slate-100'
                      : 'border border-dashed border-slate-200 cursor-default bg-slate-50'
                  }`}
                >
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className={`w-full h-full object-cover ${!owned ? 'opacity-0' : ''}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-[10px] p-1 text-center ${
                      owned ? 'text-slate-400' : 'text-slate-200'
                    }`}>
                      {owned ? card.id : '—'}
                    </div>
                  )}
                  {owned && (entry.quantity ?? 0) > 1 && (
                    <span className="absolute top-1 right-1 bg-indigo-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {entry.quantity}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 text-center pb-6">
            Appuie sur une carte pour voir ses détails
          </p>
        </>
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

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/sets/\[id\]/page.tsx
git commit -m "feat: set detail page with back button, progress header, tappable cards"
```

---

## Task 14: CardDetailModal styles

**Files:**
- Modify: `components/collection/CardDetailModal.tsx`

- [ ] **Step 1: Mettre à jour CardDetailModal**

```tsx
import type { CollectionEntry } from '@/types'

const RARITY_COLORS: Record<string, string> = {
  'Leader': 'bg-amber-100 text-amber-700',
  'Super Rare': 'bg-purple-100 text-purple-700',
  'Secret Rare': 'bg-red-100 text-red-600',
  'Rare': 'bg-blue-100 text-blue-700',
  'Uncommon': 'bg-slate-100 text-slate-600',
  'Common': 'bg-slate-100 text-slate-500',
}

interface CardDetailModalProps {
  entry: CollectionEntry
  onClose: () => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export function CardDetailModal({ entry, onClose, onUpdateQuantity, onRemove }: CardDetailModalProps) {
  const { card } = entry
  const rarityClass = card?.rarity
    ? (RARITY_COLORS[card.rarity] ?? 'bg-slate-100 text-slate-500')
    : ''

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        <div className="flex gap-4 mb-5">
          {card?.image_url ? (
            <img src={card.image_url} alt={card.name} className="w-24 rounded-xl shadow-md" />
          ) : (
            <div className="w-24 h-32 bg-slate-100 rounded-xl" />
          )}
          <div className="flex-1">
            <h2 className="font-bold text-lg text-slate-900">{card?.name ?? entry.card_id}</h2>
            <p className="text-sm text-slate-400 mb-1.5">{entry.card_id}</p>
            {card?.rarity && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block ${rarityClass}`}>
                {card.rarity}
              </span>
            )}
            {card?.market_price && (
              <p className="text-xl font-bold text-green-500 mt-2">
                ${card.market_price.toFixed(2)}
                {card.price_source && (
                  <span className="text-xs text-slate-400 font-normal ml-1">({card.price_source})</span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 mb-4">
          <span className="text-sm font-semibold text-slate-700">Quantité</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onUpdateQuantity(entry.id, entry.quantity - 1)}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600"
            >
              −
            </button>
            <span className="text-xl font-bold w-6 text-center text-slate-900">{entry.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(entry.id, entry.quantity + 1)}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={() => { onRemove(entry.id); onClose() }}
          className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-semibold border border-red-100"
        >
          Retirer de la collection
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/collection/CardDetailModal.tsx
git commit -m "feat: CardDetailModal indigo/slate palette with rarity colors"
```

---

## Task 15: Profile page — dark header

**Files:**
- Modify: `app/(app)/profile/page.tsx`

- [ ] **Step 1: Réécrire profile/page.tsx**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
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
  const totalValue = entries.reduce((sum, e) => sum + (e.card?.market_price ?? 0) * e.quantity, 0)
  const uniqueCards = entries.length
  const uniqueSets = new Set(entries.map(e => e.card?.set_id ?? e.card_id.split('-')[0])).size

  // Progression par set
  const setProgress: Record<string, { count: number; name: string }> = {}
  entries.forEach(e => {
    const setId = e.card?.set_id ?? e.card_id.split('-')[0]
    if (!setProgress[setId]) setProgress[setId] = { count: 0, name: setId }
    setProgress[setId].count += 1
  })
  const topSets = Object.entries(setProgress)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)

  const username = email?.split('@')[0] ?? '—'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div>
      {/* Dark header */}
      <div className="bg-slate-800 px-4 pt-6 pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
          Collectionneur
        </p>
        <p className="text-xl font-extrabold text-white tracking-tight">{username}</p>
        {email && <p className="text-xs text-slate-500 mt-0.5">{email}</p>}

        {/* Stats inline */}
        <div className="flex gap-0 mt-5">
          <div className="flex-1 text-center">
            <p className="text-2xl font-extrabold text-indigo-400">{totalCards}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">cartes</p>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex-1 text-center">
            <p className="text-xl font-extrabold text-green-400">${totalValue.toFixed(0)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">valeur</p>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-extrabold text-purple-400">{uniqueSets}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">sets</p>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-extrabold text-amber-400">{uniqueCards}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">uniques</p>
          </div>
        </div>
      </div>

      {/* Contenu fond blanc */}
      <div className="px-4 pt-5">
        {topSets.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Mes sets
            </p>
            <div className="border border-slate-200">
              {topSets.map(([setId, { count, name }], i) => (
                <div
                  key={setId}
                  className={`flex items-center justify-between px-3 py-3 ${
                    i < topSets.length - 1 ? 'border-b border-slate-200' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                    <div className="h-0.75 bg-slate-200 mt-1.5 w-24">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${Math.min(100, count * 2)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-indigo-500 ml-3">{count} cartes</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-white border border-red-200 rounded-lg text-red-500 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <LogOut size={15} strokeWidth={2.5} />
          Déconnexion
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Lancer tous les tests**

```bash
npm run test:run
```

Expected: tous les tests existants passent + les nouveaux tests collection-filters passent.

- [ ] **Step 4: Commit final**

```bash
git add app/\(app\)/profile/page.tsx
git commit -m "feat: profile page with dark header and sets progression"
```

---

## Checklist de vérification finale

- [ ] `npm run build` passe sans erreurs TypeScript
- [ ] `npm run test:run` — tous les tests passent
- [ ] Tester manuellement sur mobile (ou DevTools mobile) :
  - [ ] Scanner : cadre centré, texte au-dessus, bouton capture indigo
  - [ ] Collection : chips filtres fonctionnels, tri dropdown, skeleton au chargement
  - [ ] Set detail : bouton retour fonctionne, cartes cliquables ouvrent la modal
  - [ ] Profil : dark header visible avec stats, déconnexion fonctionne
  - [ ] Bottom nav : pilule active sur chaque onglet
