const DEG_KEY = 'clalc-deg'
const MEM_KEY = 'clalc-memory'
const THEME_KEY = 'clalc-theme'

export function loadDeg() {
  try {
    const raw = localStorage.getItem(DEG_KEY)
    if (raw === null) return true
    return raw === '1'
  } catch {
    return true
  }
}

export function saveDeg(value) {
  localStorage.setItem(DEG_KEY, value ? '1' : '0')
}

export function loadMemory() {
  try {
    const raw = localStorage.getItem(MEM_KEY)
    if (raw === null) return 0
    const value = Number(raw)
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function saveMemory(value) {
  localStorage.setItem(MEM_KEY, String(value))
}

export function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'dark' || raw === 'light') return raw
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function saveTheme(value) {
  localStorage.setItem(THEME_KEY, value)
}
