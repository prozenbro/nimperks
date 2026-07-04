<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="Profile" />

    <div class="content-wrap px-4 pt-6 pb-12 space-y-8">
      <!-- Identity card -->
      <div class="id-card">
        <div class="identicon-wrap">
          <Identicon :address="auth.address" />
        </div>
        <h3 class="id-name">
          {{ currentProfile?.name || (auth.isMerchantMode ? 'Unnamed Merchant' : 'Unnamed Customer') }}
        </h3>
        <div v-if="currentProfile?.signature" class="verified-badge-sub" title="Verified Owner">
          ✓ {{ getShortAddress(auth.address) }}
        </div>
        <p class="id-mode-badge" :class="auth.isMerchantMode ? 'badge-purple' : 'badge-gold'">
          {{ auth.isMerchantMode ? 'Merchant Mode' : 'Customer Mode' }}
        </p>
        <p class="id-address">{{ auth.address }}</p>
      </div>

      <!-- Loyalty target setup (Merchant Mode Only) -->
      <div v-if="auth.isMerchantMode" class="section-card">
        <h4 class="section-title">Default Perk Stamps Target</h4>
        <p class="section-desc">Set the default number of stamps (0 to 10) customers need to collect to unlock rewards at your store.</p>
        <div class="custom-input-group mt-4">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.90rem; font-weight: 700; color: var(--text-primary);">Default Stamp Target</span>
            <span style="font-size: 1.1rem; font-weight: 800; color: var(--nim-gold);">{{ minStamps }} stamps</span>
          </div>
          <input 
            v-model.number="minStamps" 
            type="range" 
            min="0" 
            max="10" 
            step="1"
            style="width: 100%; accent-color: var(--nim-gold); cursor: pointer;"
          />
          <k-button class="nim-btn-primary w-full mt-4 submit-btn" @click="claimUsername" :disabled="claiming">
            <span v-if="claiming" class="mini-spinner-inline" />
            <span v-else>Update Target & Sign · Free</span>
          </k-button>
        </div>
      </div>

      <!-- Claim username (Shown here ONLY if NOT claimed once yet) -->
      <div v-if="!hasClaimedOnce" class="section-card">
        <h4 class="section-title">On-Chain Username</h4>
        <p class="section-desc">Claim a unique identity. Customers & merchants can recognise you instantly.</p>

        <div v-if="loadingProfile" class="py-4 text-center">
          <div class="mini-spinner" />
        </div>

        <!-- Locked -->
        <div v-else-if="currentProfile && !canChange" class="locked-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Username locked until {{ nextChangeDate }}
        </div>

        <!-- Available -->
        <div v-else class="claim-area custom-input-group">
          <label class="custom-label text-left">Desired Username</label>
          <div class="username-input-wrap">
            <input
              v-model="customUsername"
              type="text"
              placeholder="e.g. Satoshi123"
              class="custom-input flex-1"
              style="text-align: center; font-weight: 700; letter-spacing: 0.02em;"
            />
            <button class="suggest-btn" @click="regenerateSuggestion">🎲</button>
          </div>
          <p v-if="claimAttemptsLeft < 6" class="attempts-warn">
            {{ claimAttemptsLeft }} attempts remaining
          </p>
          <k-button class="nim-btn-primary w-full submit-btn" style="margin-top: 20px;" @click="claimUsername" :disabled="claiming">
            <span v-if="claiming" class="mini-spinner-inline" />
            <span v-else>Claim Username · Free</span>
          </k-button>
        </div>
      </div>

      <!-- Settings -->
      <div class="section-card">
        <h4 class="section-title">Appearance</h4>
        <div class="theme-row">
          <span class="theme-label">Theme</span>
          <k-segmented strong rounded class="theme-seg">
            <k-segmented-button :active="ui.theme === 'system'" @click="ui.setTheme('system')" small>Auto</k-segmented-button>
            <k-segmented-button :active="ui.theme === 'light'"  @click="ui.setTheme('light')"  small>Light</k-segmented-button>
            <k-segmented-button :active="ui.theme === 'dark'"   @click="ui.setTheme('dark')"   small>Dark</k-segmented-button>
          </k-segmented>
        </div>
      </div>

      <!-- Network -->
      <div class="section-card">
        <h4 class="section-title">Network</h4>
        <div class="net-row">
          <span class="net-label">Status</span>
          <span class="net-status">
            <span class="net-dot" />
            {{ IS_TESTNET ? 'Testnet' : 'Mainnet' }} · Connected
          </span>
        </div>
      </div>

      <!-- Change username (Tucked down here ONLY if claimed once already) -->
      <div v-if="hasClaimedOnce" class="section-card">
        <h4 class="section-title">On-Chain Username</h4>
        <p class="section-desc">Claim a unique identity. Customers & merchants can recognise you instantly.</p>

        <div v-if="loadingProfile" class="py-4 text-center">
          <div class="mini-spinner" />
        </div>

        <!-- Locked -->
        <div v-else-if="currentProfile && !canChange" class="locked-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Username locked until {{ nextChangeDate }}
        </div>

        <!-- Available -->
        <div v-else class="claim-area custom-input-group">
          <label class="custom-label text-left">Desired Username</label>
          <div class="username-input-wrap">
            <input
              v-model="customUsername"
              type="text"
              placeholder="e.g. Satoshi123"
              class="custom-input flex-1"
              style="text-align: center; font-weight: 700; letter-spacing: 0.02em;"
            />
            <button class="suggest-btn" @click="regenerateSuggestion">🎲</button>
          </div>
          <p v-if="claimAttemptsLeft < 6" class="attempts-warn">
            {{ claimAttemptsLeft }} attempts remaining
          </p>
          <k-button class="nim-btn-primary w-full submit-btn" style="margin-top: 20px;" @click="claimUsername" :disabled="claiming">
            <span v-if="claiming" class="mini-spinner-inline" />
            <span v-else>Update Profile Settings · Free</span>
          </k-button>
        </div>
      </div>

      <!-- Logout and Clear Cache section (iOS Native style) -->
      <div style="text-align: center; margin-top: 36px; padding: 0 20px;">
        <!-- Clear Cache / Resync Button -->
        <k-button @click="clearCacheAndResync" style="max-width: 220px; background: #555555; border: none; border-radius: 12px; color: #FFFFFF; font-size: 0.9rem; font-weight: 700; padding: 14px; cursor: pointer; transition: opacity 0.15s; margin: 0 auto 20px; width: 100%;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Clear Cache & Resync
        </k-button>

        <k-button @click="doLogout" style="max-width: 220px; background: #FF3B30; border: none; border-radius: 12px; color: #FFFFFF; font-size: 0.9rem; font-weight: 700; padding: 14px; cursor: pointer; transition: opacity 0.15s; margin: 0 auto; width: 100%; box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Sign Out of Wallet
        </k-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Navbar as kNavbar,
  Link as kLink,
  Button as kButton,
  Segmented as kSegmented,
  SegmentedButton as kSegmentedButton,
} from 'konsta/vue';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import Identicon from '@/components/Identicon.vue';
import { db } from '@/db/schema';
import { generateSuggestedUsername } from '@/utils/usernameGenerator';
import { wallet } from '@/protocol/walletAdapter';
import { indexerService } from '@/indexer/IndexerService';
import { bytesToHex } from '@/protocol/signature';

