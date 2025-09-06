import { db } from '@/db/dexie'
import type { Task, Routine, CalendarEvent, FinanceEntry } from '@/types/models'

function nowIso() { return new Date().toISOString() }

export async function seedDemo() {
  const count = await db.tasks.count()
  if (count > 0) return

  const tasks: Task[] = [
    { id: crypto.randomUUID(), title: 'Pay rent', health_domain: 'finance', intended_use: 'budget', priority: 'now', effort_minutes: 10, due_at: new Date(new Date().getFullYear(), new Date().getMonth()+1, 1).toISOString(), recurrence_rule: 'FREQ=MONTHLY;BYMONTHDAY=1', status: 'inbox', tags: [], source: 'manual', created_at: nowIso(), updated_at: nowIso() },
    { id: crypto.randomUUID(), title: 'Gym Push Day', health_domain: 'physical', intended_use: 'execute', priority: 'soon', effort_minutes: 60, status: 'inbox', tags: ['gym'], source: 'manual', created_at: nowIso(), updated_at: nowIso() },
    { id: crypto.randomUUID(), title: 'Deep work CS240', health_domain: 'time', intended_use: 'execute', priority: 'soon', effort_minutes: 120, recurrence_rule: 'FREQ=WEEKLY;BYDAY=TU,TH;BYHOUR=14;BYMINUTE=0', status: 'inbox', tags: ['study'], source: 'manual', created_at: nowIso(), updated_at: nowIso() },
    { id: crypto.randomUUID(), title: 'Evening reflection', health_domain: 'mental', intended_use: 'reflect', priority: 'later', effort_minutes: 5, recurrence_rule: 'FREQ=DAILY;BYHOUR=20;BYMINUTE=30', status: 'inbox', tags: [], source: 'manual', created_at: nowIso(), updated_at: nowIso() },
  ]

  const routines: Routine[] = [
    { id: crypto.randomUUID(), title: 'Morning Focus Block', default_health_domain: 'time', default_intended_use: 'execute', default_time_block: 90, default_slots: 'weekdays 08:00', default_tags: ['focus'], default_checklist: ['Plan', 'Focus', 'Review'], active: true, created_at: nowIso(), updated_at: nowIso() },
  ]

  const finance: FinanceEntry[] = [
    { id: crypto.randomUUID(), title: 'Groceries Costco', amount: 85.25, date: new Date().toISOString(), category: 'groceries', health_domain: 'finance', notes: '', tags: ['groceries'], created_at: nowIso(), updated_at: nowIso(), recurring: false },
  ]

  await db.transaction('rw', db.tasks, db.routines, db.finance, async () => {
    await db.tasks.bulkAdd(tasks)
    await db.routines.bulkAdd(routines)
    await db.finance.bulkAdd(finance)
  })
}


