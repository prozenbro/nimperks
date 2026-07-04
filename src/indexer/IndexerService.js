import { rpc } from '../chain/rpc.js';
import { db } from '../db/schema.js';
import { parseTransactionData } from '../protocol/parser.js';

const SYNC_PAGE_SIZE = 100;
const CAMPAIGN_ADDRESS = import.meta.env.VITE_NIMIQ_CAMPAIGN_ADDRESS || '';
const PROFILE_ADDRESS = import.meta.env.VITE_NIMIQ_PROFILE_ADDRESS || '';
const REDEMPTIONS_ADDRESS = import.meta.env.VITE_NIMIQ_REDEMPTIONS_ADDRESS || '';

export class IndexerService extends EventTarget {
  constructor() {
    super();
    this._isSyncing = false;
    this._syncInterval = null;
  }

  // Start polling tracked merchants for new transactions
  startSyncLoop(intervalMs = 30000) {
    if (this._syncInterval) return;
    this._syncInterval = setInterval(() => {
      this.syncAllMerchants().catch(console.error);
    }, intervalMs);
    // Trigger initial sync
    this.syncAllMerchants().catch(console.error);
  }

  stopSyncLoop() {
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
    }
  }

  async syncAllMerchants() {
    if (this._isSyncing) return;
    this._isSyncing = true;
    this.dispatchEvent(new CustomEvent('sync:start'));

    try {
      // 1. Sync global tables first
      await this.syncGlobalTables();

      // 2. Sync local merchant stamp transactions
      const merchants = await db.merchants.toArray();
      for (const merchant of merchants) {
        await this.syncMerchant(merchant.address);
      }
    } catch (e) {
      console.error('Global/merchant sync error:', e);
    } finally {
      this._isSyncing = false;
      this.dispatchEvent(new CustomEvent('sync:done'));
    }
  }

  async syncGlobalTables() {
    if (CAMPAIGN_ADDRESS) await this.syncTable(CAMPAIGN_ADDRESS, 'campaigns');
    if (REDEMPTIONS_ADDRESS) await this.syncTable(REDEMPTIONS_ADDRESS, 'redemptions');
  }

  async syncTable(address, type) {
    let state = await db.sync_state.get(address);
    if (!state) {
      state = {
        address,
        newest_seen_tx_hash: null,
      };
    }

    const txs = await rpc.getTransactionsByAddress(address, SYNC_PAGE_SIZE, null);
    if (!txs || txs.length === 0) return;

    let processed = 0;
    // Process backwards (newest to oldest) until we hit the last seen transaction
    for (const tx of txs) {
      if (tx.hash === state.newest_seen_tx_hash) break;
      
      await this.processTableTransaction(tx, type);
      processed++;
    }

    if (processed > 0) {
      state.newest_seen_tx_hash = txs[0].hash;
      await db.sync_state.put(state);
    }
  }

  async processTableTransaction(tx, type) {
    // Log transaction to DB for generic viewing if needed
    try {
      await db.transactions.put({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        data: tx.data,
        timestamp: tx.timestamp
      });
    } catch (e) {}

    const parsed = parseTransactionData(tx.data);
    if (!parsed) return;

    if (type === 'campaigns') {
      const normFrom = (tx.from || '').replace(/\s+/g, '').toUpperCase();
      
      if (parsed.type === 'campaign') {
        if (normFrom === parsed.merchant) {
          await db.rules.put({
            merchant: parsed.merchant,
            type: parsed.ruleType,
            target: parsed.target,
            reward: parsed.reward,
            label: parsed.reward,
            value: '', 
            timestamp: parsed.timestamp,
          });
        }
      }
      
      else if (parsed.type === 'rule') {
        // Binary Rule (0x02) - replaces off-chain scanning!
        // We save it both as the active rule and as a 'campaign' for the dashboard
        await db.rules.put({
          merchant: normFrom,
          type: parsed.ruleType,
          target: parsed.target,
          reward: parsed.label,
          label: parsed.label,
          value: parsed.value || '', 
          timestamp: tx.timestamp,
        });
        
        await db.campaigns.put({
          id: `RULE-${normFrom}`,
          merchant: normFrom,
          target: parsed.target,
          label: parsed.label,
          type: parsed.ruleType,
          status: 'active',
          timestamp: tx.timestamp
        });
      }
      
      else if (parsed.type === 'flashbuy') {
        await db.campaigns.put({
          id: parsed.campId,
          merchant: normFrom, // Binary format doesn't have merchant in payload, uses tx.from
          target: parsed.targetCount,
          expiry: parsed.expiry,
          label: parsed.label,
          type: 'FLASHBUY',
          status: 'active',
          current_count: 0,
          timestamp: tx.timestamp
        });
      }

      else if (parsed.type === 'flashbuy_join') {
        const campaign = await db.campaigns.get(parsed.campId);
        if (campaign) {
          campaign.current_count = (campaign.current_count || 0) + 1;
          await db.campaigns.put(campaign);
          this.dispatchEvent(new CustomEvent('campaign:updated', { detail: campaign }));
        }
      } 
      
      else if (parsed.type === 'close') {
        // Binary Close (0x03)
        // Check if it's closing a rule or a flashbuy
        if (parsed.campaignId) {
          const existing = await db.campaigns.get(parsed.campaignId);
          if (existing && existing.merchant === normFrom) {
            existing.status = 'closed';
            await db.campaigns.put(existing);
            
            // If they closed their main Rule, clear it from rules DB too
            if (parsed.campaignId === `RULE-${normFrom}`) {
              await db.rules.delete(normFrom);
            }
          }
        }
      }
      
      else if (parsed.type === 'profile') {
        // Binary Profile (0x04)
        const existing = await db.merchants.get(normFrom);
        if (!existing || existing.timestamp <= tx.timestamp) {
          await db.merchants.put({
            address: normFrom,
            name: parsed.name,
            branch: parsed.branch,
            minStamps: parsed.minStamps,
            timestamp: tx.timestamp
          });
        }
      }
    } 
    
    else if (type === 'redemptions') {
      if (parsed.type === 'redeem') {
        const existing = await db.redemptions.get(tx.hash);
        if (existing) {
          existing.status = 'confirmed';
          existing.timestamp = tx.timestamp;
          await db.redemptions.put(existing);
        } else {
          const normMerchant = (tx.to || '').replace(/\s+/g, '').toUpperCase();
          const normUser = (parsed.userAddress || tx.from || '').replace(/\s+/g, '').toUpperCase();

          await db.redemptions.put({
            hash: tx.hash,
            merchant: normMerchant,
            user: normUser,
            reward: parsed.rewardLabel || 'Reward',
            timestamp: tx.timestamp,
            status: 'confirmed'
          });

          // Reset stamp counter for this user upon redemption
          let stampRecord = await db.stamps.get([normUser, normMerchant]);
          if (stampRecord) {
            stampRecord.count = 0;
            stampRecord.last_updated = tx.timestamp;
            await db.stamps.put(stampRecord);
          }
        }
        this.dispatchEvent(new CustomEvent('voucher:redeemed', { detail: { hash: tx.hash, parsed } }));
      }
    }
  }

  // Syncs a specific merchant address from their last known state
  async syncMerchant(address) {
    let state = await db.sync_state.get(address);
    if (!state) {
      state = {
        address,
        newest_seen_tx_hash: null,
      };
    }

    const txs = await rpc.getTransactionsByAddress(address, SYNC_PAGE_SIZE, null);
    if (!txs || txs.length === 0) return;

    const newTxs = [];
    for (const tx of txs) {
      if (tx.hash === state.newest_seen_tx_hash) break;
      newTxs.unshift(tx); // prepend to reverse order
    }

    let processed = 0;
    for (const tx of newTxs) {
      await this.processTransaction(tx, address);
      processed++;
    }

    if (processed > 0) {
      state.newest_seen_tx_hash = txs[0].hash;
      await db.sync_state.put(state);
      this.dispatchEvent(new CustomEvent('merchant:updated', { detail: { address, processed } }));
    }
  }

  async processTransaction(tx, merchantAddress) {
    // Log direct merchant transactions in DB
    try {
      await db.transactions.put({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        data: tx.data,
        timestamp: tx.timestamp
      });
    } catch (e) {}

    // Normal transactions (Stamps logic)
    // If user sends to merchant (with no extra payload data), we count it towards stamps
    const normTo = (tx.to || '').replace(/\s+/g, '').toUpperCase();
    const normFrom = (tx.from || '').replace(/\s+/g, '').toUpperCase();
    
    if (normTo === merchantAddress && normFrom !== merchantAddress) {
      const rule = await db.rules.where('merchant').equals(merchantAddress).first();
      if (rule) {
        // Correct Dexie query for compound index [user+merchant] is an array [user, merchant]
        let stampRecord = await db.stamps.get([normFrom, merchantAddress]);
        
        if (!stampRecord) {
          stampRecord = {
            user: normFrom,
            merchant: merchantAddress,
            count: 0,
            last_updated: tx.timestamp
          };
        }

        // Exclude transactions before the rule was created (but allow 0 / mempool txs)
        const txMs = (tx.timestamp || 0) * 1000;
        if (rule.timestamp && txMs > 0 && txMs < rule.timestamp) {
          return; // Skip counting older transactions
        }

        // Parse extraData to ensure we don't count system control messages as stamp payments
        const parsedData = parseTransactionData(tx.data);
        const isSystemMsg = parsedData !== null;

        if (!isSystemMsg) {
          const minSpend = parseFloat(rule.value) || 0;
          const amountNim = tx.value / 1e5; // Convert Luna to NIM

          if (amountNim >= minSpend) {
            if (rule.type === 'COUNT') {
              stampRecord.count += 1;
            } else if (rule.type === 'VOLUME') {
              stampRecord.count += amountNim; 
            }
            stampRecord.last_updated = tx.timestamp;
            // Dexie automatically infers the [user+merchant] compound key from the object properties
            await db.stamps.put(stampRecord);
          }
        }
      }
    }
  }
}

export const indexerService = new IndexerService();
