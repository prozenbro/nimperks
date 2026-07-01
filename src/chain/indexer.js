import { rpc } from './rpc';
import { db } from '../db/schema';
import { parseTransactionData } from '../protocol/parser';

const CAMPAIGN_ADDRESS = import.meta.env.VITE_NIMIQ_CAMPAIGN_ADDRESS || '';

export class IndexerService extends EventTarget {
  constructor() {
    super();
    this.isSyncing = false;
  }

  async startSync() {
    if (this.isSyncing || !CAMPAIGN_ADDRESS) return;
    this.isSyncing = true;
    this.dispatchEvent(new CustomEvent('sync:start'));

    try {
      // 1. Get last synced state
      let syncState = await db.sync_state.get(CAMPAIGN_ADDRESS);
      let startAt = syncState ? syncState.newest_seen_tx_hash : null;

      // 2. Fetch recent transactions
      // Note: We sync backwards, but to process chronologically, we reverse the page.
      const txs = await rpc.getTransactionsByAddress(CAMPAIGN_ADDRESS, 500, startAt);
      
      // Process txs chronologically (oldest first)
      const sortedTxs = [...txs].reverse();

      for (const tx of sortedTxs) {
        await this.processTx(tx);
      }

      if (txs.length > 0) {
        // Save the newest transaction hash we saw (which is the first one in the returned page)
        await db.sync_state.put({
          address: CAMPAIGN_ADDRESS,
          newest_seen_tx_hash: txs[0].hash,
          last_synced_at: Date.now()
        });
      }

      this.dispatchEvent(new CustomEvent('sync:end'));
    } catch (err) {
      console.error('Sync failed:', err);
      this.dispatchEvent(new CustomEvent('sync:error', { detail: err }));
    } finally {
      this.isSyncing = false;
    }
  }

  async processTx(tx) {
    const parsed = parseTransactionData(tx.data);
    if (!parsed) return;

    if (parsed.type === 'rule') {
      // Add or update Loyalty Reward campaign
      await db.campaigns.put({
        id: tx.hash,
        merchant: tx.from,
        type: parsed.ruleType,
        target: parseInt(parsed.target, 10) || 10,
        value: parsed.value || '',
        label: parsed.label || 'Reward Campaign',
        status: 'active',
        timestamp: tx.timestamp * 1000 || Date.now()
      });
    } 
    
    else if (parsed.type === 'flashbuy') {
      // Add or update Group Deal campaign
      await db.campaigns.put({
        id: parsed.campId || tx.hash,
        merchant: tx.from,
        type: 'FLASHBUY',
        target: parsed.targetCount,
        expiry: parsed.expiryBlock,
        status: 'active',
        timestamp: tx.timestamp * 1000 || Date.now()
      });
    } 
    
    else if (parsed.type === 'close') {
      // Close/Deactivate a campaign
      const existing = await db.campaigns.get(parsed.campaignId);
      if (existing) {
        existing.status = 'closed';
        await db.campaigns.put(existing);
      }
    } 
    
    else if (parsed.type === 'profile') {
      // Claim Profile Name
      const username = parsed.username;
      
      // Check if username is already claimed by someone else
      const owner = await db.merchants.where('name').equals(username).first();
      if (!owner || owner.address === tx.from) {
        await db.merchants.put({
          address: tx.from,
          name: username,
          counter: parsed.counter,
          updatedAt: tx.timestamp * 1000 || Date.now()
        });
      } else {
        console.warn(`Profile name ${username} already claimed by ${owner.address}`);
      }
    }
  }
}

export const indexer = new IndexerService();
