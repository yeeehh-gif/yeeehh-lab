import { TrainingSession } from "@/components/training/training-session"

export default function TrainingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="font-[family-name:var(--font-display)] italic text-[26px] font-bold text-ink tracking-tight">Training</h1>
        <p className="text-faint text-sm mt-1">Reading practice · Ebbinghaus schedule</p>
      </div>
      <TrainingSession />
    </div>
  )
}
