// NimPerks Protocol Parser
// Parses Nimiq transaction extraData payloads into structured objects.

export function parseTransactionData(dataString) {
  if (!dataString) return null;

  let text = typeof dataString === 'string' ? dataString.trim() : '';
  
  // Check if it's hex, and decode to UTF-8 text
  if (/^[0-9a-fA-F]+$/.test(text)) {
    try {
      const bytes = new Uint8Array(text.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      text = new TextDecoder().decode(bytes);
    } catch (e) {
      // Ignore and keep as-is if it's not valid hex utf-8
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
    // FLASHBUY|campId|targetCount|expiryBlock
    const parts = text.split('|');
    return {
      type: 'flashbuy',
      campId: parts[1],
      targetCount: parseInt(parts[2], 10),
      expiryBlock: parseInt(parts[3], 10)
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
