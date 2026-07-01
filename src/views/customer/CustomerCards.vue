<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="My Perks">
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
        <!-- Box-shadow cutout: this single element IS the dark overlay.
             The huge spread box-shadow paints darkness around it while
             the element's own bounds stay transparent, creating a true cutout hole. -->
        <div 
          class="ftue-highlight" 
          @click="$router.push('/customer/profile')"
        >
          <!-- Bouncy pointer finger pointing at the Profile button -->
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

    <!-- Skeleton loading -->
    <div v-if="loading" class="px-4 py-4 space-y-4">
      <div class="skeleton h-52 rounded-2xl" />
      <div class="skeleton h-52 rounded-2xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="stampData.length === 0" class="empty-state">
      <div class="empty-hex">
        <svg width="52" height="46" viewBox="0 0 27 24" fill="none">
          <path d="M26.7 10.9L21.1 1.1C20.7.4 20 0 19.1 0H7.9C7 0 6.3.4 5.9 1.1L.3 10.9C-.1 11.6-.1 12.4.3 13.1L5.9 22.9C6.3 23.6 7 24 7.9 24H19.1C20 24 20.7 23.6 21.1 22.9L26.7 13.1C27.1 12.4 27.1 11.6 26.7 10.9Z" fill="rgba(233,178,19,0.15)"/>
        </svg>
      </div>
      <h3 class="empty-title">No perks yet</h3>
      <p class="empty-desc">Scan a merchant's QR code from the "Add Store" tab to start earning stamps.</p>
      <k-button class="nim-btn-primary mt-5" @click="$router.push('/customer/scan')">
        Add a Store
      </k-button>
    </div>

    <!-- Loyalty cards -->
    <div v-else class="px-4 py-4 space-y-4 pb-8">
      <div
        v-for="stamp in stampData"
        :key="stamp.merchant"
        class="perk-card"
        :class="{ 'perk-card--ready': stamp.isReady }"
      >
        <!-- Header row -->
        <div class="perk-header">
          <div>
            <h3 class="perk-name" style="display: flex; align-items: center; gap: 8px;">
              <span>{{ stamp.name }}</span>
              <button class="info-trigger-btn" style="padding: 0; font-size: 0.9rem;" @click="openPerkExplainer(stamp)">ℹ️</button>
            </h3>
            <div v-if="stamp.signature" class="verified-badge-sub" title="Verified Owner">
              ✓ {{ getShortAddress(stamp.merchant) }}
            </div>
            <p class="perk-rule">
              {{ stamp.ruleLabel }}
            </p>
          </div>
          <!-- Right side: Count & Min Spend Info -->
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;">
            <!-- Count badge -->
            <div class="count-badge" :class="stamp.isReady ? 'count-badge--ready' : ''">
              <span class="count-num">{{ Math.min(stamp.count, stamp.target) }}</span>
              <span class="count-sep">/</span>
              <span class="count-total">{{ stamp.target }}</span>
              <span class="count-unit" style="font-size: 0.6rem; color: var(--text-tertiary); margin-left: 2px;">{{ stamp.ruleType === 'VOLUME' ? 'NIM' : '' }}</span>
            </div>
            <!-- Min Spend pill (moved to right with white outline, right-aligned) -->
            <div v-if="stamp.ruleValue" class="min-spend-badge-outline" title="Minimum Spend required per transaction">
              Min: {{ stamp.ruleValue }} NIM
            </div>
          </div>
        </div>

        <!-- Progress bar for VOLUME based campaigns -->
        <div v-if="stamp.ruleType === 'VOLUME'" class="progress-bar-wrap mb-4 mt-2">
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">
            <span>Volume Spent</span>
            <span style="color: var(--nim-gold);">{{ Math.min(stamp.count, stamp.target) }} / {{ stamp.target }} NIM</span>
          </div>
          <div class="progress-track" style="height: 10px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden; border: 1px solid var(--border-medium);">
            <div 
              class="progress-fill" 
              style="height: 100%; background: linear-gradient(90deg, var(--nim-orange) 0%, var(--nim-gold) 100%); transition: width 0.4s ease;"
              :style="{ width: Math.min((stamp.count / stamp.target) * 100, 100) + '%' }"
            />
          </div>
        </div>

        <!-- Hexagon progress grid -->
        <ProgressHexagon
          v-else
          :current="Math.min(stamp.count, stamp.target)"
          :max="stamp.target"
          :animateLast="!stamp.isReady"
        />

        <!-- Footer: not-ready -->
        <div v-if="!stamp.isReady" class="not-ready-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
          <p class="perk-remaining" style="margin: 0; text-align: left;">
            <span v-if="stamp.ruleType === 'VOLUME'">
              {{ (stamp.target - Math.min(stamp.count, stamp.target)).toFixed(1).replace('.0','') }} NIM left to spend
            </span>
            <span v-else>
              {{ stamp.target - Math.min(stamp.count, stamp.target) }}
              {{ stamp.target - stamp.count === 1 ? 'stamp' : 'stamps' }} to unlock
            </span>
          </p>
          <k-button
            class="nim-btn-primary"
            style="width: auto; min-width: 90px; padding: 4px 14px; font-size: 0.8rem; height: 30px; line-height: 1;"
            @click="initiatePayment(stamp)"
          >
            Pay
          </k-button>
        </div>

        <!-- Footer: ready — voucher area -->
        <div v-else class="voucher-area">
          <div class="voucher-divider" />
          <div v-if="!stamp.qrUrl" class="text-center pt-4">
            <p class="voucher-ready-tag">🎉 Reward Unlocked!</p>
            <k-button
              class="nim-btn-primary w-full mt-3 submit-btn"
              @click="revealVoucher(stamp)"
              :disabled="stamp.generating"
            >
              <span v-if="stamp.generating" class="spinner" />
              <span v-else>Show Voucher QR</span>
            </k-button>
          </div>
          <div v-else class="qr-display" style="overflow: visible !important;">
            <div style="display: flex; justify-content: center; position: relative;">
              <!-- Backdrop overlay -->
              <div v-if="stamp.isQRZoomed" class="qr-zoom-backdrop" @click="stamp.isQRZoomed = false" />
              <div 
                class="qr-frame qr-zoomable"
                :class="{ 'qr-zoomed': stamp.isQRZoomed }"
                @click="stamp.isQRZoomed = !stamp.isQRZoomed"
              >
                <img :src="stamp.qrUrl" class="qr-img" alt="Voucher QR Code" />
              </div>
            </div>
            <p class="qr-instruction">Hold up to cashier's scanner</p>
            <p class="qr-expires">Tap your merchant's scanner to burn on-chain</p>
          </div>
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

    <!-- Payment Amount Modal -->
    <Transition name="ftue-fade">
      <div v-if="activePaymentStamp" class="payment-overlay" @click="activePaymentStamp = null">
        <div class="payment-card card-premium anim-scale-in" @click.stop>
          <div class="payment-icon">💸</div>
          <h3 class="payment-title">Enter Amount</h3>
          <p class="payment-desc">How much NIM would you like to pay to {{ activePaymentStamp.name }}?</p>
          
          <div class="payment-input-wrap">
            <input 
              type="number" 
              v-model="paymentAmount" 
              class="payment-input"
              placeholder="0.00"
              step="any"
              min="0.00001"
            />
            <span class="payment-currency">NIM</span>
          </div>

          <div class="payment-buttons">
            <k-button 
              class="nim-btn-secondary submit-btn" 
              style="flex: 1;" 
              @click="activePaymentStamp = null"
            >
              Cancel
            </k-button>
            <k-button 
              class="nim-btn-primary submit-btn" 
              style="flex: 1;" 
              @click="confirmPayment"
            >
              Pay
            </k-button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Navbar as kNavbar, Link as kLink, Button as kButton } from 'konsta/vue';
