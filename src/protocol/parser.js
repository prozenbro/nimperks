// NimPerks Protocol Parser
// Parses Nimiq transaction extraData payloads into structured objects.

export function parseTransactionData(dataString) {
  if (!dataString) return null;

  let text = typeof dataString === 'string' ? dataString.trim() : '';
  let bytes = null;
  
  // Check if it's hex, and parse into bytes
  if (/^[0-9a-fA-F]+$/.test(text)) {
    try {
      bytes = new Uint8Array(text.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      text = new TextDecoder().decode(bytes);
    } catch (e) {
      // Ignore and keep as-is if it's not valid hex utf-8
    }
  }

  // Binary Protocol Formats (First byte indicates type)
  if (bytes && bytes.length > 0) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      
      if (bytes[0] === 0x01 && bytes.length >= 11) {
        // FlashBuy Binary Format
        const campIdHashBytes = bytes.slice(1, 5);
        const campIdHex = Array.from(campIdHashBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        const expiry = view.getUint32(5, false); // Big-endian
        const targetCount = view.getUint16(9, false); // Big-endian
        
        let labelOffset = 11;
        if (bytes[11] === 0x1F) labelOffset = 12; // Handle new delimited protocol
        
        const labelBytes = bytes.slice(labelOffset);
        const label = new TextDecoder().decode(labelBytes);

        return {
          type: 'flashbuy',
          merchant: '', // Will be matched by tx.from in Indexer
          campId: `CAMP-${campIdHex}`,
          targetCount: targetCount,
          expiry: expiry * 1000, // Convert back to ms
          label: label,
          timestamp: 0 // Inferred from block
        };
      }

      if (bytes[0] === 0x02 && bytes.length >= 7) {
        // Rule Binary Format
        const ruleType = bytes[1] === 0x01 ? 'COUNT' : 'VOLUME';
        const target = view.getUint16(2, false);
        const value = view.getUint16(4, false);
        
        let labelOffset = 6;
        if (bytes[6] === 0x1F) labelOffset = 7; // Handle new delimited protocol
        
        const labelBytes = bytes.slice(labelOffset);
        const label = new TextDecoder().decode(labelBytes);

        return {
          type: 'rule',
          merchant: '', 
          ruleType: ruleType,
          target: target,
          value: value > 0 ? value.toString() : null,
          label: label,
          reward: label, // Legacy compat
          timestamp: 0
        };
      }

      if (bytes[0] === 0x03 && bytes.length >= 5) {
        // Close Binary Format
        // [0]=0x03, [1..4]=CampID Hash
        const campIdHashBytes = bytes.slice(1, 5);
        const campIdHex = Array.from(campIdHashBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        return {
          type: 'close',
          merchant: '',
          campaignId: `CAMP-${campIdHex}`
        };
      }

      if (bytes[0] === 0x04 && bytes.length >= 2) {
        // Profile Binary Format
        let labelOffset = 1;
        if (bytes[1] === 0x1F) labelOffset = 2; // Handle new delimited protocol
        
        const labelBytes = bytes.slice(labelOffset);
        const label = new TextDecoder().decode(labelBytes);
        const parts = label.split('|');

        return {
          type: 'profile',
          merchant: '',
          name: parts[0] || 'Unknown Store',
          branch: parts[1] || 'Main',
          timestamp: 0
        };
      }
  }

  if (text.startsWith('[NimPerks:Profile]')) {
    // [NimPerks:Profile] <Store Name> | <Branch Tag>
    const content = text.replace('[NimPerks:Profile]', '').trim();
    const parts = content.split('|').map(s => s.trim());
    return {
      type: 'profile',
      name: parts[0] || 'Unknown Store',
      branch: parts[1] || 'Main',
    };
  }

  if (text.startsWith('[NimPerks:Rule]')) {
    // Legacy support
    const content = text.replace('[NimPerks:Rule]', '').trim();
    const parts = content.split('|').map(s => s.trim());
    
    if (parts.length < 4) return null; // Invalid rule

    const ruleType = parts[0]; // COUNT or VOLUME
    const ruleParams = {};

    for (let i = 1; i < parts.length; i++) {
      const [key, ...valueParts] = parts[i].split(':');
      if (key && valueParts.length > 0) {
        ruleParams[key.toLowerCase()] = valueParts.join(':').trim();
      }
    }

    return {
      type: 'rule',
      ruleType: ruleType,
      target: ruleParams.target,
      reward: ruleParams.reward,
      label: ruleParams.label,
      value: ruleParams.value || null,
    };
  }

  if (text.startsWith('RULE|')) {
    // Compressed: RULE|COUNT|6||1 Free Cappuccino
    const parts = text.split('|');
    return {
      type: 'rule',
      ruleType: parts[1],
      target: parts[2],
      value: parts[3] || null,
      label: parts[4] || null,
    };
  }

  if (text.startsWith('PROFILE|')) {
    // PROFILE|username|counter
    const parts = text.split('|');
    return {
      type: 'profile',
      username: parts[1],
      counter: parseInt(parts[2], 10) || 0
    };
  }

  if (text.startsWith('FLASHBUY|')) {
    // FLASHBUY|{merchant}|{campaignId}|{targetCount}|{expiry}|{label}|{timestamp}
    const parts = text.split('|');
    return {
      type: 'flashbuy',
      merchant: parts[1],
      campId: parts[2],
      targetCount: parseInt(parts[3], 10),
      expiry: parseInt(parts[4], 10),
      label: parts[5],
      timestamp: parseInt(parts[6], 10)
    };
  }

  if (text.startsWith('CAMPAIGN|')) {
    // CAMPAIGN|{merchant}|{type}|{target}|{reward}|{timestamp}
    const parts = text.split('|');
    return {
      type: 'campaign',
      merchant: parts[1],
      ruleType: parts[2],
      target: parseInt(parts[3], 10),
      reward: parts[4],
      timestamp: parseInt(parts[5], 10)
    };
  }

  if (text.startsWith('CLOSE|')) {
    // CLOSE|campaignId
    const parts = text.split('|');
    return {
      type: 'close',
      campaignId: parts[1]
    };
  }

  if (text.startsWith('JOIN|')) {
    // JOIN|campaignId
    const parts = text.split('|');
    return {
      type: 'flashbuy_join',
      campId: parts[1]
    };
  }

  if (text.startsWith('[FlashBuy:Create]')) {
    // [FlashBuy:Create] <CampID> | <TargetCount> | <ExpiryBlock>
    const content = text.replace('[FlashBuy:Create]', '').trim();
    const parts = content.split('|').map(s => s.trim());
    return {
      type: 'flashbuy_create',
      campId: parts[0],
      targetCount: parseInt(parts[1], 10),
      expiryBlock: parseInt(parts[2], 10),
    };
  }

  if (text.startsWith('[FlashBuy:Join]')) {
    // [FlashBuy:Join] <CampID>
    const content = text.replace('[FlashBuy:Join]', '').trim();
    return {
      type: 'flashbuy_join',
      campId: content,
    };
  }

  if (text.startsWith('[NimPerks:Redeem]')) {
    // [NimPerks:Redeem] <VoucherHash>
    const content = text.replace('[NimPerks:Redeem]', '').trim();
    return {
      type: 'redeem',
      voucherHash: content,
    };
  }

  return null;
}

export function generateRulePayload({ type, target, label, unit, value }) {
  const targetStr = unit === 'NIM' ? `${target}NIM` : `${target}`;
  return `RULE|${type}|${targetStr}|${value || ''}|${label || ''}`;
}

export function packFlashBuy(campIdHashBytes, expirySec, targetCount, label) {
  const labelBytes = new TextEncoder().encode(label);
  const totalLength = 1 + 4 + 4 + 2 + 1 + labelBytes.length; // +1 for 0x1F delimiter
  
  if (totalLength > 64) {
    throw new Error(`Payload too large (${totalLength} bytes). Max 64 bytes.`);
  }

  const payload = new Uint8Array(totalLength);
  const view = new DataView(payload.buffer);

  payload[0] = 0x01; // Prefix
  payload.set(campIdHashBytes.slice(0, 4), 1); // 4-byte ID
  view.setUint32(5, expirySec, false); // Big-endian
  view.setUint16(9, targetCount, false); // Big-endian
  payload[11] = 0x1F; // Delimiter
  payload.set(labelBytes, 12);

  return payload;
}

export function packRule(type, target, value, label) {
  const labelBytes = new TextEncoder().encode(label || '');
  const totalLength = 1 + 1 + 2 + 2 + 1 + labelBytes.length; // +1 for 0x1F delimiter
  
  if (totalLength > 64) {
    throw new Error(`Payload too large (${totalLength} bytes). Max 64 bytes.`);
  }

  const payload = new Uint8Array(totalLength);
  const view = new DataView(payload.buffer);

  payload[0] = 0x02; // Prefix
  payload[1] = type === 'COUNT' ? 0x01 : 0x02;
  view.setUint16(2, parseInt(target, 10) || 0, false);
  view.setUint16(4, parseInt(value, 10) || 0, false);
  payload[6] = 0x1F; // Delimiter
  payload.set(labelBytes, 7);

  return payload;
}

export function packClose(campIdHashBytes) {
  const payload = new Uint8Array(5);
  payload[0] = 0x03; // Prefix
  payload.set(campIdHashBytes.slice(0, 4), 1); // 4-byte ID
  return payload;
}

export function packProfile(name, branch) {
  const str = `${name}|${branch || 'Main'}`;
  const labelBytes = new TextEncoder().encode(str);
  const totalLength = 1 + 1 + labelBytes.length; // +1 for 0x1F delimiter
  
  if (totalLength > 64) {
    throw new Error(`Profile name too large. Keep it shorter!`);
  }

  const payload = new Uint8Array(totalLength);
  payload[0] = 0x04; // Prefix
  payload[1] = 0x1F; // Delimiter
  payload.set(labelBytes, 2);

  return payload;
}
