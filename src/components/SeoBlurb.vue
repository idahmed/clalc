<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  lede: { type: String, default: '' },
  points: { type: Array, default: () => [] },
  steps: { type: Array, default: () => [] },
  note: { type: String, default: '' },
  faq: { type: Array, default: () => [] },
})

const faqSchema = computed(() => {
  if (!props.faq.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: props.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
})

let scriptEl = null

function syncSchema() {
  if (scriptEl) {
    scriptEl.remove()
    scriptEl = null
  }
  if (!faqSchema.value) return
  scriptEl = document.createElement('script')
  scriptEl.type = 'application/ld+json'
  scriptEl.textContent = JSON.stringify(faqSchema.value)
  document.head.appendChild(scriptEl)
}

onMounted(syncSchema)
watch(faqSchema, syncSchema)
onUnmounted(() => {
  if (scriptEl) scriptEl.remove()
})
</script>

<template>
  <aside class="seo" aria-label="About this tool">
    <h3>{{ title }}</h3>
    <p v-if="lede" class="seo-lede">{{ lede }}</p>
    <ul v-if="points.length" role="list">
      <li v-for="point in points" :key="point">{{ point }}</li>
    </ul>
    <div v-if="steps.length" class="seo-steps">
      <h4>How to use</h4>
      <ol>
        <li v-for="step in steps" :key="step">{{ step }}</li>
      </ol>
    </div>
    <p v-if="note" class="seo-note">{{ note }}</p>
    <dl v-if="faq.length" class="faq">
      <template v-for="item in faq" :key="item.q">
        <dt>{{ item.q }}</dt>
        <dd>{{ item.a }}</dd>
      </template>
    </dl>
  </aside>
</template>
