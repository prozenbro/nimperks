<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="Accounting Ledger">
      <template #subtitle>{{ redemptions.length }} record{{ redemptions.length !== 1 ? 's' : '' }}</template>
    </k-navbar>

    <!-- Loading -->
    <div v-if="loading" class="px-4 py-4 space-y-3">
      <div class="skeleton h-16 rounded-2xl" v-for="i in 4" :key="i" />
    </div>

    <!-- Empty -->
    <div v-else-if="redemptions.length === 0" class="empty-state">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon-svg">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <h3 class="empty-title">No redemptions yet</h3>
      <p class="empty-desc">Vouchers you scan will appear here as an immutable on-chain ledger.</p>
    </div>

    <!-- Ledger list -->
    <div v-else class="px-4 py-4 space-y-3 pb-8">
      <div
        v-for="item in redemptions"
        :key="item.hash"
        class="ledger-row"
      >
        <div class="ledger-status-dot" :class="item.status === 'confirmed' ? 'dot--ok' : 'dot--pending'" />

        <div class="ledger-body">
          <div class="ledger-top">
            <span class="ledger-reward">{{ item.reward || 'Reward Redeemed' }}</span>
            <span class="ledger-badge" :class="item.status === 'confirmed' ? 'badge-success' : 'badge-pending'">
              {{ item.status === 'confirmed' ? 'Settled' : '0-Conf' }}
            </span>
          </div>
          <p class="ledger-addr">Customer: {{ formatAddr(item.user) }}</p>
          <p class="ledger-hash">Tx: {{ formatHash(item.hash) }}</p>
          <p class="ledger-time">{{ formatTime(item.timestamp) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Navbar as kNavbar } from 'konsta/vue';
import { db } from '@/db/schema';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const loading = ref(true);
const redemptions = ref([]);

onMounted(async () => {
  try {
    const all = await db.redemptions
      .where('merchant').equals(auth.address)
      .reverse().sortBy('timestamp');
    redemptions.value = all;
  } catch (e) { console.error(e); }
  loading.value = false;
});

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function formatAddr(a) {
  if (!a) return '—';
  return a.substring(0, 9) + '…' + a.slice(-5);
}
function formatHash(h) {
  if (!h) return '—';
  if (h.length <= 16) return h;
  return h.substring(0, 10) + '…' + h.slice(-10);
}
</script>

<style scoped>
.view-root { background: var(--bg-primary); min-height: 100%; }

.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 32px; }
.empty-icon-svg { color: var(--text-tertiary); margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.empty-desc  { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; max-width: 240px; }

.ledger-row {
  display: flex;
  gap: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 18px;
  padding: 16px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.ledger-row:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.ledger-status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.dot--ok      { background: var(--success); box-shadow: 0 0 6px rgba(48,209,88,0.5); }
.dot--pending { background: var(--warning); box-shadow: 0 0 6px rgba(255,214,10,0.5); }

.ledger-body { flex: 1; overflow: hidden; }
.ledger-top  { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }

.ledger-reward { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.ledger-badge  { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 8px; border-radius: 100px; flex-shrink: 0; }
.ledger-addr   { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 2px; }
.ledger-hash   { font-size: 0.65rem; font-family: monospace; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ledger-time   { font-size: 0.72rem; color: var(--text-tertiary); margin-top: 4px; }
</style>
