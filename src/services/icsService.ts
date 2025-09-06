import { createEvents } from 'ics'
import type { CalendarEvent } from '@/types/models'

export function exportICS(events: CalendarEvent[]): string {
  const mapped = events.map(e => {
    const start = new Date(e.start)
    const end = new Date(e.end)
    return {
      title: e.title,
      start: [start.getFullYear(), start.getMonth()+1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth()+1, end.getDate(), end.getHours(), end.getMinutes()],
      calName: 'Life Organizer',
      description: `${e.health_domain} / ${e.intended_use}`,
    }
  })
  const { value } = createEvents(mapped)
  return value ?? ''
}


