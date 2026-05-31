export function GoalProgress({ done, goal }: { done: number; goal: number }) {
  const pct = Math.min(Math.round((done / goal) * 100), 100)

  return (
    <div className="flex items-center gap-5">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: `conic-gradient(var(--color-charcoal, #1e1e1e) 0deg ${pct * 3.6}deg, #ebeef2 ${pct * 3.6}deg 360deg)`,
        }}
      >
        <div className="w-[62px] h-[62px] rounded-full bg-white flex items-center justify-center">
          <span className="text-xl font-extrabold text-ink">{done}</span>
        </div>
      </div>
      <div>
        <p className="text-[15px] font-bold text-ink">{done} / {goal}</p>
        <p className="text-xs text-faint mt-0.5">Today&apos;s goal</p>
        <div className="flex flex-col gap-1 mt-3 text-xs text-muted font-medium">
          <span>Reading · 8 / 10</span>
          <span>Speaking · 5 / 6</span>
          <span>Writing · 3 / 4</span>
        </div>
      </div>
    </div>
  )
}
