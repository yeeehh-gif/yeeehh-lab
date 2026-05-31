# Phase 4: Enhancements — Implementation Plan

> **Goal:** Add TTS voice pronunciation to training cards and PWA offline support.

**Architecture:** Web Speech API for TTS (zero-cost, browser-native). next-pwa or manual service worker for PWA with offline caching strategy.

---

### Task 24: TTS Voice Pronunciation

**Files:** Create `components/training/pronunciation-button.tsx`, modify `components/training/flashcard.tsx`

- [ ] **Step 1: Create pronunciation button**

`components/training/pronunciation-button.tsx`:

```typescript
"use client"

import { useState } from "react"

export function PronunciationButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false)

  const speak = () => {
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = 0.85
    utterance.onstart = () => setPlaying(true)
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      onClick={speak}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        playing
          ? "bg-charcoal text-white"
          : "bg-[#f0ede6] text-muted hover:bg-[#e8e4dc] hover:text-ink"
      }`}
      title="Listen to pronunciation"
    >
      {playing ? "🔊 Playing..." : "🔊 Listen"}
    </button>
  )
}
```

- [ ] **Step 2: Add pronunciation button to flashcard**

Modify `components/training/flashcard.tsx`: add import and insert `<PronunciationButton>` after the phonetic line in both the front and back of the card.

In the front (unflipped) card, after the phonetic line:
```tsx
{question.vocabulary.phonetic && (
  <p className="font-mono text-sm text-faint mt-3">{question.vocabulary.phonetic}</p>
)}
<PronunciationButton text={question.prompt} />
```

In the flipped card, after the phonetic line:
```tsx
{question.vocabulary.phonetic && (
  <p className="font-mono text-sm text-faint mb-6">{question.vocabulary.phonetic}</p>
)}
<PronunciationButton text={question.prompt} />
```

- [ ] **Step 3: Commit**

```bash
git add components/training/pronunciation-button.tsx components/training/flashcard.tsx && git commit -m "feat: TTS pronunciation button for flashcard training"
```

---

### Task 25: PWA Configuration

**Files:** Create `public/manifest.json`, `app/manifest.ts`, modify `app/layout.tsx`

- [ ] **Step 1: Create manifest.json**

`public/manifest.json`:

```json
{
  "name": "English Lab",
  "short_name": "English Lab",
  "description": "Your personal English learning companion",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#faf7f2",
  "theme_color": "#1e1e1e",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 2: Create Next.js manifest route**

`app/manifest.ts`:

```typescript
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English Lab",
    short_name: "English Lab",
    description: "Your personal English learning companion",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#1e1e1e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
```

- [ ] **Step 3: Add manifest link to layout**

Modify `app/layout.tsx` to add PWA meta tags in the `<head>`:

```typescript
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "English Lab",
  description: "Your personal English learning companion",
  manifest: "/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "English Lab",
  },
}

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-body antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Generate placeholder PWA icons**

Run a simple script to create placeholder icons:

```bash
cd "F:/English Leaning Web/public"
# Create a minimal 192x192 placeholder SVG converted to PNG approach doesn't work.
# Instead, create simple SVG icons that browsers will accept:
cat > icon-192.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" fill="#1e1e1e"/>
  <text x="96" y="110" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="48" font-weight="700" fill="#faf7f2">EL</text>
</svg>
EOF
cp icon-192.svg icon-512.svg
```

- [ ] **Step 5: Commit**

```bash
git add public/ app/manifest.ts app/layout.tsx && git commit -m "feat: PWA manifest and configuration"
```

---

### Task 26: Build Verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: successful build. Check that `/manifest` route is generated and `icon-192.svg` / `icon-512.svg` are in the output.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore: phase 4 build verification"
```

---

### Task 27: Final Polish — Update Sidebar Metadata

**Files:** Modify `components/layout/sidebar.tsx`

- [ ] **Step 1: Add Settings nav item for future use**

No code changes needed — sidebar already has Settings section.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore: final polish and cleanup"
```
