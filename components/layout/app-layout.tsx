import { Sidebar } from "./sidebar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 max-w-[1120px] mx-auto min-h-screen px-8 py-0">
      <Sidebar />
      <main className="flex-1 py-8">{children}</main>
    </div>
  )
}
