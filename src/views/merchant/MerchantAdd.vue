<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="Create Campaign" />

    <!-- Tab toggle -->
    <div class="tab-seg-wrap px-4 pt-3 pb-1">
      <k-segmented strong rounded>
        <k-segmented-button :active="tab === 'loyalty'" @click="tab = 'loyalty'">
          🏆 Perks
        </k-segmented-button>
        <k-segmented-button :active="tab === 'flashbuy'" @click="tab = 'flashbuy'">
          ⚡ FlashBuy
        </k-segmented-button>
      </k-segmented>
    </div>

    <!-- ── LOYALTY TAB ── -->
    <div v-if="tab === 'loyalty'" class="form-section">
      <div class="section-heading" style="display: flex; align-items: center; justify-content: space-between;">
        <span>Reward Type</span>
        <button class="info-trigger-btn" @click="showPerkExplainer = true">ℹ️</button>
      </div>
      <div class="px-4">
        <div class="reward-types-grid">
          <div
            v-for="rt in rewardTypes"
            :key="rt.value"
            class="reward-card"
            :class="{ 'reward-card--active': ruleType === rt.value }"
            @click="ruleType = rt.value"
          >
            <div class="rc-header">
              <span class="rc-title">{{ rt.label }}</span>
              <div class="radio-dot" :class="{ 'radio-dot--active': ruleType === rt.value }" />
            </div>
            <div class="rc-desc">{{ rt.desc }}</div>
          </div>
        </div>
      </div>

      <div class="section-heading mt-6">Campaign Details</div>
      <div class="px-4 space-y-4">
        <div class="custom-input-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label class="custom-label">Target {{ ruleType === 'VOLUME' ? 'Spend (NIM)' : 'Stamps' }}</label>
            <span style="font-size: 0.95rem; font-weight: 800; color: var(--nim-gold);">{{ ruleTarget }} {{ ruleType === 'VOLUME' ? 'NIM' : 'stamps' }}</span>
          </div>
          <div v-if="ruleType !== 'VOLUME'" style="display: flex; gap: 16px; align-items: center;">
            <input 
              v-model.number="ruleTarget" 
              type="range" 
              min="1" 
              max="100" 
              step="1"
              style="flex: 1; accent-color: var(--nim-gold); cursor: pointer;"
            />
            <input 
              v-model.number="ruleTarget" 
              type="number" 
              min="1" 
              max="100" 
              class="custom-input" 
              style="width: 80px; text-align: center; padding: 10px; font-weight: 700;"
            />
          </div>
          <input 
            v-else
            v-model.number="ruleTarget"
            type="number"
            placeholder="e.g. 500"
            class="custom-input"
          />
          <span class="custom-info">{{ ruleType === 'VOLUME' ? 'Amount in NIM spent' : 'Number of transactions/stamps' }}</span>
        </div>
        
        <div class="custom-input-group">
          <label class="custom-label">Reward Label</label>
          <input class="custom-input" type="text" placeholder="e.g. 1 Free Coffee" v-model="ruleLabel" />
          <span class="custom-info">What does the customer earn?</span>
        </div>

        <div class="custom-input-group">
          <label class="custom-label">Min. Spend per tx (NIM)</label>
          <input class="custom-input" type="number" placeholder="e.g. 5  (optional)" v-model.number="ruleMinSpend" />
          <span class="custom-info">Anti-spam: ignore tiny transactions</span>
        </div>
      </div>

      <div class="px-4 mt-8 pb-8">
        <k-button
          id="btn-publish-loyalty"
          class="nim-btn-primary w-full submit-btn"
          :disabled="publishing"
          @click="publishLoyalty"
        >
          <span v-if="publishing" class="spinner" />
          <span v-else>Publish Perk · Free</span>
        </k-button>
      </div>
    </div>

    <!-- ── FLASHBUY TAB ── -->
    <div v-else class="form-section">
      <div class="section-heading" style="display: flex; align-items: center; justify-content: space-between;">
        <span>Group Deal Details</span>
        <button class="info-trigger-btn" @click="showFlashBuyExplainer = true">ℹ️</button>
      </div>
      <div class="px-4 space-y-4">
        <div class="custom-input-group">
          <label class="custom-label">Campaign ID</label>
          <input class="custom-input" type="text" placeholder="e.g. SUMMER2026" v-model="groupCampId" />
          <span class="custom-info">Short, memorable ID (max ~12 chars)</span>
        </div>

        <div class="custom-input-group">
          <label class="custom-label">Target Participants</label>
          <input class="custom-input" type="number" placeholder="e.g. 50" v-model.number="groupTarget" />
          <span class="custom-info">How many people need to join to unlock the deal?</span>
        </div>

        <div class="custom-input-group">
          <label class="custom-label">Reward Label</label>
          <input class="custom-input" type="text" placeholder="e.g. 30% off entire menu" v-model="groupLabel" />
        </div>

        <div class="custom-input-group">
          <label class="custom-label">Expiry</label>
          <input class="custom-input" type="datetime-local" v-model="groupExpiry" />
          <span class="custom-info">When does the deal expire?</span>
        </div>
      </div>

      <div class="px-4 mt-8 pb-8">
        <k-button
          id="btn-launch-flashbuy"
          class="nim-btn-primary w-full submit-btn"
          :disabled="publishing"
          @click="launchFlashBuy"
        >
          <span v-if="publishing" class="spinner" />
          <span v-else>Launch FlashBuy · Free</span>
        </k-button>
      </div>
    </div>

    <!-- Toast notification -->
    <Transition name="toast-slide">
      <div v-if="toast.show" class="toast" :class="'toast--' + toast.type">
        {{ toast.msg }}
      </div>
    </Transition>

    <!-- Explainer Modals -->
    <ExplainerModal 
      :show="showPerkExplainer" 
      emoji="🏆" 
      title="About Perks Campaigns" 
      :paragraphs="perkExplainerParagraphs" 
      @close="showPerkExplainer = false"
    />
    <ExplainerModal 
      :show="showFlashBuyExplainer" 
      emoji="⚡" 
      title="About FlashBuy Campaigns" 
      :paragraphs="flashBuyExplainerParagraphs" 
      @close="showFlashBuyExplainer = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import {
  Navbar as kNavbar,
  Button as kButton,
  Segmented as kSegmented,
  SegmentedButton as kSegmentedButton,
} from 'konsta/vue';
import { wallet } from '@/protocol/walletAdapter';
import { useAuthStore } from '@/stores/auth';
import { generateRulePayload } from '@/protocol/parser';
import { indexerService } from '@/indexer/IndexerService';
import { db } from '@/db/schema';
import { bytesToHex } from '@/protocol/signature';
import ExplainerModal from '@/components/ExplainerModal.vue';

