<template>
  <div class="glass-panel text-center py-8">
    <div class="mb-4 text-[var(--text-secondary)]">
      <svg class="mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    </div>
    <h3 class="mb-2 font-bold">{{ title }}</h3>
    <p class="text-sm text-[var(--text-secondary)]">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true }
});
</script>
