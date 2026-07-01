// NimPerks Voucher Logic
// Handles the generation and validation of cryptographic vouchers.

/**
 * Generates the payload string to be signed by the user.
 */
export function generateVoucherPayload(userAddress, merchantAddress, ruleType, discountValue) {
  return `${userAddress}:${merchantAddress}:${ruleType}:${discountValue}`;
}

/**
 * Validates a scanned voucher QR string.
 * The voucher format is expected to contain the signature and the raw payload.
 * e.g., "signature_hex|userAddress:merchantAddress:ruleType:discountValue"
 * 
 * Note: In a real Nimiq environment, we would use Nimiq's cryptographic library
 * to verify the signature against the userAddress public key.
 */
export function validateVoucher(scannedData) {
  try {
    const [signatureHex, payload] = scannedData.split('|');
    if (!signatureHex || !payload) return { valid: false, reason: 'Invalid Format' };

    const parts = payload.split(':');
    if (parts.length !== 4) return { valid: false, reason: 'Invalid Payload Data' };

    const [userAddress, merchantAddress, ruleType, discountValue] = parts;

    // TODO: Cryptographically verify signatureHex using userAddress public key.
    // For MVP frontend logic, we assume signature validation passes if format is correct.
    const isSignatureValid = true; // Replace with Nimiq.Signature.verify(...)

    if (!isSignatureValid) {
      return { valid: false, reason: 'Signature Verification Failed' };
    }

    return {
      valid: true,
      userAddress,
      merchantAddress,
      ruleType,
      discountValue
    };
  } catch (err) {
    return { valid: false, reason: 'Decryption Error' };
  }
}
