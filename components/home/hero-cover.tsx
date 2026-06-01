"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Stats {
  totalWords: number
  addedThisWeek: number
  todayReview: number
  errorBacklog: number
  tomorrowReview: number
}

export function HeroCover() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-center gap-12">
      {/* Masthead */}
      <div className="flex items-baseline gap-4 pb-5 border-b border-rule">
        <span className="font-display italic text-[26px] font-bold text-ink tracking-tight">
          yeeehh&apos;s lab
        </span>
        <span className="font-mono text-[11px] text-faint tracking-wider">
          {todayDate}
        </span>
      </div>

      {/* Cover content: two columns */}
      <div className="grid grid-cols-[1fr_1fr] gap-12 items-start">
        {/* Left: main story */}
        <div className="flex flex-col gap-5">
          <span className="text-[11px] font-semibold text-faint tracking-[2.5px] uppercase">
            Today&apos;s review
          </span>
          <h1 className="font-display italic text-[88px] font-extrabold text-ink leading-[0.92] tracking-[-1.5px]">
            {stats ? `${stats.todayReview} word${stats.todayReview !== 1 ? "s" : ""} await` : "..."}
          </h1>
          <p className="text-[15px] text-muted leading-relaxed max-w-[360px]">
            {stats && stats.todayReview > 0
              ? "Your daily review is ready. Words are scheduled based on the Ebbinghaus forgetting curve."
              : "All caught up! Import some notes to build your vocabulary."}
          </p>
          <Link
            href="/training"
            className="inline-block bg-charcoal text-white text-sm font-bold py-[14px] px-9 rounded-md no-underline hover:bg-charcoal/90 transition-colors self-start"
          >
            {stats && stats.todayReview > 0 ? "Begin training" : "Browse library"}
          </Link>
        </div>

        {/* Right: cover lines */}
        <div className="flex flex-col gap-7 pt-40">
          <CoverLine
            number={stats ? String(stats.todayReview) : "—"}
            label="Words to review"
            detail={stats?.tomorrowReview ? `Next wave: ${stats.tomorrowReview}` : "No upcoming reviews"}
          />
          <CoverLine
            number={stats ? String(stats.totalWords) : "—"}
            label="Total vocabulary"
            detail={stats?.addedThisWeek ? `added this week` : ""}
            detailBold={stats?.addedThisWeek ? `+${stats.addedThisWeek}` : undefined}
          />
          <CoverLine
            number={stats ? String(stats.errorBacklog) : "—"}
            label="Error backlog"
            detail={stats?.errorBacklog ? "Needs extra practice" : "All clear"}
          />
        </div>
      </div>

      {/* Folio */}
      <div className="flex justify-between items-center pt-8 mt-8 border-t border-rule text-[11px] text-faint font-medium">
        <div className="flex gap-6">
          <Link href="/import" className="no-underline text-faint hover:text-muted transition-colors">Import notes</Link>
          <Link href="/statistics" className="no-underline text-faint hover:text-muted transition-colors">Statistics</Link>
          <Link href="/library" className="no-underline text-faint hover:text-muted transition-colors">Browse library</Link>
        </div>
        <div>
          <span className="font-mono uppercase">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          {stats && stats.tomorrowReview > 0 && (
            <>&nbsp;·&nbsp;<span>Next review: {stats.tomorrowReview} words</span></>
          )}
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
      <span className="font-display italic text-[32px] font-bold text-ink leading-none">
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
