import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { seedDemo } from '@/seed'
import { useRoute } from '@/lib/router'
import { CalendarPage, DashboardPage, FinancePage, RoutinesPage, SettingsPage, SuggestionsPage, TasksPage } from '@/pages'
import { parseQuickAdd } from '@/services/nlpService'
import { taskRepo } from '@/repos/taskRepo'
import { eventRepo } from '@/repos/eventRepo'
import { autoPlanToday } from '@/services/plannerService'

export default function App() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [route, navigate] = useRoute()

  useEffect(() => {
    seedDemo()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key.toLowerCase() === 'n') {
        setOpen(true)
      }
      if (e.key.toLowerCase() === 's') {
        autoPlan()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleQuickAddSubmit() {
    const parsed = parseQuickAdd(input)
    const now = new Date()
    const task = await taskRepo.create({
      id: crypto.randomUUID(),
      title: parsed.title || 'Untitled',
      about: '',
      health_domain: parsed.health_domain ?? 'time',
      intended_use: parsed.intended_use ?? 'plan',
      priority: 'soon',
      effort_minutes: parsed.start && parsed.end ? Math.max(5, Math.round((new Date(parsed.end).getTime() - new Date(parsed.start).getTime())/60000)) : 30,
      status: parsed.start ? 'scheduled' : 'inbox',
      tags: parsed.tags ?? [],
      source: 'manual',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      scheduled_start: parsed.start,
      scheduled_end: parsed.end,
    })
    if (parsed.start && parsed.end) {
      await eventRepo.create({
        id: crypto.randomUUID(),
        task_id: task.id,
        title: task.title,
        health_domain: task.health_domain,
        intended_use: task.intended_use,
        start: parsed.start,
        end: parsed.end,
        is_all_day: false,
        source: 'manual',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
    }
    setInput('')
    setOpen(false)
    navigate('tasks')
  }

  async function autoPlan() {
    const res = await autoPlanToday()
    if (res.placed.length === 0) {
      alert('No free slots found for top tasks today.')
    } else {
      alert(`Auto-planned ${res.placed.length} task(s).`)
    }
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r p-3 space-y-2">
        <div className="font-semibold">Life Organizer</div>
        <nav className="space-y-1 text-sm">
          <button className="w-full text-left hover:underline" onClick={() => navigate('dashboard')}>Dashboard</button>
          <button className="w-full text-left hover:underline" onClick={() => navigate('calendar')}>Calendar</button>
          <button className="w-full text-left hover:underline" onClick={() => navigate('tasks')}>Tasks</button>
          <button className="w-full text-left hover:underline" onClick={() => navigate('routines')}>Routines</button>
          <button className="w-full text-left hover:underline" onClick={() => navigate('finance')}>Finance</button>
          <button className="w-full text-left hover:underline" onClick={() => navigate('suggestions')}>Suggestions</button>
          <button className="w-full text-left hover:underline" onClick={() => navigate('settings')}>Settings</button>
        </nav>
        <Button className="w-full" onClick={() => setOpen(true)}>Quick Add (⌘K)</Button>
      </aside>
      <main className="flex-1 p-4">
        <Tabs value={route} onValueChange={(v) => navigate(v as any)}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="routines">Routines</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          {route === 'dashboard' && (
            <div className="mt-3">
              <Button onClick={autoPlan}>Auto-plan my day (S)</Button>
            </div>
          )}
          {route === 'dashboard' && <DashboardPage />}
          {route === 'calendar' && <CalendarPage />}
          {route === 'tasks' && <TasksPage />}
          {route === 'routines' && <RoutinesPage />}
          {route === 'finance' && <FinancePage />}
          {route === 'suggestions' && <SuggestionsPage />}
          {route === 'settings' && <SettingsPage />}
        </Tabs>
      </main>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput value={input} onValueChange={setInput} placeholder="Quick add: e.g. Gym tomorrow 7-8am #physical" />
        <CommandList>
          <CommandEmpty>Type a task title, add #tags and @use</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={handleQuickAddSubmit}>Add Task</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
