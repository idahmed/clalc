<script setup>
defineProps({
  kind: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="info-content">
    <template v-if="kind === 'docs'">
      <article>
        <h3>Basic operations</h3>
        <p>Use the keypad or keyboard for numbers and operators (+ − × ÷ xʸ).</p>
      </article>
      <article>
        <h3>Scientific functions</h3>
        <ul>
          <li>sin, cos, tan and inverses</li>
          <li>ln, log, √, %</li>
        </ul>
      </article>
      <article>
        <h3>Angle mode</h3>
        <p>Toggle DEG / RAD for trigonometry.</p>
      </article>
      <article>
        <h3>Memory</h3>
        <ul>
          <li>MC clear · MR recall · M+ add · M− subtract</li>
        </ul>
      </article>
      <article>
        <h3>Keyboard</h3>
        <ul>
          <li><kbd>0</kbd>–<kbd>9</kbd> digits</li>
          <li><kbd>Enter</kbd> / <kbd>=</kbd> calculate</li>
          <li><kbd>Backspace</kbd> delete · <kbd>Esc</kbd> clear</li>
        </ul>
      </article>
      <article>
        <h3>Copy result</h3>
        <p>Click the display to copy the current result.</p>
      </article>
    </template>

    <template v-else-if="kind === 'terms'">
      <article>
        <h3>1. Acceptance of Terms</h3>
        <p>By using this calculator, you agree to these Terms of Service.</p>
      </article>
      <article>
        <h3>2. Description of Service</h3>
        <p>
          Free scientific calculator for general use. Provided “as is” without
          warranties.
        </p>
      </article>
      <article>
        <h3>3. Accuracy</h3>
        <p>
          Intended for general use. Verify critical results independently.
        </p>
      </article>
      <article>
        <h3>4. Advertising</h3>
        <p>Ads from Google Ads and partners help keep the service free.</p>
      </article>
      <article>
        <h3>5. Contact</h3>
        <p>
          Questions:
          <a href="https://sessea.com" target="_blank" rel="noopener">sessea.com</a>
        </p>
      </article>
      <p class="info-date">Last updated: October 2026</p>
    </template>

    <template v-else-if="kind === 'privacy'">
      <article class="highlight">
        <h3>Our commitment</h3>
        <p>
          <strong>We do not collect personal data.</strong>
          Calculations run locally in your browser.
        </p>
      </article>
      <article>
        <h3>Local storage</h3>
        <p>
          History, memory, theme, and angle mode stay in localStorage on your device.
        </p>
      </article>
      <article>
        <h3>Third-party advertising</h3>
        <p>
          Advertising partners may use cookies. Manage ads at
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">
            Google Ads Settings
          </a>.
        </p>
      </article>
      <article>
        <h3>Contact</h3>
        <p>
          Privacy questions:
          <a href="https://sessea.com" target="_blank" rel="noopener">sessea.com</a>
        </p>
      </article>
      <p class="info-date">Last updated: October 2026</p>
    </template>
  </div>
</template>
