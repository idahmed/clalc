<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import HubLinks from '@/components/HubLinks.vue'
import { evaluate } from '@/lib/evaluate'
import { loadHistory, saveHistory } from '@/lib/history'
import {
  loadDeg,
  loadMemory,
  loadTheme,
  saveDeg,
  saveMemory,
  saveTheme,
} from '@/lib/prefs'

const display = ref('0')
const buffer = ref('')
const expression = ref('')
const pendingOp = ref(null)
const fresh = ref(true)
const deg = ref(loadDeg())
const memory = ref(loadMemory())
const theme = ref(loadTheme())
const history = ref(loadHistory())
const tab = ref('calc')
const useTabs = ref(window.matchMedia('(max-width: 1200px)').matches)
const copied = ref(false)
const page = ref('calc')

const shown = computed(() => display.value)
const angleLabel = computed(() => (deg.value ? 'DEG' : 'RAD'))
const hasMemory = computed(() => memory.value !== 0)
const isDark = computed(() => theme.value === 'dark')

const mathCtx = computed(() => ({
  toRad: (value) => (deg.value ? (value * Math.PI) / 180 : value),
  fromRad: (value) => (deg.value ? (value * 180) / Math.PI : value),
}))

watch(history, (items) => saveHistory(items), { deep: true })
watch(deg, (value) => saveDeg(value))
watch(memory, (value) => saveMemory(value))
watch(theme, (value) => {
  saveTheme(value)
  document.documentElement.dataset.theme = value
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = value === 'dark' ? '#141414' : '#1c1c1c'
}, { immediate: true })

let mobileQuery
let copyTimer

function syncLayout() {
  useTabs.value = mobileQuery.matches
  if (!mobileQuery.matches) tab.value = 'calc'
}

function buzz() {
  try {
    navigator.vibrate?.(12)
  } catch {
    /* ignore */
  }
}

function press(action, event) {
  const el = event?.currentTarget
  if (el instanceof HTMLElement) {
    el.classList.add('pressed')
    window.setTimeout(() => el.classList.remove('pressed'), 140)
  }
  buzz()
  action()
}

function onKeydown(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return

  const key = event.key
  if (key >= '0' && key <= '9') {
    event.preventDefault()
    press(() => inputDigit(key))
    return
  }

  const actions = {
    '.': inputDot,
    ',': inputDot,
    '+': () => setOperator('+'),
    '-': () => setOperator('-'),
    '*': () => setOperator('×'),
    '/': () => setOperator('÷'),
    '^': () => setOperator('^', '^'),
    '(': openParen,
    ')': closeParen,
    '%': percent,
    Enter: equals,
    '=': equals,
    Backspace: backspace,
    Escape: clearAll,
    Delete: clearEntry,
  }

  const action = actions[key]
  if (!action) return
  event.preventDefault()
  press(action)
}

onMounted(() => {
  mobileQuery = window.matchMedia('(max-width: 1200px)')
  syncLayout()
  mobileQuery.addEventListener('change', syncLayout)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  mobileQuery?.removeEventListener('change', syncLayout)
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(copyTimer)
})

function format(value) {
  if (value === null || value === undefined) return '0'
  if (!Number.isFinite(value)) return 'Error'
  const text = String(Number(value.toPrecision(12)))
  return text.length > 14 ? value.toExponential(6) : text
}

function syncExpr() {
  expression.value = `${buffer.value}${fresh.value ? '' : display.value}`.trim()
}

function inputDigit(digit) {
  if (display.value === 'Error' || fresh.value) {
    display.value = digit
    fresh.value = false
    syncExpr()
    return
  }
  if (display.value === '0') {
    display.value = digit
    syncExpr()
    return
  }
  if (display.value.replace('-', '').length >= 14) return
  display.value += digit
  syncExpr()
}

function inputDot() {
  if (display.value === 'Error' || fresh.value) {
    display.value = '0.'
    fresh.value = false
    syncExpr()
    return
  }
  if (!display.value.includes('.')) {
    display.value += '.'
    syncExpr()
  }
}

function backspace() {
  if (display.value === 'Error') {
    clearAll()
    return
  }
  if (fresh.value) {
    if (buffer.value) {
      buffer.value = buffer.value.slice(0, -1)
      pendingOp.value = null
      syncExpr()
    }
    return
  }
  const next = display.value.slice(0, -1)
  display.value = next === '' || next === '-' ? '0' : next
  if (display.value === '0') fresh.value = true
  syncExpr()
}

