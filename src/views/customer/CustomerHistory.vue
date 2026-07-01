<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="Claimed Perks">
      <template #subtitle>Your on-chain receipt history</template>
    </k-navbar>

    <div v-if="loading" class="px-4 py-4 space-y-3">
      <div class="skeleton h-16 rounded-2xl" v-for="i in 4" :key="i" />
    </div>

    <div v-else-if="redemptions.length === 0" class="empty-state">
      <div class="trophy-emoji">🏆</div>
      <h3 class="empty-title">No history yet</h3>
      <p class="empty-desc">Every reward you claim will appear here as a permanent on-chain receipt.</p>
    </div>

    <div v-else class="px-4 py-4 space-y-3 pb-8">
      <div
        v-for="item in redemptions"
        :key="item.hash"
        class="receipt-row"
      >
        <div class="receipt-icon" :class="item.status === 'confirmed' ? 'icon--ok' : 'icon--pending'">
          <svg v-if="item.status === 'confirmed'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>

        <div class="receipt-body">
          <div class="receipt-top">
            <span class="receipt-reward">{{ item.reward || 'Reward Redeemed' }}</span>
            <span
              class="receipt-badge"
              :class="item.status === 'confirmed' ? 'badge-success' : 'badge-pending'"
            >
              {{ item.status === 'confirmed' ? 'Confirmed' : 'Pending' }}
            </span>
          </div>
          <p class="receipt-merchant">
            {{ item.merchantName }}
          </p>
          <div v-if="item.signature" class="verified-badge-sub" title="Verified Owner">
            ✓ {{ getShortAddress(item.merchant) }}
          </div>
          <p class="receipt-hash">{{ formatHash(item.hash) }}</p>
          <p class="receipt-time">{{ formatTime(item.timestamp) }}</p>
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
  if (!auth.address) return (loading.value = false);
  try {
    const all = await db.redemptions.where('user').equals(auth.address).reverse().sortBy('timestamp');
    const enhanced = [];
    for (const r of all) {
      const merchant = await db.merchants.get(r.merchant);
      enhanced.push({
        ...r,
        merchantName: merchant?.name ?? `Merchant ${r.merchant?.substring(2, 8)}`,
        signature: merchant?.signature ?? ''
      });
    }
    redemptions.value = enhanced;
  } catch (e) { console.error(e); }
  loading.value = false;
});

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function formatHash(h) {
  if (!h) return '—';
  if (h.length <= 16) return h;
  return h.substring(0, 10) + '…' + h.slice(-10);
}

function getShortAddress(address) {
  if (!address) return '';
  const clean = address.replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return `${clean.substring(0, 4)}...${clean.substring(clean.length - 4)}`;
}
</script>

<style scoped>
.view-root { background: var(--bg-primary); min-height: 100%; }

.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
.trophy-emoji { font-size: 3.5rem; margin-bottom: 16px; }
.empty-title  { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
.empty-desc   { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; max-width: 230px; }

.receipt-row {
  display: flex;
  gap: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 18px;
  padding: 16px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.receipt-row:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.receipt-icon {
  width: 36px; height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.icon--ok      { background: rgba(48,209,88,0.15); color: var(--success); }
.icon--pending { background: rgba(255,214,10,0.15); color: var(--warning); }

.receipt-body  { flex: 1; overflow: hidden; }
.receipt-top   { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px; }
.receipt-reward { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.receipt-badge  {
  font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; padding: 2px 8px; border-radius: 100px; flex-shrink: 0;
}
.receipt-merchant { font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 2px; }
.receipt-hash {
  font-size: 0.65rem; font-family: monospace; color: var(--text-tertiary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.receipt-time { font-size: 0.7rem; color: var(--text-tertiary); margin-top: 3px; }
</style>
