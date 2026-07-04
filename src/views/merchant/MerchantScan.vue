<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="Validate Perks">
      <template #subtitle>Scan customer reward QR codes</template>
    </k-navbar>

    <!-- IDLE: show scanner trigger -->
    <div v-if="!isProcessing" class="scanner-idle px-4 pt-4">
      <div class="scanner-card">
        <div v-if="!isScanning" class="scanner-prompt">
          <div class="scan-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 9h6v6H9z"/>
            </svg>
          </div>
          <h3 class="scan-title">Voucher Scanner</h3>
          <p class="scan-desc">Point camera at customer's reward QR code to verify and burn on-chain.</p>
          <k-button
            id="btn-open-camera"
            class="nim-btn-primary w-full mt-6 submit-btn"
            @click="startScanning"
          >
            Open Camera
          </k-button>
        </div>

        <!-- Live camera feed -->
        <div v-else class="camera-wrap">
          <div id="qr-reader-merchant" class="qr-reader-area" />
          <!-- Corner frame decorations -->
          <div class="corner tl" /><div class="corner tr" />
          <div class="corner bl" /><div class="corner br" />
          <k-button @click="stopScanning" class="mt-4 w-full submit-btn">Stop Scanner</k-button>
        </div>
      </div>

      <!-- Recent redemptions quick-view -->
      <div v-if="recentRedemptions.length" class="recent-section">
        <p class="recent-title">Recent Scans</p>
        <div
          v-for="r in recentRedemptions"
          :key="r.hash"
          class="recent-item"
        >
          <div class="recent-icon" :class="r.status === 'confirmed' ? 'recent-icon--ok' : 'recent-icon--pending'">
            <svg v-if="r.status === 'confirmed'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="recent-body">
            <p class="recent-reward">{{ r.reward || 'Reward Redeemed' }}</p>
            <p class="recent-addr">{{ formatAddr(r.user) }}</p>
          </div>
          <span class="recent-badge" :class="r.status === 'confirmed' ? 'badge-success' : 'badge-pending'">
            {{ r.status === 'confirmed' ? 'Settled' : '0-Conf' }}
          </span>
        </div>
      </div>
    </div>

    <!-- PROCESSING OVERLAY -->
    <div v-else class="process-overlay">
      <!-- Validating -->
      <div v-if="processState === 'validating'" class="process-state anim-scale-in">
        <div class="process-spinner">
          <svg width="64" height="58" viewBox="0 0 27 24" fill="none" class="hex-spin">
            <path d="M26.7 10.9L21.1 1.1C20.7.4 20 0 19.1 0H7.9C7 0 6.3.4 5.9 1.1L.3 10.9C-.1 11.6-.1 12.4.3 13.1L5.9 22.9C6.3 23.6 7 24 7.9 24H19.1C20 24 20.7 23.6 21.1 22.9L26.7 13.1C27.1 12.4 27.1 11.6 26.7 10.9Z" fill="url(#spinGrad)"/>
            <defs>
              <radialGradient id="spinGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27 24) rotate(-180) scale(27 24)">
                <stop stop-color="#EC991C"/><stop offset="1" stop-color="#E9B213"/>
              </radialGradient>
            </defs>
          </svg>
        </div>
        <h3 class="process-title">Burning On-Chain…</h3>
        <p class="process-desc">Broadcasting to mempool. This takes a moment.</p>
      </div>

      <!-- Success -->
      <div v-else-if="processState === 'success'" class="process-state anim-scale-in">
        <div class="result-icon result-icon--success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 class="process-title" style="color: var(--success)">Redeemed!</h3>
        <p class="process-desc">Voucher burned. Transaction confirmed at 0-conf.</p>
        <k-button class="nim-btn-primary mt-6 w-56 submit-btn" @click="resetScanner">Scan Another</k-button>
      </div>

      <!-- Error -->
      <div v-else-if="processState === 'error'" class="process-state anim-scale-in">
        <div class="result-icon result-icon--error">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
        <h3 class="process-title" style="color: var(--danger)">Failed</h3>
        <p class="process-desc">{{ errorMsg }}</p>
        <k-button class="mt-6 w-56 submit-btn" @click="resetScanner">Try Again</k-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Navbar as kNavbar, Button as kButton } from 'konsta/vue';
import { Html5Qrcode } from 'html5-qrcode';
import { validateVoucher } from '@/protocol/voucher';
import { wallet } from '@/protocol/walletAdapter';
import { useAuthStore } from '@/stores/auth';
import { db } from '@/db/schema';

const auth = useAuthStore();
const isScanning = ref(false);
const isProcessing = ref(false);
const processState = ref('validating');
const errorMsg = ref('');
const recentRedemptions = ref([]);
const REDEMPTIONS_ADDRESS = import.meta.env.VITE_NIMIQ_REDEMPTIONS_ADDRESS || '';
let qrScanner = null;

