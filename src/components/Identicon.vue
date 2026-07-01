<template>
  <div ref="container" class="identicon-hex" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  address: { type: String, default: null }
});

const container = ref(null);

async function render() {
  if (!container.value || !props.address) return;
  try {
    const { default: Identicons } = await import('@nimiq/identicons');
    Identicons.render(props.address, container.value);
  } catch (e) {
    console.warn('[Identicon] Failed to render:', e);
  }
}

onMounted(render);
watch(() => props.address, render);
</script>

<style scoped>
.identicon-hex {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.identicon-hex :deep(svg) {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  display: block;
}
</style>
