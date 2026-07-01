<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="Group Deals">
      <template #subtitle>Crowdsourced FlashBuys</template>
      <template #right>
        <k-link navbar @click="refreshData" style="margin-right: 8px;">
          <!-- Nimiq Keyguard-style Hexagon Loader -->
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            class="nimiq-hex-loader"
            :class="{ 'nimiq-hex-loader--spinning': syncing }"
            style="color: var(--nim-gold);"
          >
            <!-- Big Hexagon -->
            <path class="loading-big-hex" d="M22 12l-5 8.66H7L2 12l5-8.66h10L22 12z" stroke="currentColor" stroke-width="2" fill="none" />
            <!-- Small Hexagon -->
            <path class="loading-small-hex" d="M17 12l-2.5 4.33h-5L7 12l2.5-4.33h5L17 12z" fill="currentColor" />
          </svg>
        </k-link>
      </template>
    </k-navbar>

    <!-- Loading -->
    <div v-if="loading" class="px-4 py-4 space-y-4">
      <div class="skeleton h-44 rounded-2xl" v-for="i in 2" :key="i" />
    </div>

    <!-- Empty -->
    <div v-else-if="deals.length === 0" class="empty-state">
      <div class="empty-lightning">⚡</div>
      <h3 class="empty-title">No active deals</h3>
      <p class="empty-desc">FlashBuys from merchants you follow will appear here. Check back soon!</p>
    </div>

    <!-- Deal cards -->
    <div v-else class="px-4 py-4 space-y-4 pb-8">
      <div
        v-for="deal in deals"
        :key="deal.id"
        class="deal-card"
        :class="deal.isUnlocked ? 'deal-card--unlocked' : ''"
      >
        <!-- Header -->
        <div class="deal-header">
          <span class="deal-badge" :class="deal.isUnlocked ? 'badge-success' : 'badge-purple'">
            {{ deal.isUnlocked ? '🎉 Unlocked!' : '⚡ FlashBuy' }}
          </span>
          <span class="deal-expiry">Ends {{ formatExpiry(deal.expiry) }}</span>
        </div>

        <h3 class="deal-title" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <span>{{ deal.id }}</span>
          <button class="info-trigger-btn" style="padding: 0; font-size: 0.9rem;" @click="openDealExplainer(deal)">ℹ️</button>
        </h3>
        <p class="deal-merchant">
          {{ deal.merchantName }}
        </p>
        <div v-if="deal.signature" class="verified-badge-sub" title="Verified Owner">
          ✓ {{ getShortAddress(deal.merchant) }}
        </div>
        <p v-if="deal.label" class="deal-reward">Reward: {{ deal.label }}</p>

        <!-- Crowd progress -->
        <div class="crowd-row">
          <div class="crowd-info">
            <span class="crowd-count">{{ deal.current_count }}</span>
            <span class="crowd-sep">/</span>
            <span class="crowd-total">{{ deal.target }}</span>
            <span class="crowd-label">joined</span>
          </div>
          <span class="crowd-pct">{{ Math.round((deal.current_count / deal.target) * 100) }}%</span>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            :class="deal.isUnlocked ? 'progress-fill--gold' : 'progress-fill--purple'"
            :style="{ width: Math.min((deal.current_count / deal.target) * 100, 100) + '%' }"
          />
        </div>

        <p class="crowd-remaining">
          {{ deal.isUnlocked
            ? 'Deal activated! Enjoy your reward.'
            : `${deal.target - deal.current_count} more needed to unlock` }}
        </p>

        <!-- CTA -->
        <k-button
          v-if="!deal.isUnlocked && !deal.hasJoined"
          class="nim-btn-primary w-full mt-4 submit-btn"
          :disabled="joining === deal.id"
          @click="joinDeal(deal)"
        >
          <span v-if="joining === deal.id" class="spinner" />
          <span v-else>Join Deal · 1 luna</span>
        </k-button>
        <div v-else-if="deal.hasJoined" class="joined-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          You've joined
        </div>
      </div>
    </div>
    <!-- Explainer Modal -->
    <ExplainerModal 
      v-if="activeExplainer"
      :show="!!activeExplainer" 
      :emoji="activeExplainer.emoji" 
      :title="activeExplainer.title" 
      :paragraphs="activeExplainer.paragraphs" 
      @close="activeExplainer = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Navbar as kNavbar, Link as kLink, Button as kButton } from 'konsta/vue';
