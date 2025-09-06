import { addMinutes, isBefore } from 'date-fns'
import { eventRepo } from '@/repos/eventRepo'
import { taskRepo } from '@/repos/taskRepo'
import type { Task } from '@/types/models'

export async function autoPlanToday(): Promise<{ placed: Task[]; conflicts: Task[] }> {
  const now = new Date()
  const start = new Date(now)
  start.setHours(7, 0, 0, 0)
  const end = new Date(now)
  end.setHours(22, 0, 0, 0)
  const events = await eventRepo.list({ start: start.toISOString(), end: end.toISOString() })
  const busy = events.map(e => ({ s: new Date(e.start), e: new Date(e.end) }))
  const tasks = (await taskRepo.list({ status: 'inbox' }))
    .filter(t => (t.priority === 'now' || t.priority === 'soon'))
    .slice(0, 5)

  const placed: Task[] = []
  const conflicts: Task[] = []

  let cursor = new Date(now.getTime())
  if (isBefore(cursor, start)) cursor = new Date(start)

  function findNextSlot(durationMin: number): { s: Date; e: Date } | null {
    let s = new Date(cursor)
    while (s < end) {
      const e = addMinutes(s, durationMin)
      const overlap = busy.some(b => !(e <= b.s || s >= b.e))
      if (!overlap && e <= end) return { s, e }
      s = addMinutes(s, 15)
    }
    return null
  }

  for (const t of tasks) {
    const dur = t.effort_minutes ?? 30
    const slot = findNextSlot(dur)
    if (!slot) { conflicts.push(t); continue }
    const nowIso = new Date().toISOString()
    await taskRepo.update(t.id, { status: 'scheduled', scheduled_start: slot.s.toISOString(), scheduled_end: slot.e.toISOString(), updated_at: nowIso })
    await eventRepo.create({ id: crypto.randomUUID(), task_id: t.id, title: t.title, health_domain: t.health_domain, intended_use: t.intended_use, start: slot.s.toISOString(), end: slot.e.toISOString(), is_all_day: false, source: 'manual', created_at: nowIso, updated_at: nowIso })
    busy.push({ s: slot.s, e: slot.e })
    cursor = addMinutes(slot.e, 15)
    placed.push(t)
  }

  return { placed, conflicts }
}


