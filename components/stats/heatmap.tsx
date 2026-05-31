export function TrainingHeatmap() {
  const totalDays = 26 * 7 // ~6 months
  const levels: number[] = Array.from({ length: totalDays }, (_, i) => {
    const recent = i > totalDays - 30
    return recent ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 3)
  })

  const colors = ["bg-[#ebeef2]", "bg-[#c8dbe4]", "bg-[#8ab8ce]", "bg-[#4a90b0]", "bg-[#2a5f78]"]

  return (
    <div className="bg-white border border-rule rounded-2xl p-6 shadow-card-md">
      <h3 className="text-sm font-semibold text-ink mb-1">Training activity</h3>
      <p className="text-[11px] text-faint mb-4">Last 6 months · each square is one day</p>
      <div className="flex gap-0.5 flex-wrap">
        {levels.map((l, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${colors[l]}`} />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-faint font-medium">
        <span>Jun</span><span>Aug</span><span>Oct</span><span>Dec</span><span>Feb</span><span>Apr</span><span>May</span>
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end text-[10px] text-faint">
        Less {colors.map((c, i) => <span key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />)} More
      </div>
    </div>
  )
}
