import { useEffect, useState } from 'react'
import type { Routine } from '@/types/models'
import { routineRepo } from '@/repos/routineRepo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function RoutinesPanel() {
  const [items, setItems] = useState<Routine[]>([])
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState<'time'|'finance'|'physical'|'mental'|'social'|'spiritual'|'admin'>('time')
  const [use, setUse] = useState<'plan'|'execute'|'review'|'learn'|'budget'|'recover'|'reflect'>('execute')
  const [minutes, setMinutes] = useState(60)

  useEffect(() => { refresh() }, [])
  async function refresh() { setItems(await routineRepo.list()) }

  async function add() {
    if (!title.trim()) return
    await routineRepo.create({
      id: crypto.randomUUID(),
      title,
      default_health_domain: domain,
      default_intended_use: use,
      default_time_block: minutes,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Routine)
    setTitle('')
    await refresh()
  }

  async function apply(r: Routine) {
    const start = new Date()
    start.setHours(8, 0, 0, 0)
    await routineRepo.apply(r.id, { startDate: start.toISOString() })
    alert('Routine applied and scheduled')
  }

  return (
    <div className="space-y-3 p-2">
      <div className="flex gap-2 items-center">
        <Input placeholder="Routine title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select value={domain} onValueChange={(v) => setDomain(v as any)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Domain"/></SelectTrigger>
          <SelectContent>
            {['time','finance','physical','mental','social','spiritual','admin'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={use} onValueChange={(v) => setUse(v as any)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Use"/></SelectTrigger>
          <SelectContent>
            {['plan','execute','review','learn','budget','recover','reflect'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="number" className="w-28" value={minutes} onChange={(e)=> setMinutes(parseInt(e.target.value||'60',10))} />
        <Button onClick={add}>Add</Button>
      </div>
      <div className="space-y-2">
        {items.map(r => (
          <div key={r.id} className="border rounded p-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.default_health_domain} • {r.default_intended_use} • {r.default_time_block ?? 60}m</div>
            </div>
            <div className="space-x-2">
              <Button size="sm" onClick={() => apply(r)}>Apply</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


