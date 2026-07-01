<template>
  <div class="modal">
    <div class="modal-content glass-panel">
      <div class="flex justify-between mb-6">
        <h2 class="text-xl font-bold">Settings</h2>
        <button @click="ui.isSettingsOpen = false" class="icon-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="mb-6">
        <label class="block mb-2 text-[var(--text-secondary)]">Theme</label>
        <div class="segmented-control theme-toggle">
          <button class="segment" :class="{ active: ui.theme === 'system' }" @click="ui.setTheme('system')">System</button>
          <button class="segment" :class="{ active: ui.theme === 'light' }" @click="ui.setTheme('light')">Light</button>
          <button class="segment" :class="{ active: ui.theme === 'dark' }" @click="ui.setTheme('dark')">Dark</button>
        </div>
      </div>
      <button @click="auth.logout()" class="btn btn-outline w-full border-red-500 text-red-500 hover:bg-red-500/10">Disconnect Wallet</button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';

const auth = useAuthStore();
const ui = useUIStore();
</script>
