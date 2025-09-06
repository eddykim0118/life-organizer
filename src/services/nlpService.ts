import type { IntendedUse, HealthDomain } from '@/types/domain'

export interface ParsedTaskInput {
  title: string
  tags: string[]
  intended_use?: IntendedUse
  health_domain?: HealthDomain
  start?: string
  end?: string
  durationMinutes?: number
}

const intendedUseMap: Record<string, IntendedUse> = {
  '@plan': 'plan',
  '@execute': 'execute',
  '@review': 'review',
  '@learn': 'learn',
  '@budget': 'budget',
  '@recover': 'recover',
  '@reflect': 'reflect',
}

function guessDomain(title: string, tags: string[]): HealthDomain | undefined {
  const t = `${tags.join(' ')} ${title}`.toLowerCase()
  if (t.includes('#finance') || /pay|rent|budget|bill/.test(t)) return 'finance'
  if (t.includes('#physical') || /gym|run|lift|yoga|push|pull|legs/.test(t)) return 'physical'
  if (t.includes('#mental') || /reflect|journal|meditate|focus/.test(t)) return 'mental'
  if (t.includes('#social') || /call|meet|coffee|dinner/.test(t)) return 'social'
  if (t.includes('#spiritual') || /pray|church|temple/.test(t)) return 'spiritual'
  if (t.includes('#admin') || /renew|file|tax|admin/.test(t)) return 'admin'
  if (t.includes('#time') || /deep work|study|plan/.test(t)) return 'time'
  return undefined
}

function guessUse(title: string): IntendedUse | undefined {
  const t = title.toLowerCase()
  if (/pay|budget/.test(t)) return 'budget'
  if (/review|retro|reflect/.test(t)) return 'reflect'
  if (/plan|schedule/.test(t)) return 'plan'
  if (/read|learn|study/.test(t)) return 'learn'
  if (/recover|rest|break/.test(t)) return 'recover'
  if (/run|gym|lift|do|work|focus|execute/.test(t)) return 'execute'
  return undefined
}

export function parseQuickAdd(input: string, baseDate = new Date()): ParsedTaskInput {
  const tags = Array.from(input.matchAll(/#(\w+)/g)).map((m) => m[1])
  const intended = Object.keys(intendedUseMap).find((k) => input.includes(k))
  const intended_use = intended ? intendedUseMap[intended] : undefined
  const title = input
    .replace(/#\w+/g, '')
    .replace(/@\w+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Minimal time range parse e.g., "7am-8am" or "2-4pm"
  const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)?\s?[–-]\s?(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i)
  let start: string | undefined
  let end: string | undefined
  if (timeMatch) {
    const [ , h1, m1, ap1, h2, m2, ap2 ] = timeMatch
    const d1 = new Date(baseDate)
    const d2 = new Date(baseDate)
    let hh1 = parseInt(h1, 10)
    let hh2 = parseInt(h2, 10)
    const mm1 = m1 ? parseInt(m1, 10) : 0
    const mm2 = m2 ? parseInt(m2, 10) : 0
    if ((ap1?.toLowerCase() ?? '') === 'pm' && hh1 < 12) hh1 += 12
    if ((ap2?.toLowerCase() ?? '') === 'pm' && hh2 < 12) hh2 += 12
    d1.setHours(hh1, mm1, 0, 0)
    d2.setHours(hh2, mm2, 0, 0)
    start = d1.toISOString()
    end = d2.toISOString()
  }

  const health_domain = guessDomain(title, tags) ?? (tags.includes('finance') ? 'finance' : undefined)
  const iu = intended_use ?? guessUse(title)

  return { title, tags, intended_use: iu, health_domain, start, end }
}
