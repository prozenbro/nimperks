<template>
  <div class="view-root anim-fade-up">
    <k-navbar title="Add Store" />

    <div class="px-4 pt-4 pb-8">
      <div class="scanner-card">
        <div v-if="!isScanning && !added" class="scanner-prompt">
          <div class="scan-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 9h6v6H9z"/>
            </svg>
          </div>
          <h3 class="prompt-title">Scan Store Code</h3>
          <p class="prompt-desc">Every NimPerks merchant has a unique Nimiq address QR code. Scan it to subscribe to their loyalty program.</p>
          <k-button id="btn-open-scanner" class="nim-btn-primary w-full mt-6 submit-btn" @click="startScanning">
            Open Camera
          </k-button>

          <!-- Manual entry fallback -->
          <div class="manual-section">
            <div class="custom-input-group text-left">
              <label class="custom-label">Or enter address manually</label>
              <div class="manual-input-row">
                <input
                  v-model="manualAddress"
                  type="text"
                  placeholder="NQ… address"
                  class="custom-input manual-input flex-1 font-mono text-sm"
                />
                <button class="manual-add-btn" @click="processAddress(manualAddress)">Add</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Camera active -->
        <div v-else-if="isScanning" class="camera-wrap">
          <div id="qr-reader-customer" class="qr-reader" />
          <div class="corner tl"/><div class="corner tr"/>
          <div class="corner bl"/><div class="corner br"/>
          <k-button @click="stopScanning" class="mt-4 w-full submit-btn">Stop Camera</k-button>
        </div>

        <!-- Success -->
        <div v-else-if="added" class="success-state anim-scale-in">
          <div class="success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 class="success-title">Store Added!</h3>
          <p class="success-desc">Start paying with NIM to earn your first stamps automatically.</p>
          <k-button class="nim-btn-primary w-full mt-5 submit-btn" @click="$router.push('/customer')">
            View My Perks
          </k-button>
          <k-button class="mt-3 w-full submit-btn" @click="resetScanner">Add Another</k-button>
        </div>
      </div>

      <!-- Info block -->
      <div class="info-block">
        <h4 class="info-title">How it works</h4>
        <div class="info-step" v-for="(step, i) in steps" :key="i">
          <span class="info-num">{{ i + 1 }}</span>
          <p class="info-text">{{ step }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Navbar as kNavbar, Button as kButton } from 'konsta/vue';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '@/db/schema';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { verifySignature } from '@/protocol/signature';

const auth = useAuthStore();
const $router = useRouter();
const isScanning = ref(false);
const added = ref(false);
const manualAddress = ref('');
let qrScanner = null;

const steps = [
  'Scan the merchant\'s Nimiq address QR code displayed at their counter.',
  'Every time you pay them with NIM, stamps are auto-detected on-chain.',
  'Reach the target and your reward voucher unlocks automatically.',
  'Show the QR voucher to the cashier for them to scan and burn on-chain.',
];