import { db } from '@/db/schema';
import QRCode from 'qrcode';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { generateVoucherPayload } from '@/protocol/voucher';
import ProgressHexagon from '@/components/ProgressHexagon.vue';
import { useRouter } from 'vue-router';
import ExplainerModal from '@/components/ExplainerModal.vue';
import { indexerService } from '@/indexer/IndexerService';
import { wallet } from '@/protocol/walletAdapter';

const auth = useAuthStore();
const ui = useUIStore();
const $router = useRouter();
const loading = ref(true);
const stampData = ref([]);
const showOnboardingFTUE = ref(false);
const ftueStep = ref(0);
const activeExplainer = ref(null);
const activePaymentStamp = ref(null);
const paymentAmount = ref('');
const ftueSteps = [
  {
    title: "Claim Your Username!",
    desc: "Welcome to NimPerks! To let merchants and peers recognize you, you need to claim your off-chain username."
  },
  {
    title: "Collect Perks!",
    desc: "Scan merchant QR codes to add stores and earn stamps automatically."
  },
  {
    title: "Onboarding Profile Tab",
    desc: "We've highlighted the Profile button in the bottom navigation. Tap it to claim your on-chain username for free!"
  }
];

function advanceFTUE() {
  if (ftueStep.value < ftueSteps.value.length - 1) {
    ftueStep.value++;
  } else {
    $router.push('/customer/profile');
  }
}

