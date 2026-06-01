"use client"

import { TrainingHeatmap } from "@/components/stats/heatmap"

export default function StatisticsPage() {
  return (
    <div className="flex flex-col gap-6">

      {/* Hero banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-charcoal rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-[-40px] right-[-20px] w-36 h-36 rounded-full bg-white/[0.03]" />
          <p className="text-xs font-medium text-white/40 tracking-wide relative z-10">Total vocabulary</p>
          <p className="font-[family-name:var(--font-display)] italic text-6xl font-bold leading-none mt-2 relative z-10">486</p>
          <p className="text-sm text-white/40 mt-2 relative z-10"><strong className="text-gold font-bold">+22</strong> added this week</p>
        </div>
        <div className="bg-white border border-rule rounded-2xl p-8 shadow-card-md">
          <p className="text-xs font-medium text-faint tracking-wide">Current streak</p>
          <p className="font-[family-name:var(--font-display)] italic text-6xl font-bold text-ink leading-none mt-2">7</p>
          <p className="text-sm text-muted mt-2">consecutive days · best <strong className="text-accent-brand font-bold">14</strong></p>
        </div>
      </div>

      {/* Heatmap */}
      <TrainingHeatmap />

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-rule rounded-2xl p-6 shadow-card-md">
          <h3 className="text-sm font-semibold text-ink mb-5">Mastery by category</h3>
          {[
            { label: "Reading", pct: 78 },
            { label: "Speaking", pct: 45 },
            { label: "Writing", pct: 62 },
          ].map(({ label, pct }) => (
            <div key={label} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[13px] font-medium text-ink min-w-[70px]">{label}</span>
              <div className="flex-1 h-2 bg-[#ebeef2] rounded-sm overflow-hidden">
                <div className="h-full bg-charcoal rounded-sm" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono text-xs text-muted min-w-[36px] text-right">{pct}%</span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-rule rounded-2xl p-6 shadow-card-md">
          <h3 className="text-sm font-semibold text-ink mb-4">Upcoming reviews</h3>
          {[
            { day: "Today", count: 8, types: "Reading · Writing" },
            { day: "Tomorrow", count: 14, types: "All categories" },
            { day: "In 2 days", count: 6, types: "Reading" },
            { day: "In 4 days", count: 11, types: "Speaking · Writing" },
          ].map(({ day, count, types }) => (
            <div key={day} className="flex items-center gap-3 py-3 border-b border-rule last:border-0">
              <span className="w-2 h-2 rounded-full bg-charcoal flex-shrink-0" />
              <span className="font-mono text-[11px] font-semibold text-muted min-w-[72px]">{day}</span>
              <span className="text-sm font-bold text-ink">{count} words</span>
              <span className="text-[11px] text-faint">{types}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
