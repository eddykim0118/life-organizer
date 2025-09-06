export const USE_SERVER = import.meta.env.VITE_USE_SERVER === 'true'
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}


