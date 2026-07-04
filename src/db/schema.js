import Dexie from 'dexie';

export const db = new Dexie('nimperks-v1');

db.version(3).stores({
  merchants: 'address, name, branch',
  transactions: 'hash, from, to, type, data, timestamp',
  stamps: '[user+merchant], user, merchant, count, last_updated',
  campaigns: 'id, merchant, target, expiry, current_count',
  rules: 'merchant, type, target, reward, label, value',
  sync_state: 'address',
  redemptions: 'hash, merchant, user, reward, timestamp, status'
});

// v4: normalise merchant addresses (strip spaces) in stamps + rules + campaigns + merchants
db.version(4).stores({
  merchants: 'address, name, branch',
  transactions: 'hash, from, to, type, data, timestamp',
  stamps: '[user+merchant], user, merchant, count, last_updated',
  campaigns: 'id, merchant, target, expiry, current_count',
  rules: 'merchant, type, target, reward, label, value',
  sync_state: 'address',
  redemptions: 'hash, merchant, user, reward, timestamp, status'
}).upgrade(async tx => {
  // Re-write stamps with normalised merchant keys
  const stamps = await tx.table('stamps').toArray();
  for (const s of stamps) {
    const norm = s.merchant?.replace(/\s+/g, '').toUpperCase();
    if (norm && norm !== s.merchant) {
      await tx.table('stamps').delete([s.user, s.merchant]);
      await tx.table('stamps').put({ ...s, merchant: norm });
    }
  }
  // Re-write rules with normalised merchant keys
  const rules = await tx.table('rules').toArray();
  for (const r of rules) {
    const norm = r.merchant?.replace(/\s+/g, '').toUpperCase();
    if (norm && norm !== r.merchant) {
      await tx.table('rules').delete(r.merchant);
      await tx.table('rules').put({ ...r, merchant: norm });
    }
  }
  // Re-write campaigns with normalised merchant keys
  const campaigns = await tx.table('campaigns').toArray();
  for (const c of campaigns) {
    const norm = c.merchant?.replace(/\s+/g, '').toUpperCase();
    if (norm && norm !== c.merchant) {
      await tx.table('campaigns').put({ ...c, merchant: norm });
    }
  }
  // Re-write merchants with normalised address keys
  const merchants = await tx.table('merchants').toArray();
  for (const m of merchants) {
    const norm = m.address?.replace(/\s+/g, '').toUpperCase();
    if (norm && norm !== m.address) {
      await tx.table('merchants').delete(m.address);
      await tx.table('merchants').put({ ...m, address: norm });
    }
  }
});

// v5: clear stamps and sync_state to force clean resync of timestamp-filtered logic
db.version(5).stores({
  merchants: 'address, name, branch',
  transactions: 'hash, from, to, type, data, timestamp',
  stamps: '[user+merchant], user, merchant, count, last_updated',
  campaigns: 'id, merchant, target, expiry, current_count',
  rules: 'merchant, type, target, reward, label, value',
  sync_state: 'address',
  redemptions: 'hash, merchant, user, reward, timestamp, status'
}).upgrade(async tx => {
  await tx.table('stamps').clear();
  await tx.table('sync_state').clear();
});

// v6: clear sync_state again after fixing parser logic for FLASHBUY/CAMPAIGN payloads
db.version(6).stores({
  merchants: 'address, name, branch',
  transactions: 'hash, from, to, type, data, timestamp',
  stamps: '[user+merchant], user, merchant, count, last_updated',
  campaigns: 'id, merchant, target, expiry, current_count',
  rules: 'merchant, type, target, reward, label, value',
  sync_state: 'address',
  redemptions: 'hash, merchant, user, reward, timestamp, status'
}).upgrade(async tx => {
  await tx.table('sync_state').clear();
});

if (typeof window !== 'undefined') {
  db.on('versionchange', () => {
    db.close();
    window.location.reload();
  });
}
