<script setup>
import { HUB_URL, SITE_URL } from '@/lib/sites'

defineEmits(['home'])
</script>

<template>
  <article class="legal">
    <h2>Privacy Policy</h2>
    <p class="legal-meta">Last updated: October 2026 · {{ SITE_URL.replace('https://', '') }}</p>

    <section>
      <h3>Short version</h3>
      <p>
        This scientific calculator runs in your browser. History and memory can be
        saved in localStorage on your device. We do not require an account and we
        do not upload your calculations to sessea servers.
      </p>
    </section>

    <section>
      <h3>Local storage</h3>
      <p>
        Optional preferences such as theme, degree/radian mode, memory, and recent
        results stay on your device. Clear site data in your browser to remove them.
      </p>
    </section>

    <section>
      <h3>Advertising</h3>
      <p>
        Pages may show Google AdSense ads. Ad partners may use cookies or similar
        technologies. Manage ads in
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>.
      </p>
    </section>

    <section>
      <h3>Full policy</h3>
      <p>
        Hub policy:
        <a :href="`${HUB_URL}/privacy`">sessea.com/privacy</a>.
        Contact:
        <a :href="`${HUB_URL}/contact`">sessea.com/contact</a>.
      </p>
    </section>

    <p>
      <button type="button" class="footer-link" @click="$emit('home')">Back to calculator</button>
    </p>
  </article>
</template>
