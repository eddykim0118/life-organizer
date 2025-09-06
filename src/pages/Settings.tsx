import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { db } from '@/db/dexie'
import { exportICS } from '@/services/icsService'
import { eventRepo } from '@/repos/eventRepo'

export function SettingsPanel() {
  const [exporting, setExporting] = useState(false)

  async function backup() {
    const data = {
      tasks: await db.tasks.toArray(),
      events: await db.events.toArray(),
      routines: await db.routines.toArray(),
      finance: await db.finance.toArray(),
      suggestions: await db.suggestions.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'life-organizer-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function restore(file: File) {
    const text = await file.text()
    const data = JSON.parse(text)
    await db.transaction('rw', db.tasks, db.events, db.routines, db.finance, db.suggestions, async () => {
      await db.tasks.clear(); await db.events.clear(); await db.routines.clear(); await db.finance.clear(); await db.suggestions.clear()
      if (data.tasks) await db.tasks.bulkAdd(data.tasks)
      if (data.events) await db.events.bulkAdd(data.events)
      if (data.routines) await db.routines.bulkAdd(data.routines)
      if (data.finance) await db.finance.bulkAdd(data.finance)
      if (data.suggestions) await db.suggestions.bulkAdd(data.suggestions)
    })
    alert('Restore complete')
  }

  async function exportVisibleICS() {
    setExporting(true)
    const start = new Date()
    start.setDate(1)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)
    const events = await eventRepo.list({ start: start.toISOString(), end: end.toISOString() })
    const ics = exportICS(events)
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'life-organizer.ics'
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div className="space-y-3 p-2">
      <div className="space-x-2">
        <Button onClick={backup}>Backup (JSON)</Button>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="file" accept="application/json" onChange={(e) => e.target.files && restore(e.target.files[0])} />
          Restore (JSON)
        </label>
      </div>
      <div>
        <Button variant="secondary" onClick={exportVisibleICS} disabled={exporting}>{exporting ? 'Exporting…' : 'Export ICS (this month)'}</Button>
      </div>
    </div>
  )
}