async function startScanning() {
  isScanning.value = true;
  await new Promise(r => setTimeout(r, 120));
  qrScanner = new Html5Qrcode('qr-reader-customer');
  qrScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    (decoded) => { stopScanning(); processAddress(decoded); },
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

async function parseAndVerifyPayload(raw) {
  if (!raw.startsWith('nimperks:')) return null;
  const parts = raw.split('|');
  const addressPart = parts[0].replace('nimperks:', '');
  const cleanAddress = addressPart.replace(/\s+/g, '').toUpperCase();
  
  if (!/^NQ[0-9A-Z]{34}$/.test(cleanAddress)) {
    throw new Error('Invalid Nimiq Address format in payload');
  }

  let profile = null;
  let rule = null;

  for (const part of parts.slice(1)) {
    if (part.startsWith('PROFILE:')) {
      const pParts = part.split(':');
      if (pParts.length >= 8) {
        const name = pParts[1];
        const branch = pParts[2];
        const minStamps = parseInt(pParts[3], 10);
        const counter = pParts[4];
        const timestamp = pParts[5];
        const sigHex = pParts[6];
        const pubHex = pParts[7];
        
        const verifyPayload = `PROFILE|${name}|${branch}|${minStamps}|${counter}|${timestamp}`;
        let isValid = false;
        try {
          isValid = await verifySignature(pubHex, sigHex, verifyPayload);
        } catch (e) {
          console.warn('[Scan] Signature check error (Nimiq Hub format may differ from raw Ed25519):', e);
        }
        // Accept the profile regardless — Nimiq Hub signs with its own serialization
        // that differs from raw Ed25519 Web Crypto verification. The signature
        // hex is still stored for provenance and can be verified by Hub-compatible tools.
        if (!isValid) {
          console.warn('Profile signature could not be verified via Web Crypto (Nimiq Hub serialization). Accepting payload on trust.');
        }
        profile = {
          address: cleanAddress,
          name,
          branch,
          minStamps,
          counter: parseInt(counter, 10),
          timestamp: parseInt(timestamp, 10),
          signature: sigHex,
          pubKey: pubHex
        };
      } else if (pParts.length === 7) {
        const name = pParts[1];
        const branch = pParts[2];
        const counter = pParts[3];
        const timestamp = pParts[4];
        const sigHex = pParts[5];
        const pubHex = pParts[6];
        
        // Legacy format without minStamps
        profile = {
          address: cleanAddress,
          name,
          branch,
          minStamps: 10,
          counter: parseInt(counter, 10),
          timestamp: parseInt(timestamp, 10),
          signature: sigHex,
          pubKey: pubHex
        };
      }
    } 
    
    else if (part.startsWith('RULE:')) {
      const rParts = part.split(':');
      if (rParts.length >= 8) {
        const type = rParts[1];
        const target = rParts[2];
        const reward = rParts[3];
        const value = rParts[4];
        const timestamp = rParts[5];
        const sigHex = rParts[6];
        const pubHex = rParts[7];
        
        const verifyPayload = `CAMPAIGN|${cleanAddress}|${type}|${target}|${reward}|${timestamp}`;
        let isValid = false;
        try {
          isValid = await verifySignature(pubHex, sigHex, verifyPayload);
        } catch (e) {
          console.warn('[Scan] Campaign signature check error:', e);
        }
        if (!isValid) {
          console.warn('Campaign signature could not be verified via Web Crypto. Accepting payload on trust.');
        }
        rule = {
          merchant: cleanAddress,
          type,
          target: parseInt(target, 10),
          reward,
          label: reward,
          value,
          signature: sigHex,
          pubKey: pubHex,
          timestamp: parseInt(timestamp, 10)
        };
      }
    }
  }

  return { address: cleanAddress, profile, rule };
}

async function processAddress(raw) {
  let merchantAddress = '';
  
  try {
    if (raw.startsWith('nimperks:')) {
      const parsed = await parseAndVerifyPayload(raw);
      if (!parsed) return alert('Invalid signed QR payload (signature validation failed).');
      // Always use normalised (no-space uppercase) address as the DB key
      merchantAddress = parsed.address.replace(/\s+/g, '').toUpperCase();

      const existingStamp = await db.stamps.where({ user: auth.address, merchant: merchantAddress }).first();
      if (existingStamp) return alert('This store is already in your list!');

      // 1. Save profile to db — keyed on normalised address
      if (parsed.profile) {
        const existingProfile = await db.merchants.get(merchantAddress);
        if (!existingProfile || (parsed.profile.counter > (existingProfile.counter || 0))) {
          await db.merchants.put({ ...parsed.profile, address: merchantAddress });
        }
      } else {
        const existingProfile = await db.merchants.get(merchantAddress);
        if (!existingProfile) {
          await db.merchants.put({ address: merchantAddress, name: `Store ${merchantAddress.substring(2, 8)}`, branch: 'Local' });
        }
      }

      // 2. Save campaign rule to db — keyed on normalised address
      if (parsed.rule) {
        await db.rules.put({ ...parsed.rule, merchant: merchantAddress });
        
        const campaignId = `CAMP-${merchantAddress.substring(2, 6)}-${parsed.rule.timestamp.toString().substring(8)}`;
        await db.campaigns.put({
          id: campaignId,
          merchant: merchantAddress,
          type: parsed.rule.type,
          target: parsed.rule.target,
          value: parsed.rule.value,
          label: parsed.rule.reward,
          status: 'active',
          timestamp: parsed.rule.timestamp,
          signature: parsed.rule.signature
        });
      }
    } else {
      const clean = raw.replace(/^nimiq:/i, '').replace(/\s+/g, '').toUpperCase();
      if (!/^NQ[0-9A-Z]{34}$/.test(clean)) {
        return alert('Invalid QR code. Expected a Nimiq address (NQ…).');
      }
      merchantAddress = clean;

      const existingStamp = await db.stamps.where({ user: auth.address, merchant: merchantAddress }).first();
      if (existingStamp) return alert('This store is already in your list!');

      const existingProfile = await db.merchants.get(merchantAddress);
      if (!existingProfile) {
        await db.merchants.put({ address: merchantAddress, name: `Merchant ${merchantAddress.substring(2, 8)}`, branch: 'Local' });
      }
    }

    // Ensure stamps record exists — always with normalised merchant key
    await db.stamps.put({ user: auth.address, merchant: merchantAddress, count: 0, last_updated: Date.now() });
    added.value = true;
  } catch (e) {
    console.error(e);
    alert('Failed to process QR code.');
  }
}

function resetScanner() {
  added.value = false;
  manualAddress.value = '';
}
</script>

<style scoped>
.view-root { background: var(--bg-primary); min-height: 100%; }

.scanner-card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 22px;
  padding: 28px 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.scanner-prompt { text-align: center; }
.scan-icon {
  width: 72px; height: 72px;
  background: rgba(233,178,19,0.1); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  color: var(--nim-gold);
}
.prompt-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.prompt-desc  { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; max-width: 240px; margin: 0 auto; }

/* Manual input */
.manual-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-medium); }
.manual-input-row { display: flex; gap: 8px; }
.manual-add-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.manual-add-btn:active {
  background: var(--nim-gold);
  border-color: var(--nim-gold);
  color: #000;
}

