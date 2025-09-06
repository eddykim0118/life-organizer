import { useEffect, useState } from 'react'
import type { Suggestion } from '@/types/models'
import { generateAllSuggestions } from '@/services/suggestionEngine'
import { suggestionRepo } from '@/repos/suggestionRepo'
import { Button } from '@/components/ui/button'
import { taskRepo } from '@/repos/taskRepo'

export function SuggestionsPanel() {
  const [items, setItems] = useState<Suggestion[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const generated = await generateAllSuggestions()
    const now = new Date().toISOString()
    for (const s of generated) await suggestionRepo.upsert(s)
    const active = await suggestionRepo.listActive(now)
    setItems(active)
  }

  async function accept(s: Suggestion) {
    if (s.suggestion_type === 'reflection') {
      const when = (s.payload as any).when
      const now = new Date().toISOString()
      await taskRepo.create({
        id: crypto.randomUUID(),
        title: 'Evening reflection',
        health_domain: 'mental',
        intended_use: 'reflect',
        priority: 'soon',
        status: 'scheduled',
        tags: [],
        source: 'suggestion_accepted',
        created_at: now,
        updated_at: now,
        scheduled_start: when,
        scheduled_end: new Date(new Date(when).getTime()+5*60000).toISOString(),
      } as any)
    }
    await suggestionRepo.delete(s.id)
    load()
  }

  async function dismiss(s: Suggestion) {
    await suggestionRepo.delete(s.id)
    load()
  }

  return (
    <div className="space-y-2 p-2">
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No suggestions right now.</div>
      ) : items.map(s => (
        <div key={s.id} className="border rounded p-2 flex items-center justify-between">
          <div>
            <div className="font-medium capitalize">{s.suggestion_type.replace('_',' ')}</div>
            <div className="text-xs text-muted-foreground">{s.explanation}</div>
          </div>
          <div className="space-x-2">
            <Button size="sm" onClick={() => accept(s)}>Accept</Button>
            <Button size="sm" variant="secondary" onClick={() => dismiss(s)}>Dismiss</Button>
          </div>
        </div>
      ))}
    </div>
  )
}


