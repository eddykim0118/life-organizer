import type { Suggestion } from '@/types/models'

// MVP: stub deterministic suggestions with fixed confidence formula weights
export async function generateAllSuggestions(): Promise<Suggestion[]> {
  const now = new Date()
  const suggestions: Suggestion[] = []
  // Minimal: nightly reflection at 20:30
  const evening = new Date(now)
  evening.setHours(20, 30, 0, 0)
  if (now.getHours() < 21) {
    suggestions.push({
      id: crypto.randomUUID(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: new Date(evening.getTime() + 2*60*60*1000).toISOString(),
      suggestion_type: 'reflection',
      payload: { when: evening.toISOString(), durationMinutes: 5 },
      confidence: 0.65,
      explanation: 'A short 2-minute reflection helps close the day.',
      action: 'accept',
    })
  }
  return suggestions
}


