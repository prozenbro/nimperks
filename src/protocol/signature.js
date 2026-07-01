/**
 * Cryptographic helpers for verifying off-chain signatures using browser Web Crypto APIs.
 * Nimiq uses Ed25519 signatures (32-byte public key, 64-byte signature).
 */

export function bytesToHex(bytes) {
  if (!bytes) return '';
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  if (!hex) return new Uint8Array(0);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Verifies that a message signature is valid for a given Nimiq public key.
 * @param {Uint8Array|string} publicKeyBytes - The public key (hex or bytes)
 * @param {Uint8Array|string} signatureBytes - The signature (hex or bytes)
 * @param {string} messageText - The original message that was signed
 * @returns {Promise<boolean>}
 */
export async function verifySignature(publicKeyBytes, signatureBytes, messageText) {
  try {
    const pubKey = typeof publicKeyBytes === 'string' ? hexToBytes(publicKeyBytes) : publicKeyBytes;
    const sig = typeof signatureBytes === 'string' ? hexToBytes(signatureBytes) : signatureBytes;
    
    if (pubKey.length !== 32 || sig.length !== 64) {
      return false;
    }

    const publicKey = await window.crypto.subtle.importKey(
      'raw',
      pubKey,
      { name: 'Ed25519' },
      true,
      ['verify']
    );

    const data = new TextEncoder().encode(messageText);
    return await window.crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      sig,
      data
    );
  } catch (e) {
    console.error('[Signature] Verification failed:', e);
    return false;
  }
}