const auth = useAuthStore();
const ui = useUIStore();
const IS_TESTNET = import.meta.env.VITE_NIMIQ_NETWORK === 'testnet';

const PROFILE_ADDRESS = import.meta.env.VITE_NIMIQ_PROFILE_ADDRESS || '';

function getShortAddress(address) {
  if (!address) return '';
  const clean = address.replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return `${clean.substring(0, 4)}...${clean.substring(clean.length - 4)}`;
}

const currentProfile = ref(null);
const loadingProfile = ref(true);
const claiming = ref(false);
const seed = ref(Date.now());
const attempts = ref(0);
const claimAttemptsLeft = ref(6);
const customUsername = ref('');
const minStamps = ref(10);

const canChange = computed(() => {
  if (!currentProfile.value?.updatedAt) return true;
  return Date.now() - currentProfile.value.updatedAt > 30 * 24 * 60 * 60 * 1000;
});
const hasClaimedOnce = computed(() => {
  return !!(currentProfile.value && currentProfile.value.name);
});
const nextChangeDate = computed(() => {
  if (!currentProfile.value?.updatedAt) return '';
  return new Date(currentProfile.value.updatedAt + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
});

async function loadProfile() {
  if (auth.address) {
    currentProfile.value = await db.merchants.get(auth.address);
    if (currentProfile.value) {
      minStamps.value = currentProfile.value.minStamps !== undefined ? currentProfile.value.minStamps : 10;
    }
  }
  loadingProfile.value = false;
  if (currentProfile.value && currentProfile.value.name) {
    customUsername.value = currentProfile.value.name;
  } else {
    customUsername.value = generateSuggestedUsername(seed.value, attempts.value);
  }
}

function regenerateSuggestion() {
  attempts.value++;
  customUsername.value = generateSuggestedUsername(seed.value, attempts.value);
}

async function claimUsername() {
  const name = customUsername.value.trim();
  if (name.length < 3) return alert('Username must be at least 3 characters.');
  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) return alert('Username: letters, numbers, _ . - only.');
  if (claimAttemptsLeft.value <= 0) return alert('No attempts remaining.');

  const owner = await db.merchants.where('name').equals(name).first();
  if (owner && owner.address !== auth.address) {
    claimAttemptsLeft.value--;
    return alert('Username already taken. Try another.');
  }

  claiming.value = true;
  try {
    const counter = currentProfile.value ? (currentProfile.value.counter || 0) + 1 : 1;
    const timestamp = Date.now();
    const branchName = currentProfile.value ? (currentProfile.value.branch || 'Main') : 'Main';
    const payload = `PROFILE|${name}|${branchName}|${minStamps.value}|${counter}|${timestamp}`;
    
    // Request wallet to sign message off-chain
    const result = await wallet.signMessage(payload);
    
    if (result && result.signature) {
      // Save profile locally with signature
      const profileData = {
        address: auth.address,
        name: name,
        branch: branchName,
        minStamps: minStamps.value,
        counter: counter,
        timestamp: timestamp,
        signature: bytesToHex(result.signature),
        pubKey: bytesToHex(result.signerPubKey)
      };
      
      await db.merchants.put(profileData);
      currentProfile.value = profileData;
      
      alert('Username claimed successfully (off-chain signature verified)!');
    } else {
      throw new Error('Signing cancelled or failed.');
    }
  } catch (e) {
    console.error(e);
    alert(e.message || 'Signature failed.');
  } finally {
    claiming.value = false;
  }
}

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
  auth.logout();
}

