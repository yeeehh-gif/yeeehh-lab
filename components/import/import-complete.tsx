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
      <h2 className="font-[family-name:var(--font-display)] italic text-4xl font-bold text-ink mb-2">
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
      <div className="font-[family-name:var(--font-display)] italic text-[42px] font-bold text-ink leading-none mb-1">
        {value}
      </div>
      <div className="text-xs text-muted font-medium">{label}</div>
    </div>
  )
}
