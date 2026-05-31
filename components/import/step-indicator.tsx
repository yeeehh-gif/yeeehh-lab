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
                "font-[family-name:var(--font-display)] italic text-base mr-2",
                i + 1 === current && "text-ink",
                i + 1 < current && "text-accent-brand",
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
