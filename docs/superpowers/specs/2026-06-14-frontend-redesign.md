# Frontend Redesign — OP Scanner

**Date :** 2026-06-14
**Approche retenue :** B — Complet (visuel + UX + filtres/tri)

---

## 1. Design system

### Police
**Outfit** (Google Fonts, via `next/font/google`). Remplace Geist Sans sur toute l'app.
Weights utilisés : 400, 500, 600, 700, 800.

### Palette
| Token | Valeur | Usage |
|---|---|---|
| `indigo-500` | `#6366f1` | Couleur principale, actif, CTA |
| `indigo-600` | `#4f46e5` | Hover, gradient |
| `indigo-50` | `#eef2ff` | Fond pilule active, badges |
| `slate-50` | `#f8fafc` | Fond app |
| `slate-800` | `#1e293b` | Textes titres, header profil |
| `slate-500` | `#64748b` | Textes secondaires |
| `slate-300` | `#94a3b8` | Textes tertiaires, icônes inactives |
| `slate-200` | `#e2e8f0` | Bordures |
| `green-500` | `#22c55e` | Prix, valeur |
| `amber-500` | `#f59e0b` | Raretés (Leader, etc.) |
| `purple-500` | `#a855f7` | Super Rare |
| `red-500` | `#ef4444` | Secret Rare, actions destructives |

### Icônes
**Lucide React** (`lucide-react`) — remplace tous les emojis.
Icônes utilisées : `Camera`, `BookOpen`, `Grid2x2`, `User`, `Search`, `ArrowLeft`, `LogOut`, `SlidersHorizontal`, `ChevronUp`, `ChevronDown`, `ChevronRight`.
Stroke-width : `2` pour les inactifs, `2.5` pour les actifs.

---

## 2. Bottom Navigation (`BottomNav.tsx`)

- 4 onglets : Scanner / Collection / Sets / Profil
- Onglet actif : pilule `bg-indigo-50` arrondie autour de l'icône (`rounded-full px-3 py-1`), icône `stroke-indigo-500`, label `text-indigo-500 font-semibold`
- Onglets inactifs : pas de fond, icône `stroke-slate-400`, label `text-slate-400`
- Fond nav : `bg-white border-t border-slate-200`

---

## 3. Page Scan (`/scan`)

### Viewfinder
- Fond caméra : `bg-slate-900` (quasi-noir)
- Texte au-dessus du viseur, centré : "Scanne le code de la carte" — `text-white/70 text-sm`
- Viseur centré parfaitement (flexbox `items-center justify-center` sur toute la zone caméra)
- Coins du viseur : `stroke-indigo-500`, épaisseur `2.5px`, taille `20px`
- Bouton capture : cercle `bg-indigo-500`, bordure `border-2 border-white/30`, icône `Camera` blanche. Centré sous le viseur, séparé du viewfinder.

### Overlay scanning
- Fond `bg-black/60`
- Spinner ou texte "Analyse en cours..." dans un badge blanc arrondi

### Overlay erreur
- Remplace le bloc debug brut actuel
- Badge discret en haut : `bg-slate-800/90 text-white`, message d'erreur simple sans stack trace visible

### Panel saisie manuelle
- `bg-white border-t border-slate-200 px-4 pt-3 pb-6`
- Label : "Saisie manuelle" en `text-xs font-semibold text-slate-400 uppercase tracking-wide`
- Input : `border-slate-200 rounded-xl` avec focus `ring-indigo-500`
- Bouton : `bg-indigo-500 text-white rounded-xl font-semibold`

### Modal confirmation (bottom sheet)
- Handle bar gris centré
- Image carte + infos : nom (`font-bold text-lg`), set + numéro (`text-sm text-slate-500`), badge rareté (`bg-amber-100 text-amber-700 rounded-full`), prix en `text-2xl font-bold text-green-500`
- Deux boutons : "Annuler" (`border border-slate-200`) + "Ajouter" (`bg-indigo-500`)
- `border-radius: rounded-xl` sur les boutons (pas trop arrondi)

---

## 4. Page Collection (`/collection`)

### Header sticky
- Titre "Ma collection" `text-xl font-extrabold`
- Bouton tri à droite : `bg-slate-100 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600` + icône `SlidersHorizontal`
- Au tap sur le bouton : petit dropdown inline (état local) avec 4 options radio :
  - Valeur ↓ (défaut)
  - Valeur ↑
  - Nom A→Z
  - Rareté (ordre : Secret Rare → Super Rare → Rare → Uncommon → Common → Leader)

### Barre de recherche
- `bg-slate-100 rounded-xl px-3 py-2` avec icône `Search` slate-400 à gauche
- Pas de bordure visible (fond gris suffit)