async function checkOnboarding() {
  if (!auth.address) return;
  const profile = await db.merchants.get(auth.address);
  showOnboardingFTUE.value = !profile || !profile.signature || profile.name.startsWith('Customer ');
}

async function initiatePayment(stamp) {
  const minNim = Number(stamp.ruleValue);
  const defaultAmount = !isNaN(minNim) && minNim > 0 ? minNim : 1;
  paymentAmount.value = defaultAmount.toString();
  activePaymentStamp.value = stamp;
}

async function confirmPayment() {
  if (!activePaymentStamp.value) return;
  const amountInNim = Number(paymentAmount.value);
  
  if (isNaN(amountInNim) || amountInNim <= 0) {
    ui.showToast('Please enter a valid amount greater than 0');
    return;
  }

  try {
    const stamp = activePaymentStamp.value;
    activePaymentStamp.value = null; // Close popup
    
    // Nimiq Hub checkout expects Luna (1 NIM = 100,000 Luna)
    const amountInLuna = amountInNim * 1e5;
    
    await wallet.sendTransaction({ 
      recipient: stamp.merchant,
      value: amountInLuna
    });
  } catch (err) {
    console.warn('Payment failed/cancelled', err);
  }
}

function openPerkExplainer(stamp) {
  if (stamp.ruleType === 'VOLUME') {
    activeExplainer.value = {
      emoji: '💰',
      title: `${stamp.name} Volume Perk`,
      paragraphs: [
        `This is a Volume-Based Perk at "${stamp.name}".`,
        `Your reward unlocks once you have spent a cumulative total of ${stamp.target} NIM at this store. Your current total is ${stamp.count} NIM.`,
        `Reward: "${stamp.ruleLabel}". Once unlocked, click "Show Voucher QR" to redeem it with the merchant.`
      ]
    };
  } else {
    activeExplainer.value = {
      emoji: '🏆',
      title: `${stamp.name} Perk Details`,
      paragraphs: [
        `You are participating in the Perks loyalty program at "${stamp.name}".`,
        `Every time you make a payment to this merchant's address, you earn one stamp automatically.`,
        `Once you reach your target of ${stamp.target} stamps, a voucher will unlock! Click "Show Voucher QR" and let the merchant scan it to claim your reward: "${stamp.ruleLabel}".`
      ]
    };
  }
}

function getShortAddress(address) {
  if (!address) return '';
  const clean = address.replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return `${clean.substring(0, 4)}...${clean.substring(clean.length - 4)}`;
}

