# One Piece Card Scanner & Collection Tracker — Design Spec

**Date :** 2026-06-14
**Statut :** Approuvé

---

## 1. Vue d'ensemble

Webapp mobile-first permettant de scanner des cartes One Piece TCG via la caméra, d'identifier automatiquement la carte par OCR, d'afficher son prix marché, et de gérer un classeur virtuel organisé par extension.

**Périmètre MVP :** scan + identification + sélection de variante + ajout au classeur + pricing.
**Hors MVP :** wishlist dédiée, mode offline complet, historique de prix, deck builder.

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| PWA | `next-pwa` (accès caméra mobile, installable) |
| Auth | Supabase Auth (Email/password + Google + Discord OAuth) |
| Base de données | Supabase (PostgreSQL) avec RLS |
| OCR | Tesseract.js (côté client) |
| Données cartes | TCGDex API (`api.tcgdex.net`) |
| Pricing primaire | TCGApi.dev (100 req/jour gratuit) |
| Pricing fallback | TCGfast (gratuit, prix TCGPlayer + eBay) |
| Hosting | Vercel (ou équivalent compatible Node.js) |

---

## 3. Base de données

### Tables

```sql
-- Géré par Supabase Auth
-- auth.users (id, email, ...)

-- Extensions One Piece
sets (
  id            TEXT PRIMARY KEY,       -- ex: "OP01"
  name          TEXT NOT NULL,           -- ex: "Romance Dawn"
  release_date  DATE,
  total_cards   INT,
  logo_url      TEXT
)

-- Cache cartes (partagé, lecture publique)
cards (
  id            TEXT PRIMARY KEY,       -- ex: "OP01-001"
  set_id        TEXT REFERENCES sets,
  card_number   INT,                    -- ordre dans le set
  name          TEXT NOT NULL,
  image_url     TEXT,
  rarity        TEXT,
  variants      JSONB,                  -- [{id, name, image_url}] si >1 forme
  market_price  DECIMAL(10,2),          -- USD, source TCGApi.dev ou TCGfast
  price_source  TEXT,                   -- "tcgapi" | "tcgfast" | "cache"
  price_updated_at TIMESTAMP
)

-- Collection de l'utilisateur
collection (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users NOT NULL,
  card_id       TEXT REFERENCES cards NOT NULL,
  variant_id    TEXT,                   -- null si pas de variante
  quantity      INT DEFAULT 1,
  added_at      TIMESTAMP DEFAULT now()
)
```

### RLS (Row Level Security)

- `collection` : lecture et écriture restreintes à `user_id = auth.uid()`
- `cards` : lecture publique, pas d'écriture côté client
- `sets` : lecture publique, pas d'écriture côté client

---

## 4. Architecture applicative

```
/app
  /(auth)
    /login          → Page d'authentification
  /(app)
    /scan           → Scanner de cartes
    /collection     → Classeur virtuel
    /sets           → Liste des extensions
    /sets/[id]      → Vue complète d'un set (cartes possédées + manquantes)
    /profile        → Profil et stats

/components
  /scanner          → Viewfinder, CaptureButton, VariantPicker, CardConfirmModal
  /collection       → CollectionGrid, SetSection, CardTile, CardDetailModal
  /sets             → SetList, SetProgressBar
  /ui               → Composants génériques (Button, Modal, Badge, ProgressBar)

/lib
  /supabase.ts      → Client Supabase (browser + server)
  /tcgdex.ts        → Fetch données cartes et variantes
  /pricing.ts       → Stratégie primaire/fallback TCGApi.dev → TCGfast
  /ocr.ts           → Initialisation et appel Tesseract.js

/hooks
  /useScanner.ts    → Logique caméra + OCR + détection numéro
  /useCollection.ts → CRUD collection Supabase
  /usePricing.ts    → Fetch prix avec fallback et cache TTL

/types
  /index.ts         → Card, Set, CollectionEntry, Variant, PriceData
```

---

## 5. Flux principal — Scan d'une carte

```
1. Utilisateur ouvre /scan
2. Tesseract.js s'initialise (une fois par session)
3. Viewfinder caméra affiché en plein écran
4. Utilisateur capture une photo
5. OCR extrait le numéro (ex: "OP01-001")
   → Confiance faible : champ éditable pré-rempli, utilisateur corrige
6. Appel TCGDex : récupère toutes les cartes correspondant au numéro
   → 1 résultat : affiche CardConfirmModal directement
   → N résultats : affiche VariantPicker (grille des variantes)
7. Utilisateur confirme la carte
8. Fetch prix (TCGApi.dev → TCGfast → cache Supabase si les deux rate-limitent)
9. Ajout dans collection (Supabase INSERT)
10. Toast de confirmation, retour au viewfinder
```