function clearAll() {
  display.value = '0'
  buffer.value = ''
  expression.value = ''
  pendingOp.value = null
  fresh.value = true
}

function clearEntry() {
  display.value = '0'
  fresh.value = true
  syncExpr()
}

function toggleSign() {
  if (display.value === 'Error' || display.value === '0') return
  display.value = display.value.startsWith('-')
    ? display.value.slice(1)
    : `-${display.value}`
  syncExpr()
}

function setConstant(value, label) {
  display.value = format(value)
  expression.value = label
  buffer.value = ''
  pendingOp.value = null
  fresh.value = true
}

function setOperator(next, label = next) {
  if (display.value === 'Error') return

  if (fresh.value && pendingOp.value && buffer.value) {
    buffer.value = buffer.value.replace(/\s*[+\-×÷^]\s*$/, ` ${label} `)
  } else {
    buffer.value += `${display.value} ${label} `
  }

  pendingOp.value = next
  fresh.value = true
  syncExpr()
}

function openParen() {
  if (display.value === 'Error') return

  if (!fresh.value) {
    buffer.value += `${display.value} × (`
  } else if (buffer.value && !/[+\-×÷^(]\s*$/.test(buffer.value)) {
    buffer.value += ' × ('
  } else {
    buffer.value += '('
  }

  pendingOp.value = null
  display.value = '0'
  fresh.value = true
  syncExpr()
}

function closeParen() {
  if (display.value === 'Error') return
  if (!buffer.value.includes('(')) return

  buffer.value += `${display.value})`
  pendingOp.value = null
  fresh.value = true

  const open = (buffer.value.match(/\(/g) || []).length
  const close = (buffer.value.match(/\)/g) || []).length
  if (open === close) {
    try {
      const result = evaluate(buffer.value, mathCtx.value)
      display.value = format(result)
      expression.value = buffer.value
      if (display.value !== 'Error') pushHistory(buffer.value, display.value)
      buffer.value = ''
      pendingOp.value = null
    } catch {
      display.value = 'Error'
      expression.value = buffer.value
      buffer.value = ''
      pendingOp.value = null
    }
  } else {
    syncExpr()
  }
}

function equals() {
  if (display.value === 'Error') return

  let source = buffer.value.trim()
  if (!source) return
  if (!(fresh.value && /\)$/.test(source))) source += display.value

  try {
    const result = evaluate(source, mathCtx.value)
    const text = format(result)
    display.value = text
    expression.value = source
    if (text !== 'Error') pushHistory(source, text)
  } catch {
    display.value = 'Error'
    expression.value = source
  }

  buffer.value = ''
  pendingOp.value = null
  fresh.value = true
}

function applyUnary(fnName) {
  if (display.value === 'Error') return
  const source = `${fnName}(${display.value})`
  try {
    const result = evaluate(source, mathCtx.value)
    const text = format(result)
    display.value = text
    expression.value = source
    buffer.value = ''
    pendingOp.value = null
    if (text !== 'Error') pushHistory(source, text)
  } catch {
    display.value = 'Error'
    expression.value = source
    buffer.value = ''
    pendingOp.value = null
  }
  fresh.value = true
}

function applyUnaryFn(fn, labelFn) {
  if (display.value === 'Error') return
  const value = Number(display.value)
  const text = format(fn(value))
  const expr = labelFn(format(value))
  display.value = text
  expression.value = expr
  buffer.value = ''
  pendingOp.value = null
  if (text !== 'Error') pushHistory(expr, text)
  fresh.value = true
}

function percent() {
  applyUnaryFn((n) => n / 100, (v) => `${v}%`)
}

function sqrt() {
  applyUnary('sqrt')
}

function ln() {
  applyUnary('ln')
}

function log10() {
  applyUnary('log')
}

function sin() {
  applyUnary('sin')
}

function cos() {
  applyUnary('cos')
}

function tan() {
  applyUnary('tan')
}

function asin() {
  applyUnary('asin')
}

function acos() {
  applyUnary('acos')
}

function atan() {
  applyUnary('atan')
}