onMounted(async () => {
  if (!auth.address) return (loading.value = false);
  try {
    const stamps = await db.stamps.where('user').equals(auth.address).toArray();
    
    // Deduplicate stamps in case of older corrupt records, keeping highest count
    const uniqueStampsMap = new Map();
    for (const stamp of stamps) {
      const normMerchant = stamp.merchant?.replace(/\s+/g, '').toUpperCase() ?? stamp.merchant;
      const existing = uniqueStampsMap.get(normMerchant);
      if (!existing || (stamp.count || 0) > (existing.count || 0)) {
        uniqueStampsMap.set(normMerchant, { ...stamp, merchant: normMerchant });
      }
    }
    
    const data = [];
    for (const stamp of uniqueStampsMap.values()) {
      const normMerchant = stamp.merchant;
      const merchant = await db.merchants.get(normMerchant)
                    ?? await db.merchants.get(stamp.merchant);
      const rule = await db.rules.where('merchant').equals(normMerchant).first()
                ?? await db.rules.where('merchant').equals(stamp.merchant).first();
      // target priority: explicit campaign rule → merchant minStamps → 10 fallback
      const target = rule
        ? parseInt(rule.target, 10)
        : (merchant?.minStamps !== undefined
            ? merchant.minStamps
            : 10);
      const count = stamp.count || 0;
      data.push({
        ...stamp,
        merchant: normMerchant, // always use normalised form going forward
        name: merchant?.name ?? `Store ${normMerchant.substring(2, 8)}`,
        signature: merchant?.signature ?? '',
        ruleLabel: rule?.label ?? 'Loyalty program',
        ruleType:  rule?.type  ?? 'COUNT',
        ruleValue: rule?.value ?? '',
        target,
        isReady: count >= target,
        qrUrl:   null,
        generating: false,
        isQRZoomed: false
      });
    }
    stampData.value = data;
    await checkOnboarding();
  } catch (e) { console.error(e); }
  loading.value = false;
});

