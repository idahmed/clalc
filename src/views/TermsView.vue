<script setup>
import { HUB_URL, SITE_URL } from '@/lib/sites'

defineEmits(['home'])
</script>

<template>
  <article class="legal">
    <h2>Terms of Service</h2>
    <p class="legal-meta">Last updated: October 2026 · {{ SITE_URL.replace('https://', '') }}</p>

    <section>
      <h3>Acceptance</h3>
      <p>
        By using this calculator you agree to these terms and the hub terms at
        <a :href="`${HUB_URL}/terms`">sessea.com/terms</a>.
      </p>
    </section>

    <section>
      <h3>Service</h3>
      <p>
        Free scientific calculator for general personal and educational use.
        Provided “as is” without warranties. Verify critical results independently.
      </p>
    </section>

    <section>
      <h3>Advertising</h3>
      <p>
        Ads may appear to keep the tool free. See
        <a :href="`${HUB_URL}/privacy`">sessea.com/privacy</a>
        for partner cookies.
      </p>
    </section>

    <section>
      <h3>Contact</h3>
      <p>
        Questions:
        <a :href="`${HUB_URL}/contact`">sessea.com/contact</a>.
      </p>
    </section>

    <p>
      <button type="button" class="footer-link" @click="$emit('home')">Back to calculator</button>
    </p>
  </article>
</template>
