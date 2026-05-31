"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function WordForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState("")
  const [definition, setDefinition] = useState("")
  const [phonetic, setPhonetic] = useState("")
  const [partOfSpeech, setPartOfSpeech] = useState("")
  const [exampleSentence, setExampleSentence] = useState("")
  const [category, setCategory] = useState<"reading" | "speaking" | "writing">("reading")
  const [sourceNote, setSourceNote] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("vocabulary").insert({
      user_id: user.id,
      word,
      definition,
      phonetic: phonetic || null,
      part_of_speech: partOfSpeech || null,
      example_sentence: exampleSentence || null,
      category,
      source_note: sourceNote || null,
    })

    setOpen(false)
    setWord(""); setDefinition(""); setPhonetic(""); setPartOfSpeech("")
    setExampleSentence(""); setSourceNote("")
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-charcoal text-white hover:bg-charcoal/90">Add word</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] italic text-xl font-bold text-ink">
            Add word
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Word</Label>
              <Input value={word} onChange={(e) => setWord(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Part of speech</Label>
              <Input
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="adj."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phonetic</Label>
            <Input value={phonetic} onChange={(e) => setPhonetic(e.target.value)} placeholder="/fəˈnet.ɪk/" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Definition</Label>
            <Input value={definition} onChange={(e) => setDefinition(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Example sentence</Label>
            <Input value={exampleSentence} onChange={(e) => setExampleSentence(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex gap-2">
              {(["reading", "speaking", "writing"] as const).map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={category === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(c)}
                  className={category === c ? "bg-charcoal text-white" : "text-muted"}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Source note</Label>
            <Input value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} placeholder="Unit 3 · Technology" />
          </div>
          <Button type="submit" className="w-full bg-charcoal text-white">Save word</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
