<template>
  <Transition name="ftue-fade">
    <div v-if="show" class="explainer-overlay" @click="$emit('close')">
      <!-- Card container -->
      <div class="explainer-card card-premium anim-scale-in" @click.stop>
        <button class="close-btn" @click="$emit('close')">×</button>
        
        <div class="explainer-header">
          <span class="explainer-emoji">{{ emoji }}</span>
          <h3 class="explainer-title">{{ title }}</h3>
        </div>

        <div class="explainer-content">
          <p class="explainer-text" v-for="(p, idx) in paragraphs" :key="idx">
            {{ p }}
          </p>
        </div>

        <k-button 
          class="nim-btn-primary w-full mt-5 submit-btn" 
          style="height: 48px; font-size: 0.95rem;" 
          @click="$emit('close')"
        >
          Got it!
        </k-button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { Button as kButton } from 'konsta/vue';

defineProps({
  show: { type: Boolean, required: true },
  emoji: { type: String, default: '💡' },
  title: { type: String, required: true },
  paragraphs: { type: Array, required: true }
});

defineEmits(['close']);
</script>

<style scoped>
.explainer-overlay {
  position: fixed;
  inset: 0;
  z-index: 10005;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.explainer-card {
  position: relative;
  width: 90%;
  max-width: 328px;
  background: var(--bg-card);
  border: 1.5px solid var(--border-medium);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}
.close-btn {
  position: absolute;
  top: 14px;
  right: 18px;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--text-tertiary);
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s ease;
}
.close-btn:hover {
  color: var(--text-primary);
}
.explainer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  margin-top: 4px;
}
.explainer-emoji {
  font-size: 2rem;
  line-height: 1;
}
.explainer-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
.explainer-content {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  text-align: left;
}
.explainer-text {
  margin-bottom: 10px;
}
.explainer-text:last-child {
  margin-bottom: 0;
}

.ftue-fade-enter-active,
.ftue-fade-leave-active {
  transition: opacity 0.22s ease;
}
.ftue-fade-enter-from,
.ftue-fade-leave-to {
  opacity: 0;
}
</style>