### Chips filtres rareté
- Scrollables horizontalement (`overflow-x-auto flex gap-2 pb-1`)
- Chips : "Tout" / "Leader" / "Super Rare" / "Secret Rare" / "Rare" / "Uncommon" / "Common"
- Actif : `bg-indigo-500 text-white`
- Inactif : `bg-white border border-slate-200 text-slate-500`
- Certains chips ont un point coloré à gauche (Leader = amber, Super Rare = purple, Secret Rare = red)

### Section par set
- Header de section : nom du set `font-bold`, compteur `text-xs text-slate-400`, valeur en vert à droite, chevron
- Progress bar : `h-[3px] bg-slate-200` avec fill `bg-indigo-500 rounded-full`
- **Grille 4 colonnes** (actuellement 3)
- Carte possédée : image normale, badge quantité `bg-indigo-500 text-white` si qty > 1
- Carte non possédée : fond `bg-slate-100 border border-dashed border-slate-200` (remplace grayscale)

---

## 5. Page Set Detail (`/sets/[id]`)

### Header
- Bouton retour `ArrowLeft` dans `bg-slate-100 rounded-lg w-8 h-8` (manquait avant)
- Nom du set `font-extrabold`, identifiant set `text-xs text-slate-400`
- Progress : texte "74 / 102 cartes" + pourcentage `font-bold text-indigo-500`
- Progress bar épaisse `h-1.5` avec gradient `from-indigo-500 to-indigo-400`

### Grille
- Même style que la collection (4 colonnes, cartes possédées colorées, non-possédées pointillées)
- Cartes cliquables → ouvre `CardDetailModal` (réutilise le composant existant)
- Texte hint en bas : "Appuie sur une carte pour voir les détails" `text-xs text-slate-400 text-center`

---

## 6. Page Profil (`/profile`)

### Header sombre (Dark header — option C)
- Fond `bg-slate-800` (pas noir, pas navy — slate-800 `#1e293b`)
- Label "Collectionneur" en `text-xs uppercase tracking-wide text-slate-500`
- Nom d'utilisateur `text-xl font-extrabold text-white`
- Email `text-xs text-slate-500`
- Stats en ligne horizontale intégrées dans le header, séparées par des traits `bg-slate-700` :
  - Cartes : nombre `font-extrabold text-indigo-400`
  - Valeur : montant `font-extrabold text-green-400`
  - Sets : nombre `font-extrabold text-purple-400`

### Contenu (fond blanc, bordures peu arrondies)
- Section "Mes sets" : liste avec bordure `border border-slate-200` sans arrondi (`rounded-none`), dividers internes
- Chaque ligne : nom du set, mini progress bar `h-[3px]`, pourcentage `font-bold text-indigo-500`
- Bouton déconnexion : `border border-red-200 text-red-500 rounded-lg` avec icône `LogOut`

---

## 7. États transverses

### Loading
Remplacer tous les `<div>Chargement...</div>` par des **skeleton screens** :
- Skeleton card tile : `bg-slate-200 animate-pulse rounded-xl aspect-[2/3]`
- Skeleton ligne texte : `bg-slate-200 animate-pulse rounded h-4`

### État vide (collection)
- Icône SVG (boîte vide ou livre) en `text-slate-300`
- Titre "Ta collection est vide" `font-semibold text-slate-500`
- Sous-titre "Scanne ta première carte pour commencer" `text-sm text-slate-400`
- Bouton "Scanner maintenant" `bg-indigo-500 text-white rounded-xl`

---

## 8. Dépendances à ajouter

```
lucide-react         # icônes SVG
```

Outfit sera chargé via `next/font/google` dans `app/layout.tsx` — pas de dépendance npm supplémentaire.

---

## 9. Fichiers impactés

| Fichier | Changement |
|---|---|
| `app/layout.tsx` | Chargement police Outfit |
| `app/globals.css` | Variables CSS, tokens |
| `components/ui/BottomNav.tsx` | Icônes Lucide, pilule active |
| `components/ui/ProgressBar.tsx` | Couleurs, épaisseur |
| `components/scanner/Viewfinder.tsx` | Layout centré, texte, bouton |
| `components/scanner/CardConfirmModal.tsx` | Redesign complet |
| `components/scanner/VariantPicker.tsx` | Styles Lucide, palette indigo |
| `components/collection/CardTile.tsx` | Non-possédé pointillé, badge |
| `components/collection/SetSection.tsx` | Header avec valeur, grille 4 col |
| `components/collection/CardDetailModal.tsx` | Styles |
| `components/sets/SetList.tsx` | Styles |
| `app/(app)/scan/page.tsx` | Layout, erreurs |
| `app/(app)/collection/page.tsx` | Chips filtres, tri |
| `app/(app)/sets/[id]/page.tsx` | Bouton retour, header, cards cliquables |
| `app/(app)/profile/page.tsx` | Redesign complet dark header |
