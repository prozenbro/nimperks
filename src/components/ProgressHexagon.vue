<template>
  <div v-if="max <= 10" class="flex flex-wrap gap-2 justify-center items-center my-4">
    <div 
      v-for="i in max" 
      :key="i"
      class="hexagon-container relative transition-transform duration-300"
      :class="[
        i <= current ? 'scale-110' : 'scale-100 opacity-40',
        i === current && animateLast ? 'pulse-animation' : ''
      ]"
    >
      <!-- Nimiq Hexagon SVG -->
      <svg width="27" height="24" viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26.6991 10.875L21.0741 1.125C20.6691 0.4275 19.9266 0 19.1241 0H7.87414C7.07164 0 6.32914 0.4275 5.92789 1.125L0.302891 10.875C-0.0983594 11.5725 -0.0983594 12.4275 0.302891 13.125L5.92789 22.875C6.32914 23.5725 7.07164 24 7.87414 24H19.1241C19.9266 24 20.6691 23.5725 21.0704 22.875L26.6954 13.125C27.1004 12.4275 27.1004 11.5725 26.6991 10.875Z" 
              :fill="i <= current ? 'url(#paint0_radial_' + uniqueId + ')' : 'currentColor'" 
              :class="i <= current ? '' : 'text-gray-400 dark:text-gray-600'" />
        
        <defs v-if="i <= current">
          <radialGradient :id="'paint0_radial_' + uniqueId" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26.9996 24) rotate(-180) scale(26.9977 24)">
            <stop stop-color="#EC991C"/>
            <stop offset="1" stop-color="#E9B213"/>
          </radialGradient>
        </defs>
      </svg>
      
      <!-- Optional checkmark for completed -->
      <div v-if="i <= current && isClaimed(i)" class="absolute inset-0 flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Nimiq Hexagon outline progress dial for targets > 10 -->
  <div v-else class="large-progress-wrap my-4">
    <div class="progress-ring-container">
      <svg class="progress-ring" width="100" height="100" viewBox="0 0 100 100">
        <!-- Background track (Hexagon) -->
        <path class="progress-hex__track" d="M 50 6 L 88 28 L 88 72 L 50 94 L 12 72 L 12 28 Z" stroke="var(--border-medium)" stroke-width="5" fill="transparent" />
        <!-- Active filling track (Hexagon) -->
        <path 
          class="progress-hex__fill" 
          d="M 50 6 L 88 28 L 88 72 L 50 94 L 12 72 L 12 28 Z" 
          stroke="url(#ringGrad)" 
          stroke-width="7" 
          fill="transparent" 
          stroke-linecap="round"
          stroke-dasharray="264" 
          :stroke-dashoffset="((max - current) / max) * 264"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EC991C"/>
            <stop offset="100%" stop-color="#E9B213"/>
          </linearGradient>
        </defs>
      </svg>
      
      <!-- Center Text inside the Hexagon -->
      <div class="progress-ring-text">
        <span class="progress-ring-current">{{ current }}</span>
        <span class="progress-ring-sep">/</span>
        <span class="progress-ring-max">{{ max }}</span>
      </div>
    </div>

    <!-- Horizontal Scrollable Stamp Reel (Option B) -->
    <div class="stamp-reel-container">
      <div class="stamp-reel-flow">
        <div 
          v-for="i in max" 
          :key="i"
          class="reel-stamp"
          :class="{ 'reel-stamp--completed': i <= current, 'reel-stamp--current': i === current + 1 }"
        >
          <!-- Hexagon Icon inside the reel -->
          <div class="reel-hex">
            <svg width="22" height="20" viewBox="0 0 27 24" fill="none">
              <path d="M26.7 10.9L21.1 1.1C20.7.4 20 0 19.1 0H7.9C7 0 6.3.4 5.9 1.1L.3 10.9C-.1 11.6-.1 12.4.3 13.1L5.9 22.9C6.3 23.6 7 24 7.9 24H19.1C20 24 20.7 23.6 21.1 22.9L26.7 13.1C27.1 12.4 27.1 11.6 26.7 10.9Z" 
                    :fill="i <= current ? 'var(--nim-gold)' : 'rgba(255, 255, 255, 0.1)'"/>
            </svg>
            <span class="reel-num">{{ i }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  current: {
    type: Number,
    required: true,
    default: 0
  },
  max: {
    type: Number,
    required: true,
    default: 10
  },
  animateLast: {
    type: Boolean,
    default: true
  },
  claimedCount: {
    type: Number,
    default: 0
  }
});

const uniqueId = computed(() => Math.random().toString(36).substr(2, 9));

const isClaimed = (index) => {
  return index <= props.claimedCount;
};
</script>

<style scoped>
@keyframes pulseHex {
  0% { transform: scale(1.1); box-shadow: 0 0 0 0 rgba(236, 153, 28, 0.7); }
  70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(236, 153, 28, 0); }
  100% { transform: scale(1.1); box-shadow: 0 0 0 0 rgba(236, 153, 28, 0); }
}

.pulse-animation svg {
  animation: pulseHex 2s infinite;
  border-radius: 50%;
}

/* Large Progress Styles */
.large-progress-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}
.progress-ring-container {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-ring {
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}
.progress-hex__fill {
  transition: stroke-dashoffset 0.35s ease;
}
.progress-ring-text {
  position: absolute;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 1px;
}
.progress-ring-current {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
}
.progress-ring-sep {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  margin: 0 1px;
}
.progress-ring-max {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
}

/* Stamp Reel */
.stamp-reel-container {
  width: 100%;
  overflow-x: auto;
  padding: 8px 0;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.stamp-reel-container::-webkit-scrollbar {
  display: none;
}
.stamp-reel-flow {
  display: flex;
  gap: 10px;
  padding: 0 16px;
  width: max-content;
}
.reel-stamp {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.65;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.reel-stamp--completed {
  opacity: 1;
}
.reel-stamp--current {
  opacity: 1;
  transform: scale(1.15);
  filter: drop-shadow(0 0 8px var(--nim-gold-glow));
}
.reel-hex {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reel-num {
  position: absolute;
  font-size: 0.65rem;
  font-weight: 800;
  color: #000;
  z-index: 2;
}
.reel-stamp--completed .reel-num {
  color: #000;
}
.reel-stamp:not(.reel-stamp--completed) .reel-num {
  color: var(--text-secondary);
}
</style>
