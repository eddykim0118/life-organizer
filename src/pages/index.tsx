export function DashboardPage() {
  return <div className="p-2">Today overview and suggestions will appear here.</div>
}
import { WeekView } from '@/components/calendar/WeekView'
export function CalendarPage() {
  return <div className="p-2"><WeekView /></div>
}
import { useEffect, useMemo, useState } from 'react'
import { taskRepo } from '@/repos/taskRepo'
import type { Task, TaskStatus, HealthDomain, IntendedUse, Priority } from '@/types/models'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [q, setQ] = useState('')
  const [domain, setDomain] = useState<HealthDomain | 'all'>('all')
  const [use, setUse] = useState<IntendedUse | 'all'>('all')
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    taskRepo.list().then(setTasks)
  }, [])

  const filtered = useMemo(() => {
    return tasks.filter(t => (
      (!q || t.title.toLowerCase().includes(q.toLowerCase())) &&
      (domain === 'all' || t.health_domain === domain) &&
      (use === 'all' || t.intended_use === use) &&
      (status === 'all' || t.status === status) &&
      (priority === 'all' || t.priority === priority)
    ))
  }, [tasks, q, domain, use, status, priority])

  return (
    <div className="p-2 space-y-3">
      <div className="grid grid-cols-5 gap-2">
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={domain} onValueChange={(v) => setDomain(v as any)}>
          <SelectTrigger><SelectValue placeholder="Domain" /></SelectTrigger>
          <SelectContent>
            {['all','time','finance','physical','mental','social','spiritual','admin'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={use} onValueChange={(v) => setUse(v as any)}>
          <SelectTrigger><SelectValue placeholder="Intended use" /></SelectTrigger>
          <SelectContent>
            {['all','plan','execute','review','learn','budget','recover','reflect'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {['all','inbox','scheduled','done','skipped','canceled'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
          <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            {['all','now','soon','later'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{filtered.length} tasks</div>
        <div className="space-x-2">
          <Button size="sm" variant={view==='list' ? 'default' : 'secondary'} onClick={() => setView('list')}>List</Button>
          <Button size="sm" variant={view==='kanban' ? 'default' : 'secondary'} onClick={() => setView('kanban')}>Kanban</Button>
        </div>
      </div>
      {selected.size > 0 && (
        <BulkBar selected={selected} clearSelected={() => setSelected(new Set())} refresh={async () => setTasks(await taskRepo.list())} />
      )}
      {view === 'list' ? (
        <div className="space-y-2">
          {filtered.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              onChanged={async () => setTasks(await taskRepo.list())}
              selected={selected.has(t.id)}
              toggleSelected={() => {
                const s = new Set(selected)
                if (s.has(t.id)) s.delete(t.id); else s.add(t.id)
                setSelected(s)
              }}
            />
          ))}
        </div>
      ) : (
        <KanbanBoard
          tasks={filtered}
          onDrop={async (taskId, intended_use) => {
            await taskRepo.update(taskId, { intended_use })
            setTasks(await taskRepo.list())
          }}
          refresh={async () => setTasks(await taskRepo.list())}
          selected={selected}
          setSelected={setSelected}
        />
      )}
    </div>
  )
}

function TaskRow({ task, onChanged, selected, toggleSelected }: { task: Task, onChanged: () => void | Promise<void>, selected: boolean, toggleSelected: () => void }) {
  const [title, setTitle] = useState(task.title)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await taskRepo.update(task.id, { title })
    setSaving(false)
    setEditing(false)
    await onChanged()
  }

  async function remove() {
    await taskRepo.delete(task.id)
    await onChanged()
  }

  return (
    <div className="rounded border p-2 flex items-center gap-2">
      <input type="checkbox" checked={selected} onChange={toggleSelected} aria-label="Select task" />
      {editing ? (
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
      ) : (
        <div className="flex-1">
          <div className="font-medium">{task.title}</div>
          <div className="text-xs text-muted-foreground">{task.health_domain} • {task.intended_use} • {task.priority} • {task.status}</div>
        </div>
      )}
      {editing ? (
        <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
      )}
      <Button size="sm" variant="destructive" onClick={remove}>Delete</Button>
    </div>
  )
}

function BulkBar({ selected, clearSelected, refresh }: { selected: Set<string>, clearSelected: () => void, refresh: () => void | Promise<void> }) {
  const [updating, setUpdating] = useState(false)
  const [newDomain, setNewDomain] = useState<HealthDomain | 'noop'>('noop')
  const [newUse, setNewUse] = useState<IntendedUse | 'noop'>('noop')
  const [newStatus, setNewStatus] = useState<TaskStatus | 'noop'>('noop')
  const [newPriority, setNewPriority] = useState<Priority | 'noop'>('noop')

  async function apply() {
    setUpdating(true)
    const patch: any = {}
    if (newDomain !== 'noop') patch.health_domain = newDomain
    if (newUse !== 'noop') patch.intended_use = newUse
    if (newStatus !== 'noop') patch.status = newStatus
    if (newPriority !== 'noop') patch.priority = newPriority
    if (Object.keys(patch).length > 0) {
      await taskRepo.bulkUpdate(Array.from(selected), patch)
    }
    setUpdating(false)
    await refresh()
    clearSelected()
  }

  async function remove() {
    setUpdating(true)
    await taskRepo.bulkDelete(Array.from(selected))
    setUpdating(false)
    await refresh()
    clearSelected()
  }

  return (
    <div className="flex items-center gap-2 p-2 border rounded bg-muted/20">
      <div className="text-sm">{selected.size} selected</div>
      <Select value={newDomain} onValueChange={(v) => setNewDomain(v as any)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Domain" /></SelectTrigger>
        <SelectContent>
          {['noop','time','finance','physical','mental','social','spiritual','admin'].map(v => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={newUse} onValueChange={(v) => setNewUse(v as any)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Use" /></SelectTrigger>
        <SelectContent>
          {['noop','plan','execute','review','learn','budget','recover','reflect'].map(v => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={newStatus} onValueChange={(v) => setNewStatus(v as any)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          {['noop','inbox','scheduled','done','skipped','canceled'].map(v => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={newPriority} onValueChange={(v) => setNewPriority(v as any)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          {['noop','now','soon','later'].map(v => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={apply} disabled={updating}>Apply</Button>
      <Button size="sm" variant="destructive" onClick={remove} disabled={updating}>Delete</Button>
      <Button size="sm" variant="secondary" onClick={clearSelected}>Clear</Button>
    </div>
  )
}

function KanbanBoard({ tasks, onDrop, refresh, selected, setSelected }: {
  tasks: Task[],
  onDrop: (taskId: string, intended_use: IntendedUse) => void | Promise<void>,
  refresh: () => void | Promise<void>,
  selected: Set<string>,
  setSelected: (s: Set<string>) => void,
}) {
  const cols: IntendedUse[] = ['plan','execute','review','learn','budget','recover','reflect']
  function handleDrop(e: React.DragEvent, col: IntendedUse) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/task-id')
    if (id) onDrop(id, col)
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  return (
    <div className="grid grid-cols-7 gap-2">
      {cols.map(col => (
        <div key={col} className="border rounded p-2 min-h-[200px] bg-background" onDrop={(e)=>handleDrop(e,col)} onDragOver={onDragOver}>
          <div className="font-medium mb-2 capitalize">{col}</div>
          <div className="space-y-2">
            {tasks.filter(t => t.intended_use === col).map(t => (
              <div key={t.id}
                   draggable
                   onDragStart={(e) => e.dataTransfer.setData('text/task-id', t.id)}
                   className={`border rounded p-2 text-sm cursor-grab ${selected.has(t.id) ? 'ring-2 ring-primary' : ''}`}
                   onClick={() => {
                     const s = new Set(selected)
                     if (s.has(t.id)) s.delete(t.id); else s.add(t.id)
                     setSelected(s)
                   }}
              >
                <div className="font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.health_domain} • {t.priority}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
import { RoutinesPanel } from './Routines'
export function RoutinesPage() {
  return <div className="p-2"><RoutinesPanel /></div>
}
export function FinancePage() {
  return <div className="p-2">Finance entries and weekly budget widget coming.</div>
}
import { SuggestionsPanel } from './Suggestions'
export function SuggestionsPage() {
  return <div className="p-2"><SuggestionsPanel /></div>
}
import { SettingsPanel } from './Settings'
export function SettingsPage() {
  return <div className="p-2"><SettingsPanel /></div>
}