---

## 6. Pages et navigation

### Navigation

- **Mobile :** Bottom navigation bar — 4 onglets : Scanner / Collection / Sets / Profil
- **Desktop :** Sidebar gauche fixe

### /login

Écran de bienvenue : logo + nom de l'app.
Boutons : "Continuer avec Google", "Continuer avec Discord", "Email / mot de passe".
Redirect vers `/scan` après authentification.

### /scan

- Viewfinder plein écran avec overlay de guidage (rectangle de cadrage)
- Bouton capture centré en bas
- Résultat OCR affiché sous forme de badge (numéro détecté)
- `CardConfirmModal` : image + nom + set + rareté + prix + bouton "Ajouter"
- `VariantPicker` : grille 2 colonnes des variantes avec images
- Fallback : champ texte éditable si OCR échoue

### /collection

- Groupée par set (sections accordéon ou scroll sectionné)
- Header de section : `OP01 — Romance Dawn : 42/121 (34%)` + barre de progression
- Grille de cartes (2 colonnes mobile, 4-5 desktop)
- Toggle grid / liste
- Tap sur une carte : `CardDetailModal` (image, quantité ±, prix, bouton retirer)
- Barre de recherche par nom ou numéro

### /sets

- Liste de toutes les extensions disponibles, ordre par date de sortie décroissante
- Chaque ligne : logo, nom, `42/121`, valeur estimée totale des cartes possédées
- Tap sur un set : vue complète du set, cartes possédées en couleur, manquantes en grisé

### /profile

- Valeur totale de la collection (somme des prix en cache)
- Stats : nb cartes, nb sets entamés / complétés
- Bouton déconnexion

---

## 7. Stratégie de pricing

```typescript
async function fetchPrice(cardId: string): Promise<PriceData> {
  // 1. Cache Supabase valide (TTL 24h)
  const cached = await getCachedPrice(cardId)
  if (cached && !isExpired(cached.price_updated_at, 24)) return cached

  // 2. TCGApi.dev (primaire)
  try {
    const price = await fetchFromTCGApiDev(cardId)
    await updateCachedPrice(cardId, price, 'tcgapi')
    return price
  } catch (e) {
    if (!isRateLimited(e)) throw e
  }

  // 3. TCGfast (fallback)
  try {
    const price = await fetchFromTCGfast(cardId)
    await updateCachedPrice(cardId, price, 'tcgfast')
    return price
  } catch (e) {
    if (!isRateLimited(e)) throw e
  }

  // 4. Cache périmé affiché avec avertissement
  if (cached) return { ...cached, source: 'cache', stale: true }
  return null
}
```

Prix affichés en USD avec mention de la source. Badge "prix périmé" si stale.

---

## 8. Gestion des erreurs

| Cas | Comportement |
|-----|-------------|
| OCR confiance faible | Champ pré-rempli éditable, focus automatique |
| Numéro introuvable dans TCGDex | Message "Carte introuvable" + option saisie manuelle |
| TCGApi.dev rate-limitée | Fallback TCGfast automatique (silencieux) |
| TCGfast rate-limitée aussi | Cache Supabase affiché avec badge "prix peut-être périmé" |
| Aucun prix disponible | Champ prix affiché avec "—" sans bloquer l'ajout |
| Pas de connexion réseau | Toast "Hors ligne — la carte sera ajoutée dès le retour du réseau" + retry auto |

---

## 9. Décisions techniques notables

- **OCR client-side uniquement :** Tesseract.js initialisé une fois par session (worker persistent). Pas de round-trip réseau pour la détection.
- **TCGDex comme source de vérité cartes :** Evite de maintenir une DB de cartes manuellement. Les sets et variantes sont fetched et mis en cache dans Supabase à la première consultation.
- **RLS Supabase :** Aucune logique de filtrage `user_id` dans le code applicatif — tout est géré au niveau DB.
- **Prix non temps-réel :** TTL 24h acceptable pour un usage personnel. Pas de webhook ni de cron job pour le MVP.
