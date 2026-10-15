const KEY = 'clalc-history'
const MAX = 40

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function saveHistory(items) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)))
}