const auth = useAuthStore();
const tab = ref('loyalty');
const publishing = ref(false);
const CAMPAIGN_ADDRESS = import.meta.env.VITE_NIMIQ_CAMPAIGN_ADDRESS || '';

// Loyalty form
const ruleType = ref('COUNT');
const ruleTarget = ref(10);
const ruleLabel = ref('');
const ruleMinSpend = ref('');
const ruleUnit = ref('STAMPS');

const showPerkExplainer = ref(false);
const showFlashBuyExplainer = ref(false);

const perkExplainerParagraphs = [
  "Perks is a stamp-based loyalty program that rewards repeat customers.",
  "When a customer makes a purchase, they scan your Store Perks QR to earn stamps automatically. Once they collect the required number of stamps, a voucher is unlocked that they can redeem on their next visit.",
  "Creating a Perk campaign is completely free, gasless, and stored off-chain."
];

const flashBuyExplainerParagraphs = [
  "FlashBuy is a social group deal campaign that leverages crowd dynamics to drive sales.",
  "You set a target participant count (e.g. 50 people) and a reward discount. Customers join the deal by staking or joining the campaign before it expires.",
  "If the participant target is reached before the deal expires, the reward unlocks for everyone! If not, the campaign terminates."
];

const rewardTypes = [
  { value: 'COUNT',    label: 'Free Item — Quantity', desc: 'e.g. Buy 10 coffees, get 1 free' },
  { value: 'DISCOUNT', label: 'Item Discount',         desc: 'e.g. Every 5 purchases, 20% off' },
  { value: 'VOLUME',   label: 'Volume-Based',           desc: 'e.g. Spend 500 NIM, get 10% off' },
];

// FlashBuy form
const groupCampId = ref('');
const groupTarget = ref('');
const groupLabel  = ref('');
const groupExpiry = ref('');

// Toast
const toast = reactive({ show: false, msg: '', type: 'success' });
function showToast(msg, type = 'success') {
  toast.msg = msg;
  toast.type = type;
  toast.show = true;
  setTimeout(() => { toast.show = false; }, 3000);
}

async function publishLoyalty() {
  if (!ruleTarget.value) return showToast('Enter a target value.', 'error');
  if (!ruleLabel.value)  return showToast('Enter a reward label.', 'error');
  publishing.value = true;
  try {
    const timestamp = Date.now();
    const cleanAddr = auth.address.replace(/\s+/g, '').toUpperCase();
    // Message payload format: CAMPAIGN|{merchant}|{type}|{target}|{reward}|{timestamp}
    const payload = `CAMPAIGN|${cleanAddr}|${ruleType.value}|${ruleTarget.value}|${ruleLabel.value}|${timestamp}`;
    
    // Sign off-chain
    const result = await wallet.signMessage(payload);
    
    if (result && result.signature) {
      const sigHex = bytesToHex(result.signature);
      const pubHex = bytesToHex(result.signerPubKey);
      
      // Save locally to IndexedDB rules & campaigns
      await db.rules.put({
        merchant: auth.address,
        type: ruleType.value,
        target: parseInt(ruleTarget.value, 10),
        reward: ruleLabel.value,
        label: ruleLabel.value,
        value: ruleMinSpend.value ? String(ruleMinSpend.value) : '',
        signature: sigHex,
        pubKey: pubHex,
        timestamp: timestamp
      });

      // Populate local campaign list
      const campaignId = `CAMP-${auth.address.replace(/\s+/g, '').substring(2, 6)}-${timestamp.toString().substring(8)}`;
      await db.campaigns.put({
        id: campaignId,
        merchant: auth.address,
        type: ruleType.value,
        target: parseInt(ruleTarget.value, 10),
        value: ruleMinSpend.value ? String(ruleMinSpend.value) : '',
        label: ruleLabel.value,
        status: 'active',
        timestamp: timestamp,
        signature: sigHex,
        pubKey: pubHex
      });

      showToast('Campaign published (off-chain signature generated)!');
      ruleTarget.value = ''; ruleLabel.value = ''; ruleMinSpend.value = '';
    } else {
      throw new Error('Signing cancelled or failed.');
    }
  } catch (e) {
    console.error(e);
    showToast(e.message || 'Signature failed.', 'error');
  } finally {
    publishing.value = false;
  }
}