async function revealVoucher(stamp) {
  stamp.generating = true;
  try {
    const payload = generateVoucherPayload(auth.address, stamp.merchant, stamp.ruleType, stamp.ruleValue);
    const mockSig = btoa(auth.address + stamp.merchant + Date.now()).replace(/=/g,'');
    const qrData = `NIMPERKS|${mockSig}|${payload}`;
    stamp.qrUrl = await QRCode.toDataURL(qrData, {
      width: 260, margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
  } catch (e) {
    console.error(e);
    alert('Could not generate QR code.');
  } finally {
    stamp.generating = false;
  }
}

const syncing = ref(false);

async function refreshData() {
  if (syncing.value) return;
  syncing.value = true;
  try {
    await indexerService.syncAllMerchants();
    const stamps = await db.stamps.where('user').equals(auth.address).toArray();
    
    // Deduplicate stamps in case of older corrupt records, keeping highest count
    const uniqueStampsMap = new Map();
    for (const stamp of stamps) {
      const normMerchant = stamp.merchant?.replace(/\s+/g, '').toUpperCase() ?? stamp.merchant;
      const existing = uniqueStampsMap.get(normMerchant);
      if (!existing || (stamp.count || 0) > (existing.count || 0)) {
        uniqueStampsMap.set(normMerchant, { ...stamp, merchant: normMerchant });
      }
    }
    
    const data = [];
    for (const stamp of uniqueStampsMap.values()) {
      const normMerchant = stamp.merchant;
      const merchant = await db.merchants.get(normMerchant)
                    ?? await db.merchants.get(stamp.merchant);
      const rule = await db.rules.where('merchant').equals(normMerchant).first()
                ?? await db.rules.where('merchant').equals(stamp.merchant).first();
      const target = rule
        ? parseInt(rule.target, 10)
        : (merchant?.minStamps !== undefined
            ? merchant.minStamps
            : 10);
      const count = stamp.count || 0;
      data.push({
        ...stamp,
        merchant: normMerchant,
        name: merchant?.name ?? `Store ${normMerchant.substring(2, 8)}`,
        signature: merchant?.signature ?? '',
        ruleLabel: rule?.label ?? 'Loyalty program',
        ruleType:  rule?.type  ?? 'COUNT',
        ruleValue: rule?.value ?? '',
        target,
        isReady: count >= target,
        qrUrl:   null,
        generating: false,
        isQRZoomed: false
      });
    }
    stampData.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    syncing.value = false;
  }
}
</script>

<style scoped>
.view-root { background: var(--bg-primary); min-height: 100%; }

.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
.empty-hex { margin-bottom: 20px; }
.empty-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
.empty-desc  { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; max-width: 230px; }

/* Perk card */
.perk-card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 22px;
  padding: 20px 20px 16px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.perk-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.perk-card--ready {
  border-color: rgba(233,178,19,0.5);
  background: linear-gradient(145deg, rgba(233,178,19,0.08) 0%, var(--bg-card) 100%);
  box-shadow: 0 8px 32px rgba(233,178,19,0.15);
}

.perk-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }

.perk-name { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; line-height: 1.2; }
.perk-rule { font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.rule-pill {
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 2px 8px;
  background: rgba(48,209,88,0.15); color: var(--success);
  border-radius: 100px;
}

.count-badge {
  display: flex; align-items: baseline; gap: 2px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 12px; padding: 6px 10px;
  flex-shrink: 0;
}
.count-badge--ready {
  background: rgba(233,178,19,0.15);
  border-color: rgba(233,178,19,0.3);
}
.count-num   { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }
.count-sep   { font-size: 0.8rem; color: var(--text-tertiary); margin: 0 1px; }
.count-total { font-size: 0.8rem; color: var(--text-secondary); }
.count-badge--ready .count-num { color: var(--nim-gold); }

.min-spend-badge-outline {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--success);
  border: 1px solid var(--border-medium);
  padding: 1px 7px;
  border-radius: 100px;
  background: rgba(48, 209, 88, 0.05);
}

.perk-remaining {
  font-size: 0.78rem;
  color: var(--text-secondary);
  letter-spacing: 0.01em;
}

/* Voucher area */
.voucher-area { margin-top: 12px; }
.voucher-divider {
  height: 0.5px; background: var(--border-medium);
  margin-bottom: 4px;
  /* dashed via repeating-linear */
  background: repeating-linear-gradient(90deg, var(--border-medium) 0, var(--border-medium) 6px, transparent 6px, transparent 12px);
}
.voucher-ready-tag {
  font-size: 0.85rem; font-weight: 600; color: var(--nim-gold); letter-spacing: 0.02em;
}
.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(0,0,0,0.2); border-top-color: #000;
  border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.qr-display { display: flex; flex-direction: column; align-items: center; padding-top: 16px; }
.qr-frame {
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}
.qr-img { width: 200px; height: 200px; display: block; }
.qr-instruction {
  font-size: 0.85rem; font-weight: 700; color: var(--text-primary);
  margin-top: 14px; text-align: center;
}
.qr-expires {
  font-size: 0.72rem; color: var(--text-secondary); margin-top: 4px; text-align: center;
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
  transform: scale(1.6) !important;
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
  /* No background here — the highlight element itself casts the dark overlay */
  pointer-events: none;
}
.ftue-highlight {
  /* Positioned cutout hole over the Profile tab (bottom-right, 20% width, 68px high) */
  position: fixed;
  bottom: 0;
  right: 0;
  width: 20%;
  height: 68px;
  border-radius: 10px 10px 0 0;
  box-sizing: border-box;
  /* The huge spread box-shadow IS the dark overlay for the rest of the screen.
     rgba(0,0,0,0.85) at 9999px spread fills everything outside this element. */
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
  /* Gold animated border on the cutout itself */
  border: 3.5px solid var(--nim-gold);
  animation: pulseHighlight 1s infinite alternate;
  pointer-events: auto;
  cursor: pointer;
  z-index: 10001;
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

/* Payment Modal Styles */
.payment-overlay {
  position: fixed;
  inset: 0;
  z-index: 10005;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.payment-card {
  width: 90%;
  max-width: 328px;
  background: var(--bg-card);
  border: 1.5px solid var(--border-medium);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  text-align: center;
}
.payment-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  line-height: 1;
}
.payment-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}
.payment-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 20px;
}
.payment-input-wrap {
  position: relative;
  margin-bottom: 24px;
}
.payment-input {
  width: 100%;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 16px;
  padding: 14px 50px 14px 14px;
  border: 1.5px solid var(--border-medium);
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}
.payment-input:focus {
  outline: none;
  border-color: var(--nim-gold);
  box-shadow: 0 0 0 4px rgba(233, 178, 19, 0.15);
}
.payment-currency {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--nim-gold);
  font-weight: 800;
  font-size: 0.95rem;
  pointer-events: none;
}
.payment-buttons {
  display: flex;
  gap: 12px;
}
.nim-btn-secondary {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  border: 1.5px solid var(--border-medium) !important;
  border-radius: 100px !important;
  font-weight: 700 !important;
  box-shadow: none !important;
}

.ftue-fade-enter-active,
.ftue-fade-leave-active {
  transition: opacity 0.22s ease;
}
.ftue-fade-enter-from,
.ftue-fade-leave-to {
  opacity: 0;
}
</style>
