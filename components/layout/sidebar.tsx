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
      <Link href="/dashboard" className="font-display italic text-[22px] font-semibold text-ink mb-8 px-[10px] tracking-tight no-underline">
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
    </aside>
  )
}