async function launchFlashBuy() {
  if (!groupCampId.value)  return showToast('Enter a campaign ID.', 'error');
  if (!groupTarget.value)  return showToast('Enter a target number.', 'error');
  if (!groupExpiry.value)  return showToast('Set an expiry date.', 'error');
  publishing.value = true;
  try {
    const timestamp = Date.now();
    const tsExpiry = new Date(groupExpiry.value).getTime();
    const cleanAddr = auth.address.replace(/\s+/g, '').toUpperCase();
    // Message payload format: FLASHBUY|{merchant}|{campaignId}|{targetCount}|{expiry}|{label}|{timestamp}
    const payload = `FLASHBUY|${cleanAddr}|${groupCampId.value}|${groupTarget.value}|${tsExpiry}|${groupLabel.value}|${timestamp}`;
    
    // Sign off-chain
    const result = await wallet.signMessage(payload);
    
    if (result && result.signature) {
      const sigHex = bytesToHex(result.signature);
      const pubHex = bytesToHex(result.signerPubKey);
      
      // Save locally to IndexedDB campaigns
      await db.campaigns.put({
        id: groupCampId.value,
        merchant: auth.address,
        type: 'FLASHBUY',
        target: parseInt(groupTarget.value, 10),
        expiry: tsExpiry,
        status: 'active',
        current_count: 0,
        label: groupLabel.value || 'FlashBuy Deal',
        timestamp: timestamp,
        signature: sigHex,
        pubKey: pubHex
      });

      showToast('FlashBuy launched (off-chain signature generated)!');
      groupCampId.value = ''; groupTarget.value = ''; groupExpiry.value = ''; groupLabel.value = '';
    } else {
      throw new Error('Signing cancelled or failed.');
    }
  } catch (e) {
    console.error(e);
    showToast(e.message || 'Signature failed.', 'error');
  } finally {
    publishing.value = false;
  }
}
</script>

<style scoped>
.view-root { background: var(--bg-primary); min-height: 100%; padding-bottom: 20px; }
.tab-seg-wrap { margin-bottom: 12px; }

.section-heading {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 16px 16px 12px;
  letter-spacing: -0.01em;
}

/* Reward Cards */
.reward-types-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reward-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light, #333);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.reward-card:active {
  transform: scale(0.98);
}
.reward-card--active {
  border-color: var(--nim-gold);
  background: rgba(233, 178, 19, 0.05);
}

.rc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.rc-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--text-primary);
}
.rc-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Custom Inputs */
.custom-input-group {
  display: flex;
  flex-direction: column;
}
.custom-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  margin-left: 4px;
}
.custom-input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-medium, #444);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 1rem;
  color: var(--text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
  -webkit-appearance: none;
}
.custom-input:focus {
  border-color: var(--nim-gold);
  box-shadow: 0 0 0 3px rgba(233, 178, 19, 0.15);
}
.custom-input::placeholder {
  color: var(--text-tertiary);
}
/* Specifically for dark mode datetime inputs */
.custom-input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}
.custom-info {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 6px;
  margin-left: 4px;
}

/* Radio Dot */
.radio-dot {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border-medium, #555);
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.radio-dot--active {
  border: 6px solid var(--nim-gold);
  background: transparent;
}

/* Utilities */
.space-y-4 > * + * {
  margin-top: 16px;
}
.mt-6 { margin-top: 24px; }
.mt-8 { margin-top: 32px; }
.pb-8 { padding-bottom: 32px; }
.px-4 { padding-left: 16px; padding-right: 16px; }

.submit-btn {
  height: 56px;
  font-size: 1.05rem;
  font-weight: 700;
  border-radius: 100px;
}

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.cost-note {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 12px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 9999;
  white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.toast--success { background: var(--success); color: #000; }
.toast--error   { background: var(--danger);  color: #fff; }

.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s ease; }
.toast-slide-enter-from { opacity: 0; transform: translateX(-50%) translateY(12px); }
.toast-slide-leave-to   { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* Info Trigger Button */
.info-trigger-btn {
  background: none;
  border: none;
  font-size: 1.05rem;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  display: flex; align-items: center; justify-content: center;
  transition: color 0.15s ease;
}
.info-trigger-btn:hover {
  color: var(--nim-gold);
}
</style>