function pushHistory(expr, result) {
  if (result === 'Error') return
  history.value.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    expr,
    result,
  })
  if (history.value.length > 40) history.value.pop()
}

function useHistoryItem(item) {
  display.value = item.result
  expression.value = item.expr
  buffer.value = ''
  pendingOp.value = null
  fresh.value = true
  tab.value = 'calc'
}

function removeHistory(id) {
  history.value = history.value.filter((item) => item.id !== id)
}

function clearHistory() {
  history.value = []
}

function memoryClear() {
  memory.value = 0
}

function memoryRecall() {
  display.value = format(memory.value)
  fresh.value = true
  syncExpr()
}

function memoryAdd() {
  if (display.value === 'Error') return
  memory.value += Number(display.value)
  fresh.value = true
}

function memorySub() {
  if (display.value === 'Error') return
  memory.value -= Number(display.value)
  fresh.value = true
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

async function copyResult() {
  if (display.value === 'Error') return
  try {
    await navigator.clipboard.writeText(display.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 1200)
  } catch {
    /* ignore */
  }
}

function goTo(target) {
  page.value = target
  window.scrollTo(0, 0)
}

const memKeys = [
  { id: 'mc', label: 'MC', aria: 'Memory clear', action: memoryClear, tone: 'mem' },
  { id: 'mr', label: 'MR', aria: 'Memory recall', action: memoryRecall, tone: 'mem' },
  { id: 'mplus', label: 'M+', aria: 'Memory add', action: memoryAdd, tone: 'mem' },
  { id: 'mminus', label: 'M−', aria: 'Memory subtract', action: memorySub, tone: 'mem' },
]

const sciKeys = [
  {
    id: 'angle',
    aria: 'Toggle degrees or radians',
    action: () => { deg.value = !deg.value },
    tone: 'mode',
  },
  { id: 'sin', label: 'sin', aria: 'Sine', action: sin, tone: 'fn' },
  { id: 'cos', label: 'cos', aria: 'Cosine', action: cos, tone: 'fn' },
  { id: 'tan', label: 'tan', aria: 'Tangent', action: tan, tone: 'fn' },
  { id: 'C', label: 'C', aria: 'Clear all', action: clearAll, tone: 'muted' },
  { id: 'asin', label: 'asin', aria: 'Arcsine', action: asin, tone: 'fn' },
  { id: 'acos', label: 'acos', aria: 'Arccosine', action: acos, tone: 'fn' },
  { id: 'atan', label: 'atan', aria: 'Arctangent', action: atan, tone: 'fn' },
  { id: 'ce', label: 'CE', aria: 'Clear entry', action: clearEntry, tone: 'muted' },
  { id: 'back', label: '⌫', aria: 'Backspace', action: backspace, tone: 'muted' },
  { id: 'ln', label: 'ln', aria: 'Natural log', action: ln, tone: 'fn' },
  { id: 'log', label: 'log', aria: 'Log base 10', action: log10, tone: 'fn' },
  { id: 'sqrt', label: '√', aria: 'Square root', action: sqrt, tone: 'fn' },
  { id: 'pct', label: '%', aria: 'Percent', action: percent, tone: 'fn' },
  { id: 'pow', label: 'xʸ', aria: 'Power', action: () => setOperator('^', '^'), tone: 'op', op: '^' },
  { id: 'pi', label: 'π', aria: 'Pi', action: () => setConstant(Math.PI, 'π'), tone: 'fn' },
  { id: 'e', label: 'e', aria: 'Euler number', action: () => setConstant(Math.E, 'e'), tone: 'fn' },
  { id: 'lparen', label: '(', aria: 'Open parenthesis', action: openParen, tone: 'fn' },
  { id: 'rparen', label: ')', aria: 'Close parenthesis', action: closeParen, tone: 'fn' },
  { id: 'div', label: '÷', aria: 'Divide', action: () => setOperator('÷'), tone: 'op', op: '÷' },
]

const mainKeys = [
  { label: '7', aria: '7', action: () => inputDigit('7') },
  { label: '8', aria: '8', action: () => inputDigit('8') },
  { label: '9', aria: '9', action: () => inputDigit('9') },
  { label: '×', aria: 'Multiply', action: () => setOperator('×'), tone: 'op', op: '×' },
  { label: '4', aria: '4', action: () => inputDigit('4') },
  { label: '5', aria: '5', action: () => inputDigit('5') },
  { label: '6', aria: '6', action: () => inputDigit('6') },
  { label: '−', aria: 'Subtract', action: () => setOperator('-'), tone: 'op', op: '-' },
  { label: '1', aria: '1', action: () => inputDigit('1') },
  { label: '2', aria: '2', action: () => inputDigit('2') },
  { label: '3', aria: '3', action: () => inputDigit('3') },
  { label: '+', aria: 'Add', action: () => setOperator('+'), tone: 'op', op: '+' },
  { label: '±', aria: 'Toggle sign', action: toggleSign, tone: 'fn' },
  { label: '0', aria: '0', action: () => inputDigit('0') },
  { label: '.', aria: 'Decimal', action: inputDot },
  { label: '=', aria: 'Equals', action: equals, tone: 'equals' },
]
</script>

<template>
  <div class="shell">
    <aside class="ad ad-rail ad-left" aria-label="Advertisement">
      <div class="ad-slot ad-slot-rail">Ad</div>
    </aside>

    <div class="app">
      <main class="page">
        <header class="brand">
          <button
            type="button"
            class="theme-toggle"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <svg
              v-if="isDark"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <path
                d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                fill="none"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <h1 v-if="page === 'calc'">Scientific calculator</h1>
          <h1 v-else-if="page === 'docs'">How to Use</h1>
          <h1 v-else-if="page === 'terms'">Terms of Service</h1>
          <h1 v-else-if="page === 'privacy'">Privacy Policy</h1>
          <HubLinks />
        </header>

        <nav v-if="page === 'calc' && useTabs" class="tabs" aria-label="Views">
          <button
            type="button"
            class="tab"
            :class="{ active: tab === 'calc' }"
            @click="tab = 'calc'"
          >
            Calc
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: tab === 'history' }"
            @click="tab = 'history'"
          >
            History
            <span v-if="history.length" class="badge">{{ history.length }}</span>
          </button>
        </nav>

        <div v-if="page === 'calc'" class="workspace" :class="useTabs ? `tab-${tab}` : 'tab-split'">
          <section
            v-if="!useTabs || tab === 'calc'"
            class="calc"
            aria-label="Calculator"
          >
            <button
              type="button"
              class="screen"
              :aria-label="copied ? 'Result copied' : 'Copy result'"
              @click="copyResult"
            >
              <div class="screen-top">
                <span v-if="hasMemory" class="mem-flag" title="Memory set">M</span>
                <div class="expr">{{ expression || '\u00a0' }}</div>
              </div>
              <output class="display" aria-live="polite">{{ shown }}</output>
              <span v-if="copied" class="copied">Copied</span>
            </button>

            <div class="keys mem">
              <button
                v-for="key in memKeys"
                :key="key.id"
                type="button"
                class="key"
                :class="[key.tone, { lit: hasMemory && key.id !== 'mc' }]"
                :aria-label="key.aria"
                @click="press(key.action, $event)"
              >
                {{ key.label }}
              </button>
            </div>

            <div class="keys sci">
              <button
                v-for="key in sciKeys"
                :key="key.id"
                type="button"
                class="key"
                :class="[key.tone, { active: key.op && key.op === pendingOp }]"
                :aria-label="key.id === 'angle' ? angleLabel : key.aria"
                @click="press(key.action, $event)"
              >
                {{ key.id === 'angle' ? angleLabel : key.label }}
              </button>
            </div>

            <div class="keys main">
              <button
                v-for="(key, index) in mainKeys"
                :key="`m-${index}`"
                type="button"
                class="key"
                :class="[
                  key.tone,
                  { wide: key.wide, active: key.op && key.op === pendingOp },
                ]"
                :aria-label="key.aria"
                @click="press(key.action, $event)"
              >
                {{ key.label }}
              </button>
            </div>
          </section>

          <aside
            v-if="!useTabs || tab === 'history'"
            class="history"
            aria-label="History"
          >
            <div class="history-head">
              <h2>History</h2>
              <button
                v-if="history.length"
                type="button"
                class="clear"
                @click="clearHistory"
              >
                Clear
              </button>
            </div>

            <ul v-if="history.length" class="history-list">
              <li v-for="item in history" :key="item.id" class="history-row">
                <button
                  type="button"
                  class="history-item"
                  :aria-label="`Use result ${item.result}`"
                  @click="useHistoryItem(item)"
                >
                  <span class="history-expr">{{ item.expr }}</span>
                  <span class="history-result">{{ item.result }}</span>
                </button>
                <button
                  type="button"
                  class="history-remove"
                  aria-label="Remove history item"
                  @click="removeHistory(item.id)"
                >
                  ×
                </button>
              </li>
            </ul>

            <p v-else class="history-empty">Results stay here for next time.</p>
          </aside>
        </div>

        <section v-if="page === 'docs'" class="content-page" aria-label="Documentation">
          <button type="button" class="back-link" @click="goTo('calc')">← Back to Calculator</button>

          <article class="doc-section">
            <h2>Basic Operations</h2>
            <p>Enter numbers using the keypad or your keyboard. Use the operators to perform calculations:</p>
            <ul>
              <li><strong>+</strong> Addition</li>
              <li><strong>−</strong> Subtraction</li>
              <li><strong>×</strong> Multiplication</li>
              <li><strong>÷</strong> Division</li>
              <li><strong>xʸ</strong> Power (exponent)</li>
            </ul>
          </article>

          <article class="doc-section">
            <h2>Scientific Functions</h2>
            <ul>
              <li><strong>sin, cos, tan</strong> — Trigonometric functions</li>
              <li><strong>asin, acos, atan</strong> — Inverse trigonometric functions</li>
              <li><strong>ln</strong> — Natural logarithm</li>
              <li><strong>log</strong> — Logarithm base 10</li>
              <li><strong>√</strong> — Square root</li>
              <li><strong>%</strong> — Percentage (divides by 100)</li>
            </ul>
          </article>

          <article class="doc-section">
            <h2>Angle Mode</h2>
            <p>Toggle between <strong>DEG</strong> (degrees) and <strong>RAD</strong> (radians) for trigonometric calculations. The current mode is shown on the top-left button.</p>
          </article>

          <article class="doc-section">
            <h2>Memory Functions</h2>
            <ul>
              <li><strong>MC</strong> — Clear memory</li>
              <li><strong>MR</strong> — Recall memory value</li>
              <li><strong>M+</strong> — Add display value to memory</li>
              <li><strong>M−</strong> — Subtract display value from memory</li>
            </ul>
            <p>An "M" indicator appears on the display when memory contains a value.</p>
          </article>

          <article class="doc-section">
            <h2>Parentheses</h2>
            <p>Use <strong>(</strong> and <strong>)</strong> to group expressions. The calculator automatically multiplies when you place parentheses next to numbers.</p>
          </article>

          <article class="doc-section">
            <h2>Constants</h2>
            <ul>
              <li><strong>π</strong> — Pi (3.14159...)</li>
              <li><strong>e</strong> — Euler's number (2.71828...)</li>
            </ul>
          </article>

          <article class="doc-section">
            <h2>History</h2>
            <p>Your calculations are saved in the History panel. Click any result to load it back into the calculator. History persists between sessions in your browser.</p>
          </article>

          <article class="doc-section">
            <h2>Keyboard Shortcuts</h2>
            <ul>
              <li><strong>0-9</strong> — Enter digits</li>
              <li><strong>+ - * /</strong> — Operators</li>
              <li><strong>Enter</strong> or <strong>=</strong> — Calculate</li>
              <li><strong>Backspace</strong> — Delete last digit</li>
              <li><strong>Escape</strong> — Clear all</li>
              <li><strong>Delete</strong> — Clear entry</li>
            </ul>
          </article>

          <article class="doc-section">
            <h2>Copy Result</h2>
            <p>Click the display screen to copy the current result to your clipboard.</p>
          </article>
        </section>

        <section v-if="page === 'terms'" class="content-page" aria-label="Terms of Service">
          <button type="button" class="back-link" @click="goTo('calc')">← Back to Calculator</button>

          <article class="doc-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using this calculator ("Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </article>

          <article class="doc-section">
            <h2>2. Description of Service</h2>
            <p>This is a free scientific calculator provided for educational and general calculation purposes. The Service is provided "as is" without warranties of any kind.</p>
          </article>

          <article class="doc-section">
            <h2>3. No Account Required</h2>
            <p>This Service does not require you to create an account. All calculations are performed locally in your browser.</p>
          </article>

          <article class="doc-section">
            <h2>4. Accuracy</h2>
            <p>While we strive for accuracy, this calculator is intended for general use only. Do not rely on it for critical calculations requiring guaranteed precision. Always verify important results.</p>
          </article>

          <article class="doc-section">
            <h2>5. Limitation of Liability</h2>
            <p>We are not liable for any damages arising from the use or inability to use this Service, including but not limited to errors in calculations or loss of data.</p>
          </article>

          <article class="doc-section">
            <h2>6. Advertising</h2>
            <p>This Service displays advertisements provided by Google Ads and third-party sellers. These advertisements help support the free availability of this Service.</p>
          </article>

          <article class="doc-section">
            <h2>7. Changes to Terms</h2>
            <p>We may update these Terms of Service at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
          </article>

          <article class="doc-section">
            <h2>8. Contact</h2>
            <p>For questions about these terms, visit <a href="https://tools.sessea.com" target="_blank" rel="noopener">tools.sessea.com</a>.</p>
          </article>
        </section>

        <section v-if="page === 'privacy'" class="content-page" aria-label="Privacy Policy">
          <button type="button" class="back-link" @click="goTo('calc')">← Back to Calculator</button>

          <article class="doc-section">
            <h2>Our Commitment to Privacy</h2>
            <p>We respect your privacy. This calculator is designed to work entirely in your browser without collecting personal data.</p>
          </article>

          <article class="doc-section">
            <h2>Data We Collect</h2>
            <p><strong>We do not collect any personal data from users.</strong></p>
            <p>Your calculations, history, and preferences are stored locally in your browser using localStorage. This data never leaves your device and is not transmitted to our servers.</p>
          </article>

          <article class="doc-section">
            <h2>Local Storage</h2>
            <p>The calculator uses browser localStorage to save:</p>
            <ul>
              <li>Calculation history</li>
              <li>Memory value</li>
              <li>Theme preference (dark/light)</li>
              <li>Angle mode (degrees/radians)</li>
            </ul>
            <p>This data remains on your device and can be cleared through your browser settings.</p>
          </article>

          <article class="doc-section">
            <h2>Third-Party Advertising</h2>
            <p>This Service displays advertisements from <strong>Google Ads</strong> and <strong>third-party advertising partners</strong>.</p>
            <p>These advertising services may collect and use data to show you personalized ads. This data collection is governed by their respective privacy policies:</p>
            <ul>
              <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a></li>
              <li><a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">How Google Uses Advertising Data</a></li>
            </ul>
            <p>You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a> or using the <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener">NAI Opt-Out Tool</a>.</p>
          </article>

          <article class="doc-section">
            <h2>Cookies</h2>
            <p>We do not use cookies for tracking or analytics. However, our advertising partners may use cookies to serve relevant ads. You can manage cookie preferences in your browser settings.</p>
          </article>

          <article class="doc-section">
            <h2>Children's Privacy</h2>
            <p>This Service is not directed at children under 13. We do not knowingly collect any information from children.</p>
          </article>

          <article class="doc-section">
            <h2>Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page.</p>
          </article>

          <article class="doc-section">
            <h2>Contact</h2>
            <p>For privacy-related questions, visit <a href="https://tools.sessea.com" target="_blank" rel="noopener">tools.sessea.com</a>.</p>
          </article>
        </section>

        <footer class="footer">
          <nav class="footer-links">
            <button v-if="page !== 'calc'" type="button" @click="goTo('calc')">Calculator</button>
            <button v-if="page !== 'docs'" type="button" @click="goTo('docs')">How to Use</button>
            <button v-if="page !== 'terms'" type="button" @click="goTo('terms')">Terms</button>
            <button v-if="page !== 'privacy'" type="button" @click="goTo('privacy')">Privacy</button>
          </nav>
          <p class="copyright">© {{ new Date().getFullYear() }} sessea</p>
        </footer>
      </main>

      <div class="ad ad-banner ad-bottom" aria-label="Advertisement">
        <div class="ad-slot ad-slot-banner">Ad</div>
      </div>
    </div>

    <aside class="ad ad-rail ad-right" aria-label="Advertisement">
      <div class="ad-slot ad-slot-rail">Ad</div>
    </aside>
  </div>
</template>
