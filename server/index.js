// Minimal Express server stub for optional sync
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 8787

app.use(cors())
app.use(express.json())

// In-memory stores
const db = {
  tasks: new Map(),
  events: new Map(),
  routines: new Map(),
  finance: new Map(),
  suggestions: new Map(),
}

function list(map) { return Array.from(map.values()) }

// Health/root
app.get('/', (req, res) => {
  res.type('text/plain').send('Life Organizer API stub is running. Open the app at your Vite URL (e.g., http://localhost:5173).')
})

// Tasks
app.get('/api/tasks', (req, res) => {
  const items = list(db.tasks)
  res.json(items)
})
app.get('/api/tasks/:id', (req, res) => {
  const item = db.tasks.get(req.params.id)
  if (!item) return res.status(404).end()
  res.json(item)
})
app.post('/api/tasks', (req, res) => {
  const t = { ...req.body }
  db.tasks.set(t.id, t)
  res.json(t)
})
app.put('/api/tasks/:id', (req, res) => {
  const cur = db.tasks.get(req.params.id)
  if (!cur) return res.status(404).end()
  const updated = { ...cur, ...req.body }
  db.tasks.set(updated.id, updated)
  res.json(updated)
})
app.delete('/api/tasks/:id', (req, res) => {
  db.tasks.delete(req.params.id)
  res.status(204).end()
})
app.post('/api/tasks/bulk-update', (req, res) => {
  const { ids, patch } = req.body
  let count = 0
  ids.forEach((id) => {
    const cur = db.tasks.get(id)
    if (cur) { db.tasks.set(id, { ...cur, ...patch }); count += 1 }
  })
  res.json({ count })
})
app.post('/api/tasks/bulk-delete', (req, res) => {
  const { ids } = req.body
  ids.forEach((id) => db.tasks.delete(id))
  res.json({ count: ids.length })
})

// Events
app.get('/api/events', (req, res) => { res.json(list(db.events)) })
app.post('/api/events', (req, res) => { const e = { ...req.body }; db.events.set(e.id, e); res.json(e) })
app.put('/api/events/:id', (req, res) => { const cur = db.events.get(req.params.id); if (!cur) return res.status(404).end(); const updated = { ...cur, ...req.body }; db.events.set(updated.id, updated); res.json(updated) })
app.delete('/api/events/:id', (req, res) => { db.events.delete(req.params.id); res.status(204).end() })

// Routines
app.get('/api/routines', (req, res) => { res.json(list(db.routines)) })
app.post('/api/routines', (req, res) => { const r = { ...req.body }; db.routines.set(r.id, r); res.json(r) })
app.put('/api/routines/:id', (req, res) => { const cur = db.routines.get(req.params.id); if (!cur) return res.status(404).end(); const updated = { ...cur, ...req.body }; db.routines.set(updated.id, updated); res.json(updated) })
app.delete('/api/routines/:id', (req, res) => { db.routines.delete(req.params.id); res.status(204).end() })

// Finance
app.get('/api/finance', (req, res) => { res.json(list(db.finance)) })
app.post('/api/finance', (req, res) => { const f = { ...req.body }; db.finance.set(f.id, f); res.json(f) })
app.put('/api/finance/:id', (req, res) => { const cur = db.finance.get(req.params.id); if (!cur) return res.status(404).end(); const updated = { ...cur, ...req.body }; db.finance.set(updated.id, updated); res.json(updated) })
app.delete('/api/finance/:id', (req, res) => { db.finance.delete(req.params.id); res.status(204).end() })

// Suggestions
app.get('/api/suggestions', (req, res) => { res.json(list(db.suggestions)) })
app.post('/api/suggestions', (req, res) => { const s = { ...req.body }; db.suggestions.set(s.id, s); res.json(s) })
app.delete('/api/suggestions/:id', (req, res) => { db.suggestions.delete(req.params.id); res.status(204).end() })

app.listen(PORT, () => {
  console.log(`Server stub listening on http://localhost:${PORT}`)
})


