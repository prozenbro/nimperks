<template>
  <div class="view-root anim-fade-up">
    <!-- Sticky Navbar -->
    <k-navbar title="Active Campaigns">
      <template #right>
        <k-link navbar @click="ui.isSettingsOpen = true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </k-link>
      </template>
    </k-navbar>
 
    <!-- FTUE Full-Screen Onboarding Explainer Overlay (Royal Match style) -->
    <Teleport to="body">
      <div v-if="!loading && showOnboardingFTUE" class="ftue-overlay">
        <!-- Standard dark overlay behind the dialog -->
        <div class="ftue-backdrop"></div>

        <!-- Highlighted area over the Profile tab -->
        <div 
          class="ftue-highlight" 
          @click="$router.push('/merchant/profile')"
        >
          <!-- Bouncy pointer finger -->
          <div class="ftue-arrow">👇</div>
        </div>

        <!-- Dialogue/Explainer Card -->
        <div class="ftue-dialogue card-premium p-5 text-center">
          <div style="font-size: 2.5rem; margin-bottom: 12px; animation: bounce 1s infinite alternate;">🚀</div>
          <h3 class="ftue-step-title">{{ ftueSteps[ftueStep].title }}</h3>
          <p class="ftue-step-desc mt-2">{{ ftueSteps[ftueStep].desc }}</p>
          <k-button class="nim-btn-primary mt-4 submit-btn" style="max-width: 180px;" @click="advanceFTUE">
            {{ ftueStep === ftueSteps.length - 1 ? 'Go to Profile' : 'Continue' }}
          </k-button>
        </div>
      </div>
    </Teleport>

    <!-- Loading skeleton -->
    <div v-if="loading" class="px-4 py-4 space-y-4">
      <div class="skeleton h-28 rounded-2xl" />
      <div class="skeleton h-28 rounded-2xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="campaigns.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="40" height="36" viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M26.6991 10.875L21.0741 1.125C20.6691 0.4275 19.9266 0 19.1241 0H7.87414C7.07164 0 6.32914 0.4275 5.92789 1.125L0.302891 10.875C-0.0983594 11.5725 -0.0983594 12.4275 0.302891 13.125L5.92789 22.875C6.32914 23.5725 7.07164 24 7.87414 24H19.1241C19.9266 24 20.6691 23.5725 21.0704 22.875L26.6954 13.125C27.1004 12.4275 27.1004 11.5725 26.6991 10.875Z" fill="rgba(233,178,19,0.2)"/>
        </svg>
      </div>
      <h3 class="empty-title">No active campaigns</h3>
      <p class="empty-desc">Create a loyalty program or group deal from the Create tab.</p>
      <k-button @click="$router.push('/merchant/add')" class="mt-5 nim-btn-primary">
        Create Campaign
      </k-button>
    </div>

    <!-- Campaign cards -->
    <div v-else class="cards-list px-4 py-4">
      <!-- Summary bar -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-value">{{ loyaltyCount }}</span>
          <span class="summary-label">Perks</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-value">{{ flashbuyCount }}</span>
          <span class="summary-label">FlashBuys</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-value">{{ campaigns.length }}</span>
          <span class="summary-label">Total</span>
        </div>
      </div>
      <!-- Store Join QR Code -->
      <div class="card-premium p-4 text-center mt-2 mb-2" style="background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border-medium); overflow: visible !important;">
        <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-2" style="color: var(--text-secondary); font-size: 0.75rem; letter-spacing: 0.05em; font-weight: 700;">Store Perks QR Code</h4>
        <div style="display: flex; justify-content: center; margin: 12px 0; position: relative;">
          <!-- Backdrop overlay -->
          <div v-if="isQRZoomed" class="qr-zoom-backdrop" @click="isQRZoomed = false" />
          <canvas 
            ref="qrCanvas" 
            class="qr-zoomable"
            :class="{ 'qr-zoomed': isQRZoomed }"
            @click="isQRZoomed = !isQRZoomed"
            style="border-radius: 12px; background: white; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" 
          />
        </div>
        <!-- Action Buttons -->
        <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 12px;">
          <button @click="downloadQR" class="qr-action-btn" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: var(--bg-secondary); border: 0.5px solid var(--border-medium); border-radius: 10px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: background 0.15s;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </button>
          <button @click="shareQR" class="qr-action-btn" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: var(--bg-secondary); border: 0.5px solid var(--border-medium); border-radius: 10px; color: var(--text-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: background 0.15s;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
        </div>
        <p class="text-xs" style="color: var(--text-secondary); font-size: 0.75rem; line-height: 1.4; padding: 0 12px;">Let customers scan this QR code to claim your store name and campaigns off-chain instantly!</p>
      </div>

      <!-- Individual cards -->
      <div
        v-for="camp in campaigns"
        :key="camp.id"
        class="campaign-card"
        :class="camp.type === 'FLASHBUY' ? 'campaign-card--purple' : 'campaign-card--gold'"
      >
        <!-- Type badge -->
        <div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="type-badge" :class="camp.type === 'FLASHBUY' ? 'type-badge--purple' : 'type-badge--gold'">
              {{ camp.type === 'FLASHBUY' ? '⚡ FlashBuy' : '🏆 Perks' }}
            </span>
            <button class="info-trigger-btn" style="padding: 0; font-size: 0.9rem;" @click="openCampaignExplainer(camp)">ℹ️</button>
          </div>
          <button class="close-campaign-btn" @click="closeCampaign(camp.id)" title="Close campaign">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <h3 class="card-title">{{ camp.label || 'Campaign ' + camp.id.substring(0, 8) }}</h3>
        <p class="card-id">ID: {{ formatId(camp.id) }}</p>

        <div class="card-meta">
          <div class="meta-chip">
            <span class="meta-chip-value">{{ camp.target }}</span>
            <span class="meta-chip-label">{{ camp.type === 'FLASHBUY' ? 'buyers' : camp.type === 'VOLUME' ? 'NIM' : 'stamps' }}</span>
          </div>
          <div class="meta-chip" v-if="camp.type === 'FLASHBUY' && camp.current_count !== undefined">
            <span class="meta-chip-value">{{ camp.current_count }}</span>
            <span class="meta-chip-label">joined</span>
          </div>
          <div class="meta-chip">
            <span class="meta-chip-label">Created</span>
            <span class="meta-chip-value">{{ formatDate(camp.timestamp) }}</span>
          </div>
        </div>

        <!-- FlashBuy progress bar -->
        <div v-if="camp.type === 'FLASHBUY'" class="progress-wrap">
          <div class="progress-track">
            <div
              class="progress-fill progress-fill--purple"
              :style="{ width: Math.min((camp.current_count / camp.target) * 100, 100) + '%' }"
            />
          </div>
          <span class="progress-pct">{{ Math.round((camp.current_count / camp.target) * 100) }}%</span>
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
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { Navbar as kNavbar, Link as kLink, Button as kButton } from 'konsta/vue';
import { db } from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { indexerService } from '@/indexer/IndexerService';
import { wallet } from '@/protocol/walletAdapter';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import ExplainerModal from '@/components/ExplainerModal.vue';
import { packClose } from '@/protocol/parser';

const auth = useAuthStore();
const ui = useUIStore();
const $router = useRouter();
const loading = ref(true);
const campaigns = ref([]);
const CAMPAIGN_ADDRESS = import.meta.env.VITE_NIMIQ_CAMPAIGN_ADDRESS || '';
const qrCanvas = ref(null);
const profileData = ref(null);
const ruleData = ref(null);
const isQRZoomed = ref(false);
const showOnboardingFTUE = ref(false);
const ftueStep = ref(0);
const activeExplainer = ref(null);
const ftueSteps = [
  {
    title: "Brand Your Store!",
    desc: "Welcome to NimPerks! To let customers scan your code, you need to set up your store identity."
  },
  {
    title: "Set Your Branch Name",
    desc: "If you have multiple locations, you can define branch tags (e.g. Downtown) so customers know exactly where they shopped."
  },
  {
    title: "Set Default Stamp Target",
    desc: "Use the custom range slider to configure how many stamps customers need to collect before unlocking vouchers."
  },
  {
    title: "Onboarding Profile Tab",
    desc: "We've highlighted the Profile button in the bottom navigation. Tap it to claim your store branding off-chain for free!"
  }
];

function advanceFTUE() {
  if (ftueStep.value < ftueSteps.value.length - 1) {
    ftueStep.value++;
  } else {
    $router.push('/merchant/profile');
  }
}

const loyaltyCount = computed(() => campaigns.value.filter(c => c.type !== 'FLASHBUY').length);
const flashbuyCount = computed(() => campaigns.value.filter(c => c.type === 'FLASHBUY').length);

async function loadCampaigns() {
  if (!auth.address) return;
  const normAddress = auth.address.replace(/\s+/g, '').toUpperCase();
  const all = await db.campaigns
    .where('merchant').equals(normAddress)
    .filter(c => c.status === 'active' || !c.status) // treat missing status as active
    .toArray();
  campaigns.value = all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  await checkOnboarding();
  loading.value = false;
  generateStoreQR();
}

async function checkOnboarding() {
  if (!auth.address) return;
  const normAddress = auth.address.replace(/\s+/g, '').toUpperCase();
  const profile = await db.merchants.get(normAddress);
  showOnboardingFTUE.value = !profile || !profile.signature || profile.name.startsWith('Merchant ') || profile.name.startsWith('Store ');
}

async function generateStoreQR() {
  if (!auth.address) return;
  const normAddress = auth.address.replace(/\s+/g, '').toUpperCase();
  profileData.value = await db.merchants.get(normAddress);
  ruleData.value = await db.rules.where('merchant').equals(normAddress).first();

  let payload = `nimperks:${normAddress}`;
  // Removed off-chain signature payload generation

  // Ensure canvas is rendered before building QR
  await new Promise(r => setTimeout(r, 100));
  if (qrCanvas.value) {
    QRCode.toCanvas(qrCanvas.value, payload, {
      width: 160,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }, (err) => {
      if (err) console.error('[QR] Error generating Store QR:', err);
    });
  }
}

function downloadQR() {
  if (!qrCanvas.value) return;
  const link = document.createElement('a');
  link.download = `store-perks-qr-${auth.address.replace(/\s+/g, '')}.png`;
  link.href = qrCanvas.value.toDataURL('image/png');
  link.click();
}

async function shareQR() {
  if (!qrCanvas.value) return;
  try {
    qrCanvas.value.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'store-perks-qr.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Store Perks QR Code',
          text: 'Scan this code to join my store loyalty program on NimPerks!'
        });
      } else {
        await navigator.share({
          title: 'My Store Perks QR Code',
          text: 'Scan this code to join my store loyalty program on NimPerks!',
          url: window.location.href
        });
      }
    }, 'image/png');
  } catch (err) {
    console.warn('Native share failed, copying address instead.', err);
    navigator.clipboard.writeText(auth.address).then(() => {
      alert('Address copied to clipboard!');
    });
  }
}

