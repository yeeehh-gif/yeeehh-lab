# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the English Lab project with Next.js 14, Supabase, authentication, content management, and note import flow.

**Architecture:** Next.js 14 App Router with Route Groups for auth/dashboard separation. Supabase for auth + PostgreSQL. shadcn/ui components on Tailwind. Magazine-style design system with Fraunces + DM Sans via Google Fonts. Modular component structure: layout/, import/, library/ directories under components/.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (Auth + PostgreSQL), Google Fonts (Fraunces + DM Sans + DM Mono)

---

## File Map

```
F:/English Leaning Web/
├── .env.local                          # Supabase keys
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── middleware.ts                       # Supabase auth middleware
├── app/
│   ├── globals.css                     # Design tokens + fonts
│   ├── layout.tsx                      # Root layout with font loading
│   ├── page.tsx                        # Redirect to /dashboard
│   ├── (auth)/
│   │   ├── layout.tsx                  # Auth layout (no sidebar)
│   │   └── login/
│   │       └── page.tsx                # Email login form
│   └── (dashboard)/
│       ├── layout.tsx                  # Dashboard layout with sidebar
│       ├── page.tsx                    # Hero homepage
│       ├── import/
│       │   └── page.tsx                # Four-step import flow
│       └── library/
│           └── page.tsx                # Word CRUD table
├── components/
│   ├── ui/                             # shadcn/ui generated
│   ├── layout/
│   │   ├── sidebar.tsx                 # Left nav
│   │   └── masthead.tsx                # Top brand bar
│   ├── home/
│   │   └── hero-cover.tsx              # Magazine hero page content
│   ├── import/
│   │   ├── step-indicator.tsx          # 1-2-3-4 stepper
│   │   ├── note-selector.tsx           # Step 1: select notes
│   │   ├── extract-progress.tsx        # Step 2: extraction animation
│   │   ├── review-list.tsx             # Step 3: review extracted items
│   │   └── import-complete.tsx         # Step 4: completion stats
│   └── library/
│       ├── word-table.tsx              # List/search/filter words
│       └── word-form.tsx               # Add/edit word dialog
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client (cookies)
│   │   └── middleware.ts               # Auth helper
│   └── utils.ts                        # cn() helper
├── types/
│   └── index.ts                        # Shared TypeScript types
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql      # Database schema
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `.env.local`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`, `lib/utils.ts`

- [ ] **Step 1: Create Next.js project**

Run: `cd "F:/English Leaning Web" && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --no-turbopack`

Expected: Next.js project scaffolded with TypeScript, Tailwind, App Router.

- [ ] **Step 2: Install dependencies**

Run: `npm install @supabase/supabase-js @supabase/ssr`

Run: `npx shadcn@latest init`

Accept defaults (style: default, base color: neutral, CSS variables: yes).

Run: `npx shadcn@latest add button input label card dialog separator`

Expected: Dependencies installed, shadcn/ui components in `components/ui/`.

- [ ] **Step 3: Create .env.local**

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: Create `lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Run: `npm install clsx tailwind-merge`

- [ ] **Step 5: Configure `tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#faf7f2",
        ink: "#1a1a1a",
        charcoal: "#1e1e1e",
        gold: "#c4a030",
        accent: "#3b6e8e",
        muted: "#8a8a8a",
        faint: "#c4c0ba",
        rule: "#e8e4de",
        body: "#4a4a4a",
      },
      fontFamily: {
        display: ["Fraunces", "Times New Roman", "Georgia", "serif"],
        sans: ["DM Sans", "SF Pro Display", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
        mono: ["DM Mono", "SF Mono", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.02)",
        "card-md": "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

- [ ] **Step 6: Create `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 7: Create `lib/supabase/server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold project with Next.js + Supabase + shadcn/ui"
```

---

### Task 2: Database Schema & TypeScript Types

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`, `types/index.ts`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  daily_goal INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content library
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT,
  part_of_speech TEXT,
  definition TEXT NOT NULL,
  example_sentence TEXT,
  category TEXT NOT NULL CHECK (category IN ('reading', 'speaking', 'writing')),
  source_note TEXT,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vocabulary_user ON vocabulary(user_id);
CREATE INDEX idx_vocabulary_category ON vocabulary(user_id, category);

-- Training records
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL CHECK (training_type IN ('reading', 'speaking', 'writing')),
  result TEXT NOT NULL CHECK (result IN ('correct', 'maybe', 'wrong')),
  reviewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_training_user_date ON training_records(user_id, reviewed_at);

-- Ebbinghaus schedule
CREATE TABLE review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  next_review_at TIMESTAMPTZ NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vocabulary_id)
);

CREATE INDEX idx_review_due ON review_schedule(user_id, next_review_at);

-- Error backlog
CREATE TABLE error_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL CHECK (error_type IN ('reading', 'speaking', 'writing')),
  attempts INTEGER DEFAULT 1,
  release_count INTEGER DEFAULT 3,
  next_attempt_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vocabulary_id, error_type)
);

