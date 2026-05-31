import Link from "next/link"

export function HeroCover() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-center gap-12">
      {/* Masthead */}
      <div className="flex items-baseline gap-4 pb-5 border-b border-rule">
        <span className="font-display italic text-[26px] font-bold text-ink tracking-tight">
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
          <h1 className="font-display italic text-[88px] font-extrabold text-ink leading-[0.92] tracking-[-1.5px]">
            8 words await
          </h1>
          <p className="text-[15px] text-muted leading-relaxed max-w-[360px]">
            Your daily review is ready.{" "}
            <em className="font-display italic not-italic font-semibold text-ink">Reading</em>{" "}
            vocabulary from last week&apos;s Economist digest, plus{" "}
            <em className="font-display italic not-italic font-semibold text-ink">writing</em>{" "}
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
