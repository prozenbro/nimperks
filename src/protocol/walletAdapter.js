/**
 * WalletAdapter — Universal abstraction for @nimiq/hub-api (browser)
 * and @nimiq/mini-app-sdk (Nimiq Pay native app).
 *
 * The adapter auto-detects the environment on `init()` and exposes
 * a unified API consumed by the rest of the app.
 */

import HubApi from '@nimiq/hub-api';

const HUB_URL = import.meta.env.VITE_NIMIQ_NETWORK === 'mainnet'
  ? 'https://hub.nimiq.com'
  : 'https://hub.nimiq-testnet.com';

class WalletAdapter {
  constructor() {
    /** @type {'mini-app'|'hub'|'unknown'} */
    this.environment = 'unknown';
    this._hubApi = null;
    this._sdk = null;
  }

  /**
   * Call once at app boot. Detects the runtime environment.
   * @returns {Promise<'mini-app'|'hub'>}
   */
  async init() {
    if (this.environment !== 'unknown') return this.environment;

    try {
      // The Nimiq Pay mini-app SDK exposes a signal we can detect.
      // It injects `window.__NIMIQ_MINIAPP__` or provides its own exports.
      const sdk = await import('@nimiq/mini-app-sdk');

      // Different SDK versions may export NimiqMiniApp, MiniApp, or default
      const MiniAppClass = sdk.NimiqMiniApp ?? sdk.MiniApp ?? sdk.default;
      if (MiniAppClass) {
        const instance = new MiniAppClass();
        // Some SDK versions require an init/connect step
        if (typeof instance.init === 'function') {
          await instance.init();
        }
        this._sdk = instance;
        this.environment = 'mini-app';
        console.info('[WalletAdapter] Running inside Nimiq Pay mini-app.');
        return 'mini-app';
      }
    } catch (_) {
      // Not in mini-app environment — fall through to Hub API
    }

    this._hubApi = new HubApi(HUB_URL);
    this.environment = 'hub';
    console.info('[WalletAdapter] Running in browser — using Nimiq Hub API.');
    return 'hub';
  }

  /** Lazily initialises and returns the Hub API instance */
  _getHub() {
    if (!this._hubApi) {
      this._hubApi = new HubApi(HUB_URL);
    }
    return this._hubApi;
  }

  /**
   * Get the user's Nimiq address.
   * @returns {Promise<string>} Nimiq address (e.g. NQ…)
   */
  async getAddress() {
    await this.init();

    if (this.environment === 'mini-app') {
      const account = await this._sdk.requestAccount?.() ?? await this._sdk.getAccount?.();
      return account.address;
    }

    // Hub API
    const result = await this._getHub().chooseAddress({ appName: 'NimPerks' });
    return result.address;
  }

  /**
   * Send a NIM transaction.
   * @param {{ recipient: string, value: number, extraData?: Uint8Array }} txDetails
   */
  async sendTransaction(txDetails) {
    await this.init();

    const request = {
      appName: 'NimPerks',
      recipient: txDetails.recipient,
      value: txDetails.value,
      extraData: txDetails.extraData ?? undefined,
    };

    if (this.environment === 'mini-app') {
      // SDK naming may differ; try sendTransaction, then checkout
      if (typeof this._sdk.sendTransaction === 'function') {
        return this._sdk.sendTransaction(request);
      }
      return this._sdk.checkout?.(request);
    }

    return this._getHub().checkout(request);
  }

  /**
   * Sign an arbitrary message (UTF-8 string or Uint8Array).
   * @param {string|Uint8Array} message
   */
  async signMessage(message) {
    await this.init();

    const request = { appName: 'NimPerks', message };

    if (this.environment === 'mini-app') {
      return this._sdk.signMessage?.(request);
    }

    return this._getHub().signMessage(request);
  }
}

/** Singleton instance used across the app */
export const wallet = new WalletAdapter();
