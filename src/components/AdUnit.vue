<script setup>
import { onMounted } from 'vue'
import { ADSENSE_CLIENT } from '@/lib/ads'

const props = defineProps({
  /** AdSense ad unit slot id from the AdSense console (optional). */
  slotId: { type: String, default: '' },
  format: { type: String, default: 'auto' },
})

onMounted(() => {
  if (!props.slotId) return
  try {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch {
    /* ignore */
  }
})
</script>

<template>
  <div class="ad-unit">
    <ins
      v-if="slotId"
      class="adsbygoogle"
      style="display: block; width: 100%"
      :data-ad-client="ADSENSE_CLIENT"
      :data-ad-slot="slotId"
      :data-ad-format="format"
      data-full-width-responsive="true"
    />
  </div>
</template>
