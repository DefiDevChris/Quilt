# Social Design System

This document defines the design language used across all social section pages:
**Feed · Blog · Featured · Trending · My Profile**

These pages share the `SocialLayout` shell and must stay visually consistent with each other. They intentionally differ from the main app design system (dashboard, studio, landing) — the social section uses a lighter, more editorial aesthetic.

---

## Layout Shell (`SocialLayout`)

All social pages render inside `<SocialLayout activeSection="...">`.

| Section | `activeSection` | Content Width |
|---|---|---|
| Feed (`/socialthreads`) | `feed` | `max-w-2xl mx-auto` (default) |
| Blog list (`/blog`) | `blog` | `max-w-4xl mx-auto` |
| Featured (`/socialthreads?section=featured`) | `featured` | `max-w-2xl mx-auto` (default) |
| Trending (`/socialthreads?section=trending`) | `trending` | `max-w-2xl mx-auto` (default) |
| Profile (`/profile`) | `profile` | `max-w-2xl mx-auto` (default) |

### Right Sidebar

The sidebar always shows 3 (or 4 for Profile) animated image panels linking to the other sections. The active section is excluded. Profile shows all 4 content sections.

### Header

Fixed, full-width, `glass-panel` style. Three columns: Logo + section title | Search | Avatar menu.

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| Background | `#FDF9F6` | Page background (`bg-[#FDF9F6]`) |
| Text primary | `text-slate-800` | Headlines, bold labels |
| Text secondary | `text-slate-600` | Body copy, descriptions |
| Text muted | `text-slate-500` | Meta info, timestamps, counts |
| Accent primary | `text-orange-500` / `bg-orange-500` | Links, primary actions |
| Accent hover | `text-orange-600` | Hover state for links |
| Accent light | `bg-orange-400` | Badge backgrounds, gradients |
| Rose accent | `bg-rose-400` | Secondary badge color, gradient pairs |
| Border | `border-white/40` | Card dividers |
| Border bright | `border-white/60` — `border-white/80` | Card edges, focus rings |
| Input focus | `border-orange-300` | Search bar focus |

### Background Orbs (fixed, decorative)

```
top-left:    bg-rose-200/50  blur-[120px]  w-[50vw]
bottom-right: bg-orange-200/50 blur-[140px] w-[60vw]
center:      bg-white/60     blur-[100px]  w-[40vw]
```

---

## Typography

| Role | Classes | Usage |
|---|---|---|
| Page title (header) | `text-xl font-extrabold text-slate-800 tracking-tight` | Active section label in header |
| Card headline (featured) | `text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight` | Featured/hero card title |
| Card headline (grid) | `text-xl font-bold text-slate-800` | Grid card titles |
| Section label | `text-2xl font-bold text-slate-800` | Section sub-headers (e.g. "Trending Creators") |
| Body | `text-slate-600 text-lg leading-relaxed font-medium` | Featured post excerpt |
| Body small | `text-sm text-slate-600` | Grid card excerpts |
| Meta / caption | `text-xs text-slate-500 font-medium` | Author names, dates, read time |
| Link | `text-xs font-bold text-orange-500 hover:text-orange-600` | "Read more →" actions |
| Section subtitle (header) | `text-xs text-slate-500 font-medium` | Sub-label under section title |

Font family: `font-sans` (Manrope) — inherited from root layout.

---

## Card Styles

### Featured / Hero Card

```tsx
<article className="glass-panel rounded-[2rem] p-8 md:p-10 relative overflow-hidden group">
  {/* gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-orange-200/40 via-rose-100/40 to-orange-200/40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
  {/* content */}
</article>
```

### Grid Cards

```tsx
<article className="glass-panel rounded-[1.5rem] p-5 hover:bg-white/80 hover:shadow-lg transition-all duration-300">
```

### Skeleton Cards (loading)

```tsx
<div className="glass-panel rounded-[1.5rem] p-5 animate-pulse">
  <div className="aspect-[16/10] bg-white/50 rounded-xl mb-4" />
  <div className="h-5 bg-white/50 rounded-full w-3/4 mb-2" />
</div>
```

### Profile Cards (stats, quick links)

```tsx
<div className="rounded-xl glass-elevated p-4 hover:shadow-elevation-3 transition-colors">
```

Profile cards use `glass-elevated` (from main design system) rather than `glass-panel` — the content is more structured and benefit from the higher contrast glass style.

---

