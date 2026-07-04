<template>
  <!-- Uses Konsta k-sheet for a native iOS bottom sheet -->
  <k-sheet
    opened
    @backdropclick="ui.isSettingsOpen = false"
    class="settings-sheet"
  >
    <k-navbar title="Settings">
      <template #right>
        <span @click="ui.isSettingsOpen = false" style="font-weight: 600; color: var(--nim-gold); cursor: pointer; padding-right: 8px;">Done</span>
      </template>
    </k-navbar>

    <div class="sheet-body">
      <!-- Theme -->
      <k-block-title>Appearance</k-block-title>
      <k-list strong inset>
        <k-list-item title="Theme">
          <template #after>
            <k-segmented strong rounded class="w-40">
              <k-segmented-button :active="ui.theme === 'system'" @click="ui.setTheme('system')" small>Auto</k-segmented-button>
              <k-segmented-button :active="ui.theme === 'light'" @click="ui.setTheme('light')" small>Light</k-segmented-button>
              <k-segmented-button :active="ui.theme === 'dark'" @click="ui.setTheme('dark')" small>Dark</k-segmented-button>
            </k-segmented>
          </template>
        </k-list-item>
      </k-list>

      <!-- Network status -->
      <k-block-title>Network</k-block-title>
      <k-list strong inset>
        <k-list-item title="Network">
          <template #after>
            <span class="flex items-center gap-1.5 text-sm font-medium" style="color: var(--success)">
              <span class="w-2 h-2 rounded-full inline-block" style="background: var(--success)" />
              {{ IS_TESTNET ? 'Testnet' : 'Mainnet' }}
            </span>
          </template>
        </k-list-item>
      </k-list>

      <!-- Danger zone -->
      <k-block class="mt-4" style="padding-bottom: 24px;">
        <div style="display: flex; gap: 12px; width: 100%;">
          <k-button
            style="flex: 1; background: rgba(85,85,85,0.12); color: #555555; border: 0.5px solid rgba(85,85,85,0.25);"
            @click="clearCacheAndResync"
          >
            Clear Cache
          </k-button>

          <k-button
            style="flex: 1; background: #FF3B30; color: #FFFFFF; border: none; box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);"
            @click="doLogout"
          >
            Sign Out
          </k-button>
        </div>
      </k-block>
    </div>
  </k-sheet>
</template>

<script setup>
import {
  Sheet as kSheet,
  Navbar as kNavbar,
  Link as kLink,
  BlockTitle as kBlockTitle,
  List as kList,
  ListItem as kListItem,
  Block as kBlock,
  Button as kButton,
  Segmented as kSegmented,
  SegmentedButton as kSegmentedButton
} from 'konsta/vue';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { db } from '@/db/schema';

const auth = useAuthStore();
const ui = useUIStore();
const IS_TESTNET = import.meta.env.VITE_NIMIQ_NETWORK === 'testnet';

async function clearCacheAndResync() {
  if (confirm('This will clear your local app cache and resync data from the blockchain. Continue?')) {
    try {
      await db.sync_state.clear();
      await db.transactions.clear();
      await db.stamps.clear();
      await db.campaigns.clear();
      auth.logout();
      window.location.reload();
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }
}

function doLogout() {
  ui.isSettingsOpen = false;
  auth.logout();
}
</script>

<style scoped>
.settings-sheet {
  border-radius: 24px 24px 0 0 !important;
  overflow: hidden;
}
.sheet-body {
  padding: 0 16px env(safe-area-inset-bottom, 16px) 16px;
  min-height: 280px;
}
</style>