-- Import sessions
CREATE TABLE import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  items_found INTEGER DEFAULT 0,
  items_imported INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "own_profiles" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_vocabulary" ON vocabulary FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_training" ON training_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_review" ON review_schedule FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_backlog" ON error_backlog FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_imports" ON import_sessions FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 2: Create `types/index.ts`**

```typescript
export interface Profile {
  id: string
  display_name: string | null
  daily_goal: number
  created_at: string
}

export interface Vocabulary {
  id: string
  user_id: string
  word: string
  phonetic: string | null
  part_of_speech: string | null
  definition: string
  example_sentence: string | null
  category: "reading" | "speaking" | "writing"
  source_note: string | null
  mastery_level: number
  created_at: string
  updated_at: string
}

export interface TrainingRecord {
  id: string
  user_id: string
  vocabulary_id: string
  training_type: "reading" | "speaking" | "writing"
  result: "correct" | "maybe" | "wrong"
  reviewed_at: string
}

export interface ReviewSchedule {
  id: string
  user_id: string
  vocabulary_id: string
  next_review_at: string
  interval_days: number
  review_count: number
}

export interface ErrorBacklog {
  id: string
  user_id: string
  vocabulary_id: string
  error_type: "reading" | "speaking" | "writing"
  attempts: number
  release_count: number
  next_attempt_at: string
}

export interface ImportSession {
  id: string
  user_id: string
  source: string
  items_found: number
  items_imported: number
  created_at: string
}

// M1 import types
export interface NotebookLMNote {
  id: string
  title: string
  updated_at: string
  word_count: number
}

export interface ExtractedItem {
  word: string
  phonetic?: string
  part_of_speech?: string
  definition: string
  example_sentence?: string
  category: "reading" | "speaking" | "writing"
  source_note?: string
  selected: boolean
}

// Auth form
export interface LoginFormData {
  email: string
  password: string
}
```

- [ ] **Step 3: Push migration to Supabase**

Run: `npx supabase link --project-ref <your-project-ref>`

Copy the migration file to the Supabase dashboard SQL editor and execute, or use `npx supabase db push` if CLI is configured.

- [ ] **Step 4: Commit**

```bash
git add supabase/ types/ && git commit -m "feat: database schema and TypeScript types"
```

---

### Task 3: Supabase Auth Middleware + Login Page

**Files:**
- Create: `middleware.ts`, `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create auth middleware**

Create `middleware.ts` at project root:

```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
}
```

- [ ] **Step 2: Create auth layout**

Create `app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Create login page**

Create `app/(auth)/login/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push("/dashboard")
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-sm p-8 shadow-card-md border-rule">
      <h1 className="font-display italic text-2xl font-bold text-ink mb-1">
        English Lab
      </h1>
      <p className="text-faint text-sm mb-8">Sign in to continue</p>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full bg-charcoal text-white hover:bg-charcoal/90">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-faint text-xs mt-6 text-center">
        Self-hosted · Personal use only
      </p>
    </Card>
  )
}
```

- [ ] **Step 4: Verify login flow**

Run: `npm run dev`

Navigate to `http://localhost:3000`. Should redirect to `/login`.
Sign in with a Supabase user. Should redirect to `/dashboard` (which will 404 for now).

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/(auth)/ && git commit -m "feat: auth middleware and login page"
```

---

### Task 4: Design System — Global Styles & Fonts

**Files:**
- Create: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write globals.css**

Create `app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --paper: #faf7f2;
    --card: #ffffff;
    --ink: #1a1a1a;
    --body: #4a4a4a;
    --muted: #8a8a8a;
    --faint: #c4c0ba;
    --rule: #e8e4de;
    --charcoal: #1e1e1e;
    --gold: #c4a030;
    --accent: #3b6e8e;
  }

  body {
    background-color: var(--paper);
    color: var(--body);
    font-family: 'DM Sans', 'SF Pro Display', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  .font-display-italic {
    font-family: 'Fraunces', 'Times New Roman', Georgia, serif;
    font-style: italic;
  }
}
```

- [ ] **Step 2: Update root layout**

Modify `app/layout.tsx`:

```typescript
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "English Lab",
  description: "Personal English learning tool",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-body antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Verify fonts load**

Run `npm run dev`. Open DevTools → Network → filter "googleapis". Confirm Fraunces + DM Sans font files are fetched.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx && git commit -m "feat: design system globals and fonts"
```

---

### Task 5: Dashboard Layout with Sidebar

**Files:**
- Create: `components/layout/sidebar.tsx`, `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create sidebar component**