## Badges & Tags

### Category Badge (orange gradient — featured/hero)

```tsx
<span className="bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
  category
</span>
```

### Category Badge (inline — grid cards)

```tsx
<div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-700 uppercase tracking-wide">
  category
</div>
```

### Difficulty / Status Badge

```tsx
<span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-400/10 text-orange-500">
  Beginner
</span>
```

---

## Buttons

### Primary Action (follow, CTA)

```tsx
<button className="w-full py-2 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all">
  Follow
</button>
```

### Ghost / Glass Button (load more, secondary)

```tsx
<button className="glass-panel px-8 py-3 rounded-full font-bold text-slate-700 hover:bg-white/80 transition-all">
  Load More
</button>
```

### Dropdown Button (avatar menu)

```tsx
<div className="flex flex-col items-center justify-center gap-3 p-6 rounded-[1.5rem] bg-white/50 hover:bg-white/90 transition-all duration-300 border border-white/60 hover:border-orange-300 shadow-sm hover:shadow-md hover:-translate-y-1 text-slate-600 hover:text-orange-600">
```

---

## Glass Utility Classes

| Class | Background | Blur | Use in social section |
|---|---|---|---|
| `glass-panel` | `rgba(255,255,255,0.65)` | `16px` | Cards, header, search bar |
| `glass-panel-social` | `rgba(255,255,255,0.60)` | `28px` + warm peach shadow | Feed/Trending/Featured cards — richer depth |
| `glass-panel-social-hover` | Adds hover lift transition | — | Pair with `glass-panel-social` for interactive cards |
| `glass-elevated` | `rgba(255,255,255,0.70)` | `32px` | Profile cards, dropdown menus |

All glass classes include the `var(--glass-inner-glow)` white highlight (top-edge border illusion).

---

## Spacing

| Element | Classes |
|---|---|
| Section vertical padding | `space-y-10` (between card groups) |
| Card internal padding | `p-5` (grid), `p-8 md:p-10` (featured) |
| Grid gap | `gap-6` |
| Stats/meta gap | `gap-4` |
| Avatar + label gap | `gap-2` |
| Card image aspect | `aspect-[16/10]` (grid), `aspect-square` (featured) |

---

## Imagery

### Sidebar panels

Each section panel shows a looping slideshow of quilt images. Animations:
- Panel 1: `fade 10s infinite`
- Panel 2: `swipe 7s infinite`
- Panel 3+: `scrollLeftFast 5s linear infinite`

Images are sourced from `/images/quilts/` and configured in `SECTIONS` array in `SocialLayout.tsx`.

### Card images

- Grid cards: `aspect-[16/10] rounded-xl overflow-hidden shadow-sm` — landscape crop
- Featured post: `aspect-square rounded-3xl border-4 border-white/50` — square crop
- Author avatars: `w-12 h-12 rounded-full border-2 border-white shadow-sm`

---

## Scroll Behavior

The layout uses `h-screen` with `overflow-y-auto` on the main content area. Content scrolls within the panel (not the browser window). The header and right sidebar remain fixed.

---

## Border Radii in Social Section

| Element | Radius |
|---|---|
| Featured card | `rounded-[2rem]` (32px) |
| Grid card | `rounded-[1.5rem]` (24px) |
| Avatar menu dropdown | `rounded-[2rem]` |
| Dropdown buttons | `rounded-[1.5rem]` |
| Avatar | `rounded-full` |
| Image inside grid card | `rounded-xl` (12px) |
| Image inside featured card | `rounded-3xl` (24px) |
| Profile info cards | `rounded-xl` (12px) |
| Badges / pills | `rounded-full` |

---

## Do's and Don'ts

**DO:**
- Use `glass-panel` for content cards
- Use `text-slate-800 / 600 / 500` for text hierarchy
- Use `orange-400/500/600` and `rose-400` for accents
- Use `border-white/40` for card dividers
- Use `rounded-[2rem]` for featured, `rounded-[1.5rem]` for grid cards

**DON'T:**
- Use main design system tokens (`text-on-surface`, `text-secondary`, `bg-surface-container`) inside social content components — these belong to the dashboard/studio
- Use `bg-warm-peach`, `text-warm-text` etc. — those belong to the public landing pages
- Add `PublicNav` or `Footer` to social pages — they use `SocialLayout` instead
- Hard-code `bg-white` backgrounds on cards — use `glass-panel` for glass consistency