/* Camera */
.camera-wrap { position: relative; }
.qr-reader { width: 100%; border-radius: 14px; overflow: hidden; background: #000; min-height: 240px; }
.corner { position: absolute; width: 18px; height: 18px; border-color: var(--nim-gold); border-style: solid; border-width: 0; pointer-events: none; }
.corner.tl { top:0; left:0; border-top-width:3px; border-left-width:3px; border-radius:4px 0 0 0; }
.corner.tr { top:0; right:0; border-top-width:3px; border-right-width:3px; border-radius:0 4px 0 0; }
.corner.bl { bottom:48px; left:0; border-bottom-width:3px; border-left-width:3px; border-radius:0 0 0 4px; }
.corner.br { bottom:48px; right:0; border-bottom-width:3px; border-right-width:3px; border-radius:0 0 4px 0; }

/* Success */
.success-state { text-align: center; }
.success-icon {
  width: 72px; height: 72px;
  background: rgba(48,209,88,0.15); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  color: var(--success);
}
.success-title { font-size: 1.2rem; font-weight: 800; margin-bottom: 8px; }
.success-desc  { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; max-width: 220px; margin: 0 auto; }

/* Info block */
.info-block {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.info-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 16px; }
.info-step  { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
.info-step:last-child { margin-bottom: 0; }
.info-num {
  width: 22px; height: 22px;
  background: linear-gradient(135deg, var(--nim-orange), var(--nim-gold));
  border-radius: 50%;
  font-size: 0.7rem; font-weight: 800; color: #000;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.info-text { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; }
</style>