async function loadRecent() {
  if (!auth.address) return;
  const normAddress = auth.address.replace(/\s+/g, '').toUpperCase();
  const all = await db.redemptions.where('merchant').equals(normAddress).reverse().sortBy('timestamp');
  recentRedemptions.value = all.slice(0, 5);
}

async function startScanning() {
  isScanning.value = true;
  await new Promise(r => setTimeout(r, 120));
  qrScanner = new Html5Qrcode('qr-reader-merchant');
  qrScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    (decoded) => { stopScanning(); processVoucher(decoded); },
    () => {}
  ).catch(() => {
    alert('Camera permission denied.');
    isScanning.value = false;
  });
}

function stopScanning() {
  if (qrScanner?.isScanning) {
    qrScanner.stop().then(() => qrScanner.clear()).catch(()=>{});
  }
  isScanning.value = false;
}

async function processVoucher(text) {
  isProcessing.value = true;
  processState.value = 'validating';
  try {
    const result = validateVoucher(text);
    const normAddress = auth.address.replace(/\s+/g, '').toUpperCase();
    if (!result.valid || result.merchantAddress !== normAddress) {
      throw new Error(result.reason || 'Invalid voucher for this store');
    }
    const voucherHash = text.substring(0, 20);
    const extra = new TextEncoder().encode(`REDEEM|${voucherHash}`);
    await wallet.sendTransaction({ recipient: REDEMPTIONS_ADDRESS || auth.address, value: 1, extraData: extra });

    // Optimistically write pending record
    await db.redemptions.put({
      hash: voucherHash,
      merchant: normAddress,
      user: result.userAddress || '',
      reward: result.ruleType || 'Reward',
      timestamp: Math.floor(Date.now() / 1000),
      status: 'pending'
    });
    processState.value = 'success';
    loadRecent();
  } catch (e) {
    processState.value = 'error';
    errorMsg.value = e.message || 'Transaction failed.';
  }
}

function resetScanner() {
  isProcessing.value = false;
  processState.value = 'validating';
  errorMsg.value = '';
}

function formatAddr(addr) {
  if (!addr) return '—';
  return addr.substring(0, 9) + '…' + addr.slice(-4);
}

onMounted(loadRecent);
onUnmounted(stopScanning);
</script>

<style scoped>
.view-root { background: var(--bg-primary); min-height: 100%; }

.scanner-card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 22px;
  overflow: hidden;
  padding: 28px 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.scanner-prompt { text-align: center; }
.scan-icon-wrap {
  width: 80px; height: 80px;
  background: rgba(233,178,19,0.1);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  color: var(--nim-gold);
}
.scan-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.scan-desc { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; }

.camera-wrap { position: relative; }
.qr-reader-area { width: 100%; border-radius: 14px; overflow: hidden; background: #000; min-height: 240px; }

/* Corner frame decorations */
.corner {
  position: absolute;
  width: 20px; height: 20px;
  border-color: var(--nim-gold);
  border-style: solid;
  border-width: 0;
  pointer-events: none;
}
.corner.tl { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; border-radius: 4px 0 0 0; }
.corner.tr { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; border-radius: 0 4px 0 0; }
.corner.bl { bottom: 48px; left: 0; border-bottom-width: 3px; border-left-width: 3px; border-radius: 0 0 0 4px; }
.corner.br { bottom: 48px; right: 0; border-bottom-width: 3px; border-right-width: 3px; border-radius: 0 0 4px 0; }

/* Recent scans */
.recent-section { padding-bottom: 8px; }
.recent-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 10px;
  padding-left: 4px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: 18px;
  margin-bottom: 10px;
  border: 1px solid var(--border-medium);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.recent-item:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
.recent-icon {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.recent-icon--ok     { background: rgba(48,209,88,0.15);  color: var(--success); }
.recent-icon--pending{ background: rgba(255,214,10,0.15); color: var(--warning); }
.recent-body { flex: 1; overflow: hidden; }
.recent-reward { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); line-height: 1.2; }
.recent-addr   { font-size: 0.72rem; font-family: monospace; color: var(--text-secondary); margin-top: 2px; }

/* Processing overlay */
.process-overlay {
  display: flex; align-items: center; justify-content: center;
  min-height: calc(100vh - 100px);
  padding: 24px;
}
.process-state { display: flex; flex-direction: column; align-items: center; text-align: center; }
.process-spinner { margin-bottom: 24px; }

.hex-spin {
  animation: hexRotate 1.4s ease-in-out infinite;
  transform-origin: center;
}
@keyframes hexRotate {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(0.88); opacity: 0.6; }
}

.process-title { font-size: 1.4rem; font-weight: 800; margin-bottom: 8px; }
.process-desc  { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; max-width: 220px; }

.result-icon {
  width: 72px; height: 72px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.result-icon--success { background: rgba(48,209,88,0.15); color: var(--success); }
.result-icon--error   { background: rgba(255,69,58,0.15);  color: var(--danger); }
</style>
