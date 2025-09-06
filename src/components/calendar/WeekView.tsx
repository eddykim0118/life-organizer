import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, addMinutes, endOfWeek, format, startOfDay, startOfWeek } from 'date-fns'
import { eventRepo } from '@/repos/eventRepo'
import { taskRepo } from '@/repos/taskRepo'
import type { CalendarEvent, Task } from '@/types/models'
import { Button } from '@/components/ui/button'

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6:00 - 21:00
const HOUR_PX = 48

function snapMinutes(date: Date, step: number) {
  const ms = 1000 * 60 * step
  return new Date(Math.round(date.getTime() / ms) * ms)
}

export function WeekView() {
  const [anchor, setAnchor] = useState(new Date())
  const weekStart = useMemo(() => startOfWeek(anchor, { weekStartsOn: 1 }), [anchor])
  const weekEnd = useMemo(() => endOfWeek(anchor, { weekStartsOn: 1 }), [anchor])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [unscheduled, setUnscheduled] = useState<Task[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  const [dragSel, setDragSel] = useState<{ dayIndex: number, y1: number, y2: number } | null>(null)

  useEffect(() => {
    refresh()
  }, [weekStart, weekEnd])

  async function refresh() {
    const [ev, tasks] = await Promise.all([
      eventRepo.list({ start: weekStart.toISOString(), end: weekEnd.toISOString() }),
      taskRepo.list({ status: 'inbox' })
    ])
    setEvents(ev)
    setUnscheduled(tasks)
  }

  function dayDate(i: number) {
    return addDays(weekStart, i)
  }

  function yToTime(y: number) {
    const hour0 = HOURS[0]
    const totalMinutes = (y / HOUR_PX) * 60 + hour0 * 60
    const h = Math.floor(totalMinutes / 60)
    const m = Math.floor(totalMinutes % 60)
    return { h, m }
  }

  function onDrop(e: React.DragEvent, dayIndex: number) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/task-id')
    if (!taskId || !gridRef.current) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const { h, m } = yToTime(y)
    const start = new Date(dayDate(dayIndex))
    start.setHours(h, m, 0, 0)
    const snapped = snapMinutes(start, 15)
    const end = addMinutes(snapped, 30)
    scheduleTask(taskId, snapped, end)
  }

  async function scheduleTask(taskId: string, start: Date, end: Date) {
    const t = await taskRepo.get(taskId)
    if (!t) return
    const now = new Date().toISOString()
    await taskRepo.update(taskId, {
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      status: 'scheduled',
      updated_at: now,
    })
    await eventRepo.create({
      id: crypto.randomUUID(),
      task_id: taskId,
      title: t.title,
      health_domain: t.health_domain,
      intended_use: t.intended_use,
      start: start.toISOString(),
      end: end.toISOString(),
      is_all_day: false,
      source: 'manual',
      created_at: now,
      updated_at: now,
    })
    refresh()
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function onMouseDown(dayIndex: number, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    setDragSel({ dayIndex, y1: y, y2: y })
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragSel) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    setDragSel({ ...dragSel, y2: y })
  }

  function onMouseUp() {
    if (!dragSel) return setDragSel(null)
    const { y1, y2, dayIndex } = dragSel
    const top = Math.min(y1, y2)
    const bottom = Math.max(y1, y2)
    const { h: h1, m: m1 } = yToTime(top)
    const { h: h2, m: m2 } = yToTime(bottom)
    const d1 = new Date(dayDate(dayIndex))
    d1.setHours(h1, m1, 0, 0)
    const d2 = new Date(dayDate(dayIndex))
    d2.setHours(h2, m2, 0, 0)
    const start = snapMinutes(d1, 15)
    const end = snapMinutes(d2, 15)
    createBlock(start < end ? start : startOfDay(d1), end > start ? end : addMinutes(start, 30))
    setDragSel(null)
  }

  async function createBlock(start: Date, end: Date) {
    const now = new Date().toISOString()
    await eventRepo.create({
      id: crypto.randomUUID(),
      title: 'New block',
      health_domain: 'time',
      intended_use: 'plan',
      start: start.toISOString(),
      end: end.toISOString(),
      is_all_day: false,
      source: 'manual',
      created_at: now,
      updated_at: now,
    })
    refresh()
  }

  function eventStyle(e: CalendarEvent) {
    const s = new Date(e.start)
    const minutesFromStart = (s.getHours() - HOURS[0]) * 60 + s.getMinutes()
    const top = (minutesFromStart / 60) * HOUR_PX
    const durMin = (new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000
    const height = Math.max(16, (durMin / 60) * HOUR_PX)
    return { top, height }
  }

  return (
    <div className="flex gap-3">
      <div className="w-56 border rounded p-2 h-[calc(16*48px+40px)] overflow-auto">
        <div className="font-medium mb-2">Unscheduled Tasks</div>
        <div className="space-y-2">
          {unscheduled.map(t => (
            <div
              key={t.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/task-id', t.id)}
              className="border rounded p-2 text-sm cursor-grab active:cursor-grabbing"
            >
              <div className="font-medium text-sm">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.health_domain} • {t.intended_use}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Week of {format(weekStart, 'MMM d, yyyy')}</div>
          <div className="space-x-2">
            <Button variant="secondary" onClick={() => setAnchor(addDays(anchor, -7))}>Prev</Button>
            <Button variant="secondary" onClick={() => setAnchor(new Date())}>Today</Button>
            <Button variant="secondary" onClick={() => setAnchor(addDays(anchor, 7))}>Next</Button>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
          <div />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="text-center text-sm font-medium">
              {format(dayDate(i), 'EEE d')}
            </div>
          ))}
          {/* Hours column */}
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} className="h-12 text-xs text-right pr-2 text-muted-foreground">{String(h).padStart(2,'0')}:00</div>
            ))}
          </div>
          {/* Day columns */}
          {Array.from({ length: 7 }).map((_, dayIndex) => (
            <div
              key={dayIndex}
              className="relative border-l"
              onDrop={(e) => onDrop(e, dayIndex)}
              onDragOver={onDragOver}
              onMouseDown={(e) => onMouseDown(dayIndex, e)}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              style={{ height: HOURS.length * HOUR_PX }}
              ref={dayIndex === 0 ? gridRef : undefined}
            >
              {/* hour lines */}
              {HOURS.map((h, idx) => (
                <div key={h} className="absolute left-0 right-0 border-t border-muted-foreground/10" style={{ top: idx * HOUR_PX }} />
              ))}
              {/* events for this day */}
              {events.filter(e => {
                const s = new Date(e.start)
                return s.toDateString() === dayDate(dayIndex).toDateString()
              }).map(e => {
                const s = eventStyle(e)
                return (
                  <div key={e.id} className="absolute left-1 right-1 rounded bg-primary/10 border border-primary/30 p-1 text-xs"
                    style={{ top: s.top, height: s.height }}
                  >
                    <div className="font-medium truncate">{e.title}</div>
                    <div className="text-[10px] text-muted-foreground">{format(new Date(e.start), 'HH:mm')}–{format(new Date(e.end), 'HH:mm')}</div>
                  </div>
                )
              })}
              {/* drag selection box */}
              {dragSel && dragSel.dayIndex === dayIndex && (
                <div className="absolute left-1 right-1 bg-accent/30 border border-accent" style={{ top: Math.min(dragSel.y1, dragSel.y2), height: Math.abs(dragSel.y2 - dragSel.y1) }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


