<template>
  <k-app theme="ios">
    <!--
      App shell:
      - LoginView renders when auth.address is null (full screen, no shell chrome)
      - Once logged in, auth store routes to /customer or /merchant
      - TopHeader and BottomNav are only shown when authenticated
    -->
    <router-view v-if="!auth.address" />

    <div v-else class="app-shell">
      <router-view />
    </div>

    <!-- Global settings sheet, portal-style on top of everything -->
    <SettingsSheet v-if="ui.isSettingsOpen" />
  </k-app>
</template>

<script setup>
import { onUnmounted, watch } from 'vue';
import { App as kApp } from 'konsta/vue';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import SettingsSheet from '@/components/SettingsSheet.vue';
import { indexerService } from '@/indexer/IndexerService';

const auth = useAuthStore();
const ui = useUIStore();

let syncInterval = null;

function startSync() {
  if (!syncInterval) {
    indexerService.startSyncLoop(30000);
    // Also kick off an immediate sync every 15s as a heartbeat
    syncInterval = setInterval(() => indexerService.syncAllMerchants(), 15000);
  }
}

function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    indexerService.stopSyncLoop();
  }
}

watch(() => auth.address, (address) => {
  if (address) {
    indexerService.syncUserHistory(address).catch(console.error);
    startSync();
  } else {
    stopSync();
  }
}, { immediate: true });

onUnmounted(() => {
  stopSync();
});
</script>

<style>
/* App shell: full height, responsive width */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}
</style>