const txState = reactive({ isPending: false, error: null, countdown: 0, timerInterval: null });

async function closeCampaign(campId) {
  if (!confirm('Deactivate this campaign on-chain for 1 Luna?')) return;
  
  try {
    const cleanCampId = campId.replace('CAMP-', '').replace('RULE-', '');
    // Hash the ID slightly differently since we are providing it directly, but for now we just try to parse the hex or encode it
    // Actually, campId for FlashBuy is a hash hex already. For RULE it's the address.
    const dataToHash = new TextEncoder().encode(cleanCampId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
    const hashArray = new Uint8Array(hashBuffer);
    
    const extra = packClose(hashArray);
    await wallet.sendTransaction({ recipient: CAMPAIGN_ADDRESS || auth.address, value: 1, extraData: extra });
    
    alert('Transaction sent! The campaign will be closed once mined (~1 min).');
    
    // Optimistic local update
    const existing = await db.campaigns.get(campId);
    if (existing) {
      existing.status = 'closed';
      await db.campaigns.put(existing);
      await loadCampaigns();
    }
  } catch (err) {
    console.error(err);
    alert('Failed to close campaign.');
  }
}

function openCampaignExplainer(camp) {
  if (camp.type === 'FLASHBUY') {
    activeExplainer.value = {
      emoji: '⚡',
      title: 'Active FlashBuy Details',
      paragraphs: [
        `This is your active FlashBuy campaign: "${camp.label || camp.id}".`,
        `Customers join this group deal off-chain. Once the participant target of ${camp.target} participants is reached before the deal expires, they can generate off-chain voucher rewards.`,
        "You can close this campaign at any time on-chain by clicking the close button on the top right."
      ]
    };
  } else if (camp.type === 'VOLUME') {
    activeExplainer.value = {
      emoji: '💰',
      title: 'Active Volume-Based Perk Details',
      paragraphs: [
        `This is your active Volume Perk campaign: "${camp.label || camp.id}".`,
        `Customers earn this reward by spending a cumulative total of ${camp.target} NIM at your store address. The total is tracked on-chain from incoming transactions.`,
        `Reward unlocked: "${camp.label || 'reward'}". You can close this campaign at any time using the close button.`
      ]
    };
  } else {
    activeExplainer.value = {
      emoji: '🏆',
      title: 'Active Perks Details',
      paragraphs: [
        `This is your active Perks campaign: "${camp.label || camp.id}".`,
        `Customers collect stamps by making payments to your store. Once they reach ${camp.target} stamps, they unlock a voucher worth "${camp.label || 'reward'}".`,
        "You can close this campaign at any time by clicking the close button on the top right."
      ]
    };
  }
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatId(id) {
  if (!id) return '—';
  if (id.length <= 16) return id;
  return id.substring(0, 8) + '…' + id.slice(-8);
}

function handleSync() { loadCampaigns(); }

onMounted(() => {
  loadCampaigns();
  indexerService.addEventListener('sync:done', handleSync);
});
onUnmounted(() => {
  indexerService.removeEventListener('sync:done', handleSync);
});
</script>

<style scoped>
.view-root {
  background: var(--bg-primary);
  min-height: 100%;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 32px;
}
.empty-icon {
  margin-bottom: 20px;
  filter: drop-shadow(0 0 12px rgba(233,178,19,0.3));
}
.empty-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.empty-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 240px;
}

/* Summary bar */
.summary-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 20px;
  padding: 18px 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.summary-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}
