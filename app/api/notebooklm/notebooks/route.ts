import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

interface NotebookLMSource {
  id: string
  title: string
  type: string
  url: string | null
  status: string
}

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Get all notebooks
    const { stdout: nbOut } = await execFileAsync("notebooklm", ["list", "--json"], {
      timeout: 15000,
      env: { ...process.env },
    })
    const nbData = JSON.parse(nbOut)
    const notebooks = nbData.notebooks || []

    // For each notebook, get its sources
    const result = []
    for (const nb of notebooks) {
      const notebook = {
        id: nb.id,
        name: nb.title || "(Untitled)",
        created_at: nb.created_at || "",
        is_owner: nb.is_owner,
        sources: [] as NotebookLMSource[],
      }

      try {
        const { stdout: srcOut } = await execFileAsync(
          "notebooklm",
          ["source", "list", "--json", "-n", nb.id],
          { timeout: 15000, env: { ...process.env } }
        )
        const srcData = JSON.parse(srcOut)
        notebook.sources = (srcData.sources || []).map((s: any) => ({
          id: s.id,
          title: s.title || "Untitled source",
          type: s.type || "unknown",
          url: s.url || null,
          status: s.status || "unknown",
        }))
      } catch {
        // Notebook may have no sources — that's fine
      }

      result.push(notebook)
    }

    return NextResponse.json({ notebooks: result, count: result.length })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch notebooks", detail: err.message },
      { status: 500 }
    )
  }
}