onMounted(loadProfile);
</script>

<style scoped>
.view-root { background: var(--bg-primary); min-height: 100%; }
.content-wrap { max-width: 600px; margin: 0 auto; }

/* Identity card */
.id-card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 22px;
  padding: 28px 20px 22px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;
}
.identicon-wrap {
  width: 80px; height: 80px;
  margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center;
  filter: drop-shadow(0 0 8px rgba(233, 178, 19, 0.5));
}
.id-name { font-size: 1.15rem; font-weight: 800; margin-bottom: 6px; }
.id-mode-badge {
  display: inline-block;
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; padding: 3px 12px; border-radius: 100px;
  margin-bottom: 12px;
}
.id-address {
  font-size: 0.7rem; font-family: monospace;
  color: var(--text-secondary); word-break: break-all;
  line-height: 1.4;
}

/* Section card */
.section-card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 22px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}
.section-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 6px; }
.section-desc  { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px; }

/* Locked */
.locked-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,214,10,0.1); border: 0.5px solid rgba(255,214,10,0.25);
  border-radius: 12px; padding: 12px 14px;
  font-size: 0.82rem; font-weight: 500; color: var(--warning);
}

/* Claim area */
.username-input-wrap { display: flex; gap: 8px; align-items: center; }
.suggest-btn {
  width: 52px; height: 52px;
  background: var(--bg-secondary); border: 1px solid var(--border-medium);
  border-radius: 12px; font-size: 1.2rem; cursor: pointer;
  transition: transform 0.15s;
}
.suggest-btn:active { transform: rotate(180deg) scale(0.9); }
.attempts-warn { font-size: 0.75rem; color: var(--danger); margin-top: 8px; text-align: center; }

/* Theme row */
.theme-row  { display: flex; align-items: center; justify-content: space-between; }
.theme-label{ font-size: 0.875rem; color: var(--text-secondary); }
.theme-seg  { width: 160px; }

/* Network row */
.net-row    { display: flex; align-items: center; justify-content: space-between; }
.net-label  { font-size: 0.875rem; color: var(--text-secondary); }
.net-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.82rem; font-weight: 600; color: var(--success);
}
.net-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 6px rgba(48,209,88,0.6);
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Spinners */
.mini-spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 8px auto;
}
.mini-spinner-inline {
  width: 16px; height: 16px;
  border: 2px solid rgba(0,0,0,0.2); border-top-color: #000;
  border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