.summary-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-secondary);
  font-weight: 600;
}
.summary-divider {
  width: 0.5px;
  height: 32px;
  background: var(--border-subtle);
}

/* Campaign cards */
.cards-list { display: flex; flex-direction: column; gap: 14px; }

.campaign-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 18px 18px 16px;
  border: 1px solid var(--border-medium);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.campaign-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.campaign-card:active { transform: scale(0.985); }

.campaign-card--gold { border-left: 3px solid var(--nim-gold); }
.campaign-card--purple { border-left: 3px solid var(--purple); }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.type-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border-radius: 100px;
}
.type-badge--gold { background: rgba(233,178,19,0.15); color: var(--nim-gold); }
.type-badge--purple { background: rgba(191,90,242,0.15); color: var(--purple); }

.close-campaign-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.close-campaign-btn:hover { color: var(--danger); background: rgba(255,69,58,0.1); }

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
  line-height: 1.2;
}
.card-id {
  font-size: 0.7rem;
  font-family: 'SF Mono', 'Menlo', monospace;
  color: var(--text-tertiary);
  margin-bottom: 14px;
  word-break: break-all;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.meta-chip {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 7px 12px;
  min-width: 64px;
}
.meta-chip-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}
.meta-chip-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

/* Progress */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.progress-track {
  flex: 1;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.6s ease;
}
.progress-fill--purple { background: linear-gradient(90deg, #BF5AF2, #9B4DCA); }
.progress-pct {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--purple);
  min-width: 32px;
  text-align: right;
}
.qr-action-btn:hover {
  background: var(--border-medium) !important;
}
.qr-zoom-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 998;
  animation: fadeIn 0.25s ease-out;
}
.qr-zoomable {
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, z-index 0.35s;
  will-change: transform;
  position: relative;
  z-index: 1;
}
.qr-zoomed {
  transform: scale(1.8) !important;
  z-index: 999 !important;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6) !important;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* FTUE Overlay styles */
.ftue-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.ftue-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: auto;
}
.ftue-highlight {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20%;
  height: 68px;
  border-radius: 10px 10px 0 0;
  border: 3.5px solid var(--nim-gold);
  animation: pulseHighlight 1s infinite alternate;
  pointer-events: auto;
  cursor: pointer;
  z-index: 10001;
  background: rgba(233, 178, 19, 0.1);
}
.ftue-arrow {
  position: absolute;
  top: -42px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.8rem;
  animation: bounceArrow 0.8s infinite alternate;
}
.ftue-dialogue {
  position: relative;
  z-index: 10002;
  width: 90%;
  max-width: 320px;
  background: var(--bg-card);
  border: 1.5px solid var(--border-medium);
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.ftue-step-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}
.ftue-step-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

@keyframes pulseHighlight {
  from { border-color: rgba(233, 178, 19, 0.5); box-shadow: 0 0 12px rgba(233, 178, 19, 0.3); }
  to { border-color: var(--nim-gold); box-shadow: 0 0 28px var(--nim-gold), inset 0 0 16px var(--nim-gold); }
}
@keyframes bounceArrow {
  from { transform: translateX(-50%) translateY(0); }
  to { transform: translateX(-50%) translateY(-10px); }
}
@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}

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
</style>