import { db } from '@/db/schema';
import { wallet } from '@/protocol/walletAdapter';
import { useAuthStore } from '@/stores/auth';
import { indexerService } from '@/indexer/IndexerService';
import ExplainerModal from '@/components/ExplainerModal.vue';
import { parseTransactionData } from '@/protocol/parser';

const auth = useAuthStore();
const loading = ref(true);
const deals = ref([]);
const joining = ref(null);
const activeExplainer = ref(null);
const CAMPAIGN_ADDRESS = import.meta.env.VITE_NIMIQ_CAMPAIGN_ADDRESS || '';

const syncing = ref(false);

async function loadDeals() {
  try {
    const all = await db.campaigns.toArray();
    const flashbuys = all.filter(c => c.expiry && c.expiry > Date.now());
    
    // Query local transactions to find which campaign IDs the user has joined
    const normalisedUser = auth.address?.replace(/\s+/g, '').toUpperCase() || '';
    const userTxs = normalisedUser 
      ? await db.transactions.where('from').equals(normalisedUser).toArray()
      : [];
    
    const joinedCampaignIds = new Set();
    for (const tx of userTxs) {
      const parsed = parseTransactionData(tx.data);
      if (parsed && parsed.type === 'flashbuy_join') {
        joinedCampaignIds.add(parsed.campId);
      }
    }

    const enhanced = [];
    for (const d of flashbuys) {
      const merchant = await db.merchants.get(d.merchant);
      enhanced.push({
        ...d,
        merchantName: merchant?.name ?? `Merchant ${d.merchant.substring(2, 8)}`,
        signature: merchant?.signature ?? '',
        isUnlocked: (d.current_count || 0) >= d.target,
        hasJoined: joinedCampaignIds.has(d.id),
      });
    }
    deals.value = enhanced.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (e) { console.error(e); }
}

onMounted(async () => {
  await loadDeals();
  loading.value = false;
});

async function refreshData() {
  if (syncing.value) return;
  syncing.value = true;
  try {
    await indexerService.syncAllMerchants();
    await loadDeals();
  } catch (e) {
    console.error(e);
  } finally {
    syncing.value = false;
  }
}

async function joinDeal(deal) {
  joining.value = deal.id;
  try {
    const extra = new TextEncoder().encode(`JOIN|${deal.id}`);
    await wallet.sendTransaction({ recipient: CAMPAIGN_ADDRESS || deal.merchant, value: 1, extraData: extra });
    
    // Save a local mock transaction to IndexedDB immediately so the "You've Joined" status persists
    const normalisedUser = auth.address?.replace(/\s+/g, '').toUpperCase() || '';
    if (normalisedUser) {
      const mockHash = 'tx-' + Math.random().toString(36).substring(2) + Date.now();
      await db.transactions.put({
        hash: mockHash,
        from: normalisedUser,
        to: CAMPAIGN_ADDRESS || deal.merchant,
        value: 1,
        data: `JOIN|${deal.id}`,
        timestamp: Date.now()
      });
    }

    deal.current_count = (deal.current_count || 0) + 1;
    deal.hasJoined = true;
    deal.isUnlocked = deal.current_count >= deal.target;
  } catch (e) {
    console.error(e);
    alert('Failed to join deal. Transaction cancelled.');
  } finally {
    joining.value = null;
  }
}

function formatExpiry(expiry) {
  if (!expiry) return '—';
  return new Date(expiry).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function openDealExplainer(deal) {
  activeExplainer.value = {
    emoji: '⚡',
    title: `FlashBuy Group Deal Details`,
    paragraphs: [
      `This is a FlashBuy group campaign for "${deal.id}" by "${deal.merchantName}".`,
      `In order to unlock this reward, a total of ${deal.target} participants need to join before the expiry date.`,
      `Currently, ${deal.current_count} participants have joined. If the target is met, the reward "${deal.label}" unlocks and you will be able to claim your reward voucher code!`
    ]
  };
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
.empty-lightning { font-size: 3rem; margin-bottom: 16px; }
.empty-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
.empty-desc  { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; max-width: 240px; }

.deal-card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 22px;
  padding: 20px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.deal-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.deal-card--unlocked {
  border-color: rgba(233,178,19,0.5);
  background: linear-gradient(145deg, rgba(233,178,19,0.08) 0%, var(--bg-card) 100%);
  box-shadow: 0 8px 32px rgba(233, 178, 19, 0.15);
}
.deal-card:active { transform: scale(0.985); }

.deal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.deal-badge  { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 10px; border-radius: 100px; }
.deal-expiry { font-size: 0.75rem; color: var(--text-tertiary); font-weight: 500; }
.deal-title    { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; letter-spacing: -0.015em; }

/* Info Trigger Button */
.info-trigger-btn {
  background: none;
  border: none;
  font-size: 1.05rem;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s ease;
}
.info-trigger-btn:hover {
  color: var(--nim-gold);
}

.deal-merchant { font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px; }
.deal-reward   { font-size: 0.82rem; font-weight: 600; color: var(--nim-gold); margin-bottom: 12px; }

.crowd-row  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.crowd-info { display: flex; align-items: baseline; gap: 3px; }
.crowd-count { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); }
.crowd-sep   { font-size: 0.9rem; color: var(--text-tertiary); }
.crowd-total { font-size: 0.9rem; color: var(--text-secondary); }
.crowd-label { font-size: 0.72rem; color: var(--text-tertiary); margin-left: 4px; }
.crowd-pct   { font-size: 0.8rem; font-weight: 700; color: var(--purple); }

.progress-track { height: 7px; background: var(--bg-secondary); border-radius: 100px; overflow: hidden; margin-bottom: 8px; }
.progress-fill  { height: 100%; border-radius: 100px; transition: width 0.6s ease; }
.progress-fill--purple { background: linear-gradient(90deg, #7B2FBE, var(--purple)); box-shadow: 0 0 8px rgba(191,90,242,0.5); }
.progress-fill--gold   { background: linear-gradient(90deg, var(--nim-orange), var(--nim-gold)); box-shadow: 0 0 8px var(--nim-gold-glow); }

.crowd-remaining { font-size: 0.78rem; color: var(--text-secondary); text-align: right; }

.joined-badge {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 14px; padding: 10px; border-radius: 12px;
  background: rgba(48,209,88,0.1); color: var(--success);
  font-size: 0.85rem; font-weight: 600;
}

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

/* Nimiq Hex Loader Keyguard styles */
.nimiq-hex-loader {
  transform-origin: center;
  display: inline-block;
}
.nimiq-hex-loader--spinning {
  animation: rotate 2s linear infinite !important;
}
.nimiq-hex-loader--spinning .loading-big-hex {
  stroke-dasharray: 62;
  stroke-dashoffset: 62;
  animation: dash 1.5s ease-in-out infinite alternate !important;
}
.nimiq-hex-loader--spinning .loading-small-hex {
  transform-origin: center;
  animation: pulse 1.5s ease-in-out infinite alternate !important;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}
@keyframes dash {
  0% { stroke-dashoffset: 62; }
  100% { stroke-dashoffset: 0; }
}
@keyframes pulse {
  0% { transform: scale(0.6); opacity: 0.2; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
