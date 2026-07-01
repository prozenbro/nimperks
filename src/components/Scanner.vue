<template>
  <div class="glass-panel text-center">
    <div v-if="!isScanning">
      <h3 class="mb-4">{{ title }}</h3>
      <p class="text-sm text-[var(--text-secondary)] mb-4">{{ subtitle }}</p>
      <button @click="startScanning" class="btn btn-primary w-full">Open Camera</button>
    </div>
    
    <div v-else>
      <div id="qr-reader" class="w-full rounded-xl overflow-hidden bg-black mb-4"></div>
      <button @click="stopScanning" class="btn btn-outline w-full">Close Scanner</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';

const props = defineProps({
  title: { type: String, default: 'Scan' },
  subtitle: { type: String, default: 'Scan a QR code' }
});

const emit = defineEmits(['result']);

const isScanning = ref(false);
let html5QrCode = null;

async function startScanning() {
  isScanning.value = true;
  // Wait for the next tick so the #qr-reader div is in the DOM
  setTimeout(() => {
    html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        stopScanning();
        emit('result', decodedText);
      },
      (error) => {
        // ignore errors (mostly not finding QR code)
      }
    ).catch(err => {
      console.error("Camera error:", err);
      alert("Could not start camera. Please check permissions.");
      isScanning.value = false;
    });
  }, 100);
}

function stopScanning() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      isScanning.value = false;
    }).catch(err => {
      console.error("Failed to stop scanning.", err);
      isScanning.value = false;
    });
  } else {
    isScanning.value = false;
  }
}

onUnmounted(() => {
  stopScanning();
});
</script>