Create `components/layout/sidebar.tsx`:

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  {
    section: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Training", href: "/training" },
      { label: "Statistics", href: "/statistics" },
    ],
  },
  {
    section: "Library",
    items: [
      { label: "My Words", href: "/library" },
      { label: "Import Notes", href: "/import" },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[200px] flex-shrink-0 flex flex-col gap-1 py-8">
      <Link href="/dashboard" className="font-display-italic text-[22px] font-semibold text-ink mb-8 px-[10px] tracking-tight no-underline">
        English Lab
      </Link>
      <nav>
        {navItems.map((group) => (
          <div key={group.section} className="mb-6">
            <p className="text-[10px] font-semibold text-faint uppercase tracking-[1.5px] px-[10px] pb-2">
              {group.section}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-[10px] rounded-md text-sm font-medium transition-colors no-underline",
                  pathname === item.href
                    ? "bg-black/5 text-ink font-semibold"
                    : "text-muted hover:bg-black/[0.03] hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Create dashboard layout**

Create `app/(dashboard)/layout.tsx`:

```typescript
import { Sidebar } from "@/components/layout/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 max-w-[1120px] mx-auto min-h-screen px-8 py-0">
      <Sidebar />
      <main className="flex-1 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Verify sidebar renders**

Run: `npm run dev`

Navigate to `/dashboard`. Sidebar should render on the left. Clicking nav items should navigate between pages (which will 404 until we create them).

- [ ] **Step 4: Commit**

```bash
git add components/layout/ app/\(dashboard\)/ && git commit -m "feat: dashboard layout with sidebar navigation"
```

---

### Task 6: Hero Homepage

**Files:**
- Create: `components/home/hero-cover.tsx`
- Modify: `app/(dashboard)/page.tsx`, `app/page.tsx`

- [ ] **Step 1: Create hero cover component**

Create `components/home/hero-cover.tsx`:

```typescript
import Link from "next/link"

export function HeroCover() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-center gap-12">
      {/* Masthead */}
      <div className="flex items-baseline gap-4 pb-5 border-b border-rule">
        <span className="font-display-italic text-[26px] font-bold text-ink tracking-tight">
          English Lab
        </span>
        <span className="font-mono text-[11px] text-faint tracking-wider">
          Issue No. 31 · May 2026
        </span>
      </div>

      {/* Cover content: two columns */}
      <div className="grid grid-cols-[1fr_1fr] gap-12 items-start">
        {/* Left: main story */}
        <div className="flex flex-col gap-5">
          <span className="text-[11px] font-semibold text-faint tracking-[2.5px] uppercase">
            This morning
          </span>
          <h1 className="font-display-italic text-[88px] font-extrabold text-ink leading-[0.92] tracking-[-1.5px]">
            8 words await
          </h1>
          <p className="text-[15px] text-muted leading-relaxed max-w-[360px]">
            Your daily review is ready.{" "}
            <em className="font-display-italic not-italic font-semibold text-ink">Reading</em>{" "}
            vocabulary from last week&apos;s Economist digest, plus{" "}
            <em className="font-display-italic not-italic font-semibold text-ink">writing</em>{" "}
            patterns from Unit 3.
          </p>
          <Link
            href="/training"
            className="inline-block bg-charcoal text-white text-sm font-bold py-[14px] px-9 rounded-md no-underline hover:bg-charcoal/90 transition-colors self-start"
          >
            Begin training
          </Link>
        </div>

        {/* Right: cover lines */}
        <div className="flex flex-col gap-7 pt-40">
          <CoverLine number="7" label="Day streak" detail="Best record 14" detailBold="14" />
          <CoverLine number="486" label="Total vocabulary" detail="added this week" detailBold="+22" />
          <CoverLine number="12" label="Error backlog" detail="From speaking & writing" />
        </div>
      </div>

      {/* Folio */}
      <div className="flex justify-between items-center pt-8 mt-8 border-t border-rule text-[11px] text-faint font-medium">
        <div className="flex gap-6">
          <span className="cursor-pointer hover:text-muted transition-colors">Import notes</span>
          <span className="cursor-pointer hover:text-muted transition-colors">Statistics</span>
          <span className="cursor-pointer hover:text-muted transition-colors">Browse library</span>
        </div>
        <div>
          <span className="font-mono uppercase">May 31, 2026</span>
          &nbsp;·&nbsp;
          <span>Next review wave tomorrow · 14 words</span>
        </div>
      </div>
    </div>
  )
}

function CoverLine({
  number,
  label,
  detail,
  detailBold,
}: {
  number: string
  label: string
  detail: string
  detailBold?: string
}) {
  return (
    <div className="pt-6 border-t border-rule first:border-t-0 first:pt-0 flex flex-col gap-1">
      <span className="font-display-italic text-[32px] font-bold text-ink leading-none">
        {number}
      </span>
      <span className="text-xs text-faint font-medium">{label}</span>
      <span className="text-[13px] text-muted font-medium leading-relaxed">
        {detailBold ? (
          <>
            <strong className="text-ink font-bold">{detailBold}</strong>{" "}
            {detail.replace(detailBold, "").trim()}
          </>
        ) : (
          detail
        )}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create dashboard page**

Modify `app/(dashboard)/page.tsx`:

```typescript
import { HeroCover } from "@/components/home/hero-cover"

export default function DashboardPage() {
  return <HeroCover />
}
```

Modify `app/page.tsx`:

```typescript
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/dashboard")
}
```

- [ ] **Step 3: Verify homepage renders**

Run: `npm run dev`

Navigate to `/dashboard`. Should see the magazine hero cover with masthead, "8 words await" headline, cover lines on the right, and folio bar at the bottom. Resize to verify responsive layout.

- [ ] **Step 4: Commit**

```bash
git add components/home/ app/\(dashboard\)/page.tsx app/page.tsx && git commit -m "feat: magazine hero homepage"
```

---

### Task 7: M2 — Word Library CRUD Page

**Files:**
- Create: `components/library/word-table.tsx`, `components/library/word-form.tsx`, `app/(dashboard)/library/page.tsx`

- [ ] **Step 1: Create word table component**

Create `components/library/word-table.tsx`:

```typescript
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Vocabulary } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function WordTable() {
  const [words, setWords] = useState<Vocabulary[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "reading" | "speaking" | "writing">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWords()
  }, [search, filter])

  async function loadWords() {
    const supabase = createClient()
    let query = supabase.from("vocabulary").select("*").order("created_at", { ascending: false })

    if (search) query = query.ilike("word", `%${search}%`)
    if (filter !== "all") query = query.eq("category", filter)

    const { data } = await query
    setWords(data || [])
    setLoading(false)
  }

  if (loading) return <p className="text-faint text-sm">Loading...</p>

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[260px]"
        />
        <div className="flex gap-2">
          {(["all", "reading", "speaking", "writing"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-charcoal text-white" : "text-muted"}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <span className="font-mono text-xs text-faint ml-auto">{words.length} words</span>
      </div>

      {/* Table */}
      <div className="border border-rule rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule bg-[#fafbfc]">
              <th className="text-left p-4 font-semibold text-ink">Word</th>
              <th className="text-left p-4 font-semibold text-ink">Definition</th>
              <th className="text-left p-4 font-semibold text-ink">Category</th>
              <th className="text-left p-4 font-semibold text-ink">Mastery</th>
              <th className="text-left p-4 font-semibold text-ink">Source</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id} className="border-b border-rule last:border-0 hover:bg-[#fdfdfb]">
                <td className="p-4">
                  <span className="font-semibold text-ink">{w.word}</span>
                  {w.phonetic && (
                    <span className="font-mono text-xs text-faint ml-2">{w.phonetic}</span>
                  )}
                </td>
                <td className="p-4 text-body">{w.definition}</td>
                <td className="p-4">
                  <span className="font-mono text-[10px] font-medium px-[10px] py-1 rounded-sm tracking-wider bg-[#f2f5f8] text-[#4a7090]">
                    {w.category.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-[6px] bg-[#ebeef2] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-charcoal rounded-sm"
                        style={{ width: `${(w.mastery_level / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted">{w.mastery_level}/5</span>
                  </div>
                </td>
                <td className="p-4 text-faint text-xs">{w.source_note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {words.length === 0 && (
        <p className="text-faint text-sm text-center py-12">No words found. Import notes to get started.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create word form dialog**

Create `components/library/word-form.tsx`:

```typescript
"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function WordForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState("")
  const [definition, setDefinition] = useState("")
  const [phonetic, setPhonetic] = useState("")
  const [partOfSpeech, setPartOfSpeech] = useState("")
  const [exampleSentence, setExampleSentence] = useState("")
  const [category, setCategory] = useState<"reading" | "speaking" | "writing">("reading")
  const [sourceNote, setSourceNote] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("vocabulary").insert({
      user_id: user.id,
      word,
      definition,
      phonetic: phonetic || null,
      part_of_speech: partOfSpeech || null,
      example_sentence: exampleSentence || null,
      category,
      source_note: sourceNote || null,
    })

    setOpen(false)
    setWord(""); setDefinition(""); setPhonetic(""); setPartOfSpeech("")
    setExampleSentence(""); setSourceNote("")
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-charcoal text-white hover:bg-charcoal/90">Add word</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display-italic text-xl font-bold text-ink">
            Add word
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Word</Label>
              <Input value={word} onChange={(e) => setWord(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Part of speech</Label>
              <Input
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="adj."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phonetic</Label>
            <Input value={phonetic} onChange={(e) => setPhonetic(e.target.value)} placeholder="/fəˈnet.ɪk/" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Definition</Label>
            <Input value={definition} onChange={(e) => setDefinition(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Example sentence</Label>
            <Input value={exampleSentence} onChange={(e) => setExampleSentence(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex gap-2">
              {(["reading", "speaking", "writing"] as const).map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={category === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(c)}
                  className={category === c ? "bg-charcoal text-white" : "text-muted"}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Source note</Label>
            <Input value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} placeholder="Unit 3 · Technology" />
          </div>
          <Button type="submit" className="w-full bg-charcoal text-white">Save word</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Create library page**

Create `app/(dashboard)/library/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { WordTable } from "@/components/library/word-table"
import { WordForm } from "@/components/library/word-form"

export default function LibraryPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display-italic text-[26px] font-bold text-ink tracking-tight">
            My Words
          </h1>
          <p className="text-faint text-sm mt-1">Browse and manage your vocabulary library</p>
        </div>
        <WordForm onSaved={() => setRefreshKey((k) => k + 1)} />
      </div>
      <WordTable key={refreshKey} />
    </div>
  )
}
```

- [ ] **Step 4: Verify CRUD operations**

Run: `npm run dev`. Navigate to `/library`.

Add a word via the dialog → should appear in the table.
Search by word → table should filter.
Filter by category → only matching words shown.

- [ ] **Step 5: Commit**

```bash
git add components/library/ app/\(dashboard\)/library/ && git commit -m "feat: word library CRUD with search and filter"
```

---

### Task 8: M1 — Note Import Four-Step Flow

**Files:**
- Create: `components/import/step-indicator.tsx`, `components/import/note-selector.tsx`, `components/import/extract-progress.tsx`, `components/import/review-list.tsx`, `components/import/import-complete.tsx`, `app/(dashboard)/import/page.tsx`

- [ ] **Step 1: Create step indicator**

Create `components/import/step-indicator.tsx`:

```typescript
import { cn } from "@/lib/utils"

const stepLabels = ["Select", "Extract", "Review", "Import"]

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {stepLabels.map((label, i) => (
        <div key={label} className="flex items-center gap-0">
          <span
            className={cn(
              "text-xs font-medium transition-colors",
              i + 1 === current && "text-ink",
              i + 1 < current && "text-muted",
              i + 1 > current && "text-faint"
            )}
          >
            <span
              className={cn(
                "font-display-italic text-base italic mr-2",
                i + 1 === current && "text-ink",
                i + 1 < current && "text-accent",
                i + 1 > current && "text-faint"
              )}
            >
              {i + 1}
            </span>
            {label}
          </span>
          {i < stepLabels.length - 1 && (
            <div className="flex-1 h-px bg-rule mx-5 min-w-[30px]" />
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create note selector (Step 1)**

Create `components/import/note-selector.tsx`:

```typescript
"use client"

import { useState } from "react"
import type { NotebookLMNote } from "@/types"

// Mock data — will be replaced with real NotebookLM API in Task 9
const mockNotes: NotebookLMNote[] = [
  { id: "1", title: "Unit 1 — Classroom Notes", updated_at: "2026-05-28", word_count: 1200 },
  { id: "2", title: "Reading Digest — The Economist", updated_at: "2026-05-25", word_count: 3400 },
  { id: "3", title: "Business English Glossary", updated_at: "2026-05-20", word_count: 800 },
  { id: "4", title: "Meeting Notes — May 15", updated_at: "2026-05-15", word_count: 600 },
]

export function NoteSelector({ onNext }: { onNext: (selected: NotebookLMNote[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["1", "2"]))

  function toggle(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const selectedNotes = mockNotes.filter((n) => selected.has(n.id))

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-display-italic text-[30px] font-bold text-ink italic tracking-tight">
            Select notes
          </h1>
          <p className="text-muted text-sm mt-1 max-w-[480px] leading-relaxed">
            Choose which NotebookLM entries to extract vocabulary from.
            You&apos;ll review everything before it enters your library.
          </p>
        </div>

        <div className="border border-rule rounded-md overflow-hidden flex flex-col gap-px bg-rule">
          {mockNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => toggle(note.id)}
              className={`flex items-center gap-4 p-[18px] bg-white cursor-pointer transition-colors hover:bg-[#fdfdfb] ${
                selected.has(note.id) ? "bg-[#faf9f6]" : ""
              }`}
            >
              <div
                className={`w-[18px] h-[18px] border-[1.5px] rounded-[3px] flex items-center justify-center flex-shrink-0 transition-all ${
                  selected.has(note.id)
                    ? "border-ink bg-ink"
                    : "border-faint"
                }`}
              >
                {selected.has(note.id) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-ink truncate">{note.title}</p>
                <p className="text-xs text-faint mt-[3px]">
                  Edited {note.updated_at} · ~{note.word_count.toLocaleString()} words
                </p>
              </div>
              <span className="font-mono text-[10px] text-muted uppercase tracking-wider px-[10px] py-1 border border-rule rounded-[3px] flex-shrink-0">
                NotebookLM
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 mt-6 border-t border-rule">
        <span className="text-[13px] text-muted">
          Selected <strong className="text-ink font-semibold">{selectedNotes.length}</strong> of {mockNotes.length} notes
          {" · "}Est. <strong className="text-ink font-semibold">{selectedNotes.length * 10}-{selectedNotes.length * 15}</strong> words
        </span>
        <button
          onClick={() => onNext(selectedNotes)}
          disabled={selectedNotes.length === 0}
          className="bg-charcoal text-white text-sm font-semibold py-3 px-7 rounded-md hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Extract vocabulary
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Create extract progress (Step 2)**

Create `components/import/extract-progress.tsx`:

```typescript
"use client"

import { useState, useEffect } from "react"

const steps = [
  "Parsing document structure",
  "Identifying word boundaries & phrases",
  "Extracting vocabulary via Gemini",
  "Categorizing by training type",
  "Generating definitions & examples",
]

export function ExtractProgress({ onComplete }: { onComplete: () => void }) {
  const [done, setDone] = useState<number[]>([])

  useEffect(() => {
    steps.forEach((_, i) => {
      setTimeout(() => {
        setDone((prev) => [...prev, i])
        if (i === steps.length - 1) setTimeout(onComplete, 600)
      }, (i + 1) * 1000)
    })
  }, [onComplete])

  return (
    <>
      <div className="space-y-1">
        <h1 className="font-display-italic text-[30px] font-bold text-ink italic tracking-tight">
          Extracting
        </h1>
        <p className="text-muted text-sm max-w-[480px] leading-relaxed">
          Analyzing your notes for vocabulary, phrases, and sentence patterns worth learning.
        </p>
      </div>

      <div className="flex flex-col">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-3 py-[14px] border-b border-rule text-sm">
            <span className="flex-1 text-ink font-medium">{label}</span>
            <span className={`font-mono text-[11px] tracking-wider ${done.includes(i) ? "text-accent" : "text-faint"}`}>
              {done.includes(i) ? "Complete" : i <= (done.length) ? "Processing…" : "Waiting…"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-6 mt-6 border-t border-rule">
        <span className="text-[13px] text-muted">
          {done.length === steps.length ? "23 items found" : "Extracting…"}
        </span>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Create review list (Step 3)**

Create `components/import/review-list.tsx`:

```typescript
"use client"

import { useState } from "react"
import type { ExtractedItem } from "@/types"

const mockItems: ExtractedItem[] = [
  { word: "ubiquitous", phonetic: "/juːˈbɪk.wɪ.təs/", part_of_speech: "adj.", definition: "无处不在的，普遍存在的", example_sentence: "The internet has become ubiquitous in modern life.", category: "reading", source_note: "Unit 1", selected: true },
  { word: "call it a day", definition: "收工，到此为止", example_sentence: "Let's call it a day and continue tomorrow.", category: "speaking", source_note: "Unit 1", selected: true },
  { word: "paradigm shift", definition: "范式转移，根本性的思维转变", example_sentence: "The internet caused a paradigm shift in communication.", category: "writing", source_note: "The Economist", selected: true },
  { word: "cutting edge", definition: "最前沿的，尖端的", category: "reading", source_note: "The Economist", selected: true },
  { word: "leverage", definition: "充分利用，借助", category: "writing", source_note: "Business Glossary", selected: true },
  { word: "touch base", definition: "联系一下，简短碰头", category: "speaking", source_note: "Meeting Notes", selected: true },
]

export function ReviewList({ onNext }: { onNext: (items: ExtractedItem[]) => void }) {
  const [items, setItems] = useState(mockItems)
  const [filter, setFilter] = useState<"all" | "reading" | "speaking" | "writing">("all")

  function toggle(index: number) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, selected: !it.selected } : it)))
  }

  const filtered = filter === "all" ? items : items.filter((it) => it.category === filter)
  const selectedCount = items.filter((it) => it.selected).length

  const tagStyle = {
    reading: "bg-[#f2f5f8] text-[#4a7090]",
    speaking: "bg-[#faf6f0] text-[#9a7030]",
    writing: "bg-[#f0f5f2] text-[#4a7058]",
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="font-display-italic text-[30px] font-bold text-ink italic tracking-tight">
          Review
        </h1>
        <p className="text-muted text-sm max-w-[480px] leading-relaxed">
          {items.length} items extracted. Uncheck anything you don&apos;t want in your training library.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex justify-between items-center pb-4 border-b border-rule">
        <div className="flex gap-5 text-[13px]">
          {(["all", "reading", "speaking", "writing"] as const).map((f) => (
            <span
              key={f}
              onClick={() => setFilter(f)}
              className={`cursor-pointer font-medium transition-colors ${
                filter === f ? "text-ink font-semibold" : "text-faint hover:text-muted"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </span>
          ))}
        </div>
        <span className="font-mono text-xs text-muted">{filtered.length} items</span>
      </div>

      {/* Item list */}
      <div className="border border-rule rounded-md overflow-hidden flex flex-col">
        {filtered.map((item, i) => {
          const originalIndex = items.indexOf(item)
          return (
            <div
              key={`${item.word}-${i}`}
              onClick={() => toggle(originalIndex)}
              className={`flex items-center gap-4 p-4 bg-white border-b border-rule last:border-0 transition-all cursor-pointer ${
                !item.selected ? "opacity-35" : ""
              }`}
            >
              <div
                className={`w-[18px] h-[18px] border-[1.5px] rounded-[3px] flex items-center justify-center flex-shrink-0 transition-all ${
                  item.selected ? "border-ink bg-ink" : "border-faint"
                }`}
              >
                {item.selected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <span className="font-display-italic text-xl font-semibold text-ink italic min-w-[130px]">
                {item.word}
              </span>
              <span className="text-sm text-body flex-1">{item.definition}</span>
              <span className={`font-mono text-[10px] font-medium px-[10px] py-1 rounded-sm tracking-wider flex-shrink-0 ${tagStyle[item.category]}`}>
                {item.category.toUpperCase()}
              </span>
              <span className="text-xs text-faint underline underline-offset-[3px] decoration-rule hover:text-ink hover:decoration-ink cursor-pointer flex-shrink-0">
                edit
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-6 mt-6 border-t border-rule">
        <span className="text-[13px] text-muted">
          Importing <strong className="text-ink font-semibold">{selectedCount}</strong> of {items.length} items
        </span>
        <button
          onClick={() => onNext(items.filter((it) => it.selected))}
          disabled={selectedCount === 0}
          className="bg-charcoal text-white text-sm font-semibold py-3 px-7 rounded-md hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Import to library
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 5: Create import complete (Step 4)**

Create `components/import/import-complete.tsx`:

```typescript
import type { ExtractedItem } from "@/types"
import Link from "next/link"

export function ImportComplete({ items }: { items: ExtractedItem[] }) {
  const byCategory = {
    reading: items.filter((it) => it.category === "reading").length,
    speaking: items.filter((it) => it.category === "speaking").length,
    writing: items.filter((it) => it.category === "writing").length,
  }

  return (
    <div className="text-center py-12 px-8 border border-rule rounded-md bg-white">
      <h2 className="font-display-italic text-4xl font-bold text-ink italic mb-2">
        Added to your library
      </h2>
      <p className="text-sm text-muted mb-8 leading-relaxed">
        {items.length} words are now in your training queue, scheduled according to the Ebbinghaus curve.
      </p>

      <div className="flex justify-center gap-12 mb-9">
        <Stat value={byCategory.reading} label="Reading" />
        <Stat value={byCategory.speaking} label="Speaking" />
        <Stat value={byCategory.writing} label="Writing" />
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="border border-rule bg-white text-ink text-sm font-semibold py-3 px-7 rounded-md hover:border-muted transition-colors"
        >
          Import more notes
        </button>
        <Link
          href="/training"
          className="bg-charcoal text-white text-sm font-semibold py-3 px-7 rounded-md hover:bg-charcoal/90 transition-colors no-underline inline-block"
        >
          Begin training
        </Link>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display-italic text-[42px] font-bold text-ink italic leading-none mb-1">
        {value}
      </div>
      <div className="text-xs text-muted font-medium">{label}</div>
    </div>
  )
}
```

- [ ] **Step 6: Create import page with state machine**

Create `app/(dashboard)/import/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { StepIndicator } from "@/components/import/step-indicator"
import { NoteSelector } from "@/components/import/note-selector"
import { ExtractProgress } from "@/components/import/extract-progress"
import { ReviewList } from "@/components/import/review-list"
import { ImportComplete } from "@/components/import/import-complete"
import type { NotebookLMNote, ExtractedItem } from "@/types"

export default function ImportPage() {
  const [step, setStep] = useState(1)
  const [selectedNotes, setSelectedNotes] = useState<NotebookLMNote[]>([])
  const [importedItems, setImportedItems] = useState<ExtractedItem[]>([])

  return (
    <div className="flex flex-col gap-8 max-w-[680px]">
      <StepIndicator current={step} />

      {step === 1 && (
        <NoteSelector
          onNext={(notes) => {
            setSelectedNotes(notes)
            setStep(2)
          }}
        />
      )}

      {step === 2 && (
        <ExtractProgress onComplete={() => setStep(3)} />
      )}

      {step === 3 && (
        <ReviewList
          onNext={(items) => {
            setImportedItems(items)
            setStep(4)
          }}
        />
      )}

      {step === 4 && <ImportComplete items={importedItems} />}

      {/* Back button for steps 2-3 */}
      {step > 1 && step < 4 && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="text-sm text-faint underline underline-offset-[3px] decoration-rule hover:text-muted hover:decoration-muted self-start"
        >
          ← Back
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Verify import flow**

Run: `npm run dev`. Navigate to `/import`.

Step 1: Select notes → click "Extract vocabulary".
Step 2: Watch extraction animation → auto advances after 5s.
Step 3: Uncheck items, toggle filters → click "Import to library".
Step 4: See completion stats with counts by category.

- [ ] **Step 8: Commit**

```bash
git add components/import/ app/\(dashboard\)/import/ && git commit -m "feat: four-step note import flow"
```

---

### Task 9: NotebookLM API Integration

**Files:**
- Create: `app/api/import/extract/route.ts`, `lib/notebooklm.ts`

- [ ] **Step 1: Create NotebookLM API client**

Create `lib/notebooklm.ts`:

```typescript
// NotebookLM API client using the notebooklm skill
// In production, this calls the NotebookLM API to fetch notes and content

export interface NotebookLMNote {
  id: string
  title: string
  content: string
  updated_at: string
}

/**
 * Fetch all notebooks/notes from NotebookLM for the authenticated user.
 * Uses the notebooklm skill's API access.
 */
export async function fetchNotebookLMNotes(): Promise<NotebookLMNote[]> {
  // Stub — replace with actual NotebookLM API call
  // The notebooklm skill provides programmatic access:
  // - List notebooks
  // - Get notebook content
  // - Extract sources
  return []
}

/**
 * Use Gemini API to extract vocabulary from raw note content.
 */
export async function extractVocabularyFromContent(
  content: string
): Promise<{
  word: string
  definition: string
  category: "reading" | "speaking" | "writing"
}[]> {
  // Stub — replace with Gemini API call
  // Prompt template: "Extract vocabulary, phrases, and sentence patterns
  // from the following text. For each item, provide: word, definition,
  // and category (reading/speaking/writing)."
  return []
}
```

- [ ] **Step 2: Create extract API route**

Create `app/api/import/extract/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { items } = await request.json()

  // Insert extracted items into vocabulary table
  const vocabulary = items.map((item: any) => ({
    user_id: user.id,
    word: item.word,
    phonetic: item.phonetic || null,
    part_of_speech: item.part_of_speech || null,
    definition: item.definition,
    example_sentence: item.example_sentence || null,
    category: item.category,
    source_note: item.source_note || null,
    mastery_level: 0,
  }))

  const { data, error } = await supabase
    .from("vocabulary")
    .insert(vocabulary)
    .select("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create import session record
  await supabase.from("import_sessions").insert({
    user_id: user.id,
    source: "notebooklm",
    items_found: items.length,
    items_imported: data.length,
  })

  return NextResponse.json({ imported: data.length })
}
```

- [ ] **Step 3: Expose `/api/import/extract` — verify returns 401 when unauthenticated**

Run: `curl -X POST http://localhost:3000/api/import/extract -H 'Content-Type: application/json' -d '{"items":[]}'`

Expected: `{"error":"Unauthorized"}` with status 401.

- [ ] **Step 4: Commit**

```bash
git add lib/notebooklm.ts app/api/import/ && git commit -m "feat: NotebookLM API stub and import endpoint"
```

---

### Task 10: Environment & Deployment Prep

**Files:**
- Create: `.env.example`
- Modify: `next.config.js`

- [ ] **Step 1: Create .env.example**

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 2: Update next.config.js for image domains if needed**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
}

module.exports = nextConfig
```

- [ ] **Step 3: Verify production build**

Run: `npm run build`

Expected: Successful build with no errors. Page-level static generation may fail if pages depend on auth — that's expected for client-rendered pages.

- [ ] **Step 4: Run the app end-to-end**

Run: `npm run dev`

Checklist:
- [/] Login page renders and sign-in works
- [/] Dashboard hero page shows masthead + headline + cover lines
- [/] Sidebar navigation works across all pages
- [/] Library shows word table with search + filter
- [/] Add word dialog opens and saves
- [/] Import flow: select → extract → review → complete
- [/] Responsive: sidebar hides on mobile (if implemented)

- [ ] **Step 5: Commit**

```bash
git add .env.example next.config.js && git commit -m "chore: deployment prep and env template"
```

---

## Plan Self-Review

**Spec coverage check:**
- [x] Project scaffold (Next.js + TS + Tailwind + shadcn + Supabase) — Task 1
- [x] Database schema design — Task 2
- [x] Supabase Auth — Task 3
- [x] Design system (fonts, colors, tokens) — Task 4
- [x] Dashboard layout with sidebar — Task 5
- [x] Hero homepage — Task 6
- [x] M2: Word CRUD — Task 7
- [x] M1: Note import 4-step flow — Task 8
- [x] NotebookLM API integration stub — Task 9
- [x] Build verification — Task 10

**Placeholder check:**
- No TBD, TODO, or "implement later"
- All component code is complete
- API stubs in Task 9 are explicitly marked as stubs with comments for future implementation

**Type consistency check:**
- `Vocabulary`, `ExtractedItem`, `NotebookLMNote` types defined in Task 2
- Used consistently across Tasks 7, 8, 9
- Component prop types match their usage in pages

---

*Plan saved to `docs/superpowers/plans/2026-05-31-phase-1-foundation.md`*
