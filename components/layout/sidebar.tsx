"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

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
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || null)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <aside className="w-[200px] flex-shrink-0 flex flex-col justify-between py-8 min-h-screen">
      <div>
        <Link href="/dashboard" className="font-display italic text-[22px] font-semibold text-ink mb-8 px-[10px] tracking-tight no-underline block">
          yeeehh&apos;s lab
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
      </div>

      {/* User section */}
      <div className="px-[10px] pt-6 border-t border-rule">
        {email && (
          <p className="text-[11px] text-faint font-medium mb-3 truncate" title={email}>
            {email}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="text-xs font-medium text-muted hover:text-ink transition-colors underline underline-offset-2"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
