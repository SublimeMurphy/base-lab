'use client';

import { createConnector } from 'wagmi';
import type { EIP1193Provider, EIP1193EventMap } from 'viem';
import sdk from '@farcaster/miniapp-sdk';
import { baseSepolia } from 'wagmi/chains';

const targetChainId = baseSepolia.id;
const targetChainHex = `0x${targetChainId.toString(16)}`;

export const farcasterConnector = () =>
  createConnector((config) => {
    let provider: EIP1193Provider | null = null;

    const getProvider = async () => {
      if (!provider) {
        const fetched = (await sdk.wallet.getEthereumProvider()) as
          | EIP1193Provider
          | undefined;
        if (!fetched) {
          throw new Error('Farcaster wallet provider unavailable');
        }
        provider = fetched;
      }
      return provider;
    };

    const requestAccounts = async (method: 'eth_requestAccounts' | 'eth_accounts') => {
      const currentProvider = await getProvider();
      return (await currentProvider.request({
        method,
      })) as string[];
    };

    const getChainId = async () => {
      const currentProvider = await getProvider();
      const chainIdHex = (await currentProvider.request({
        method: 'eth_chainId',
      })) as string;
      return Number.parseInt(chainIdHex, 16);
    };

    const ensureTargetChain = async () => {
      const currentProvider = await getProvider();
      try {
        await currentProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainHex }],
        });
      } catch (error) {
        console.warn('Unable to switch Farcaster wallet chain', error);
      }
    };

    const handleAccountsChanged: EIP1193EventMap['accountsChanged'] = (accounts) => {
      config.emitter.emit('change', { accounts });
    };

    const handleChainChanged: EIP1193EventMap['chainChanged'] = (chainId) => {
      const parsed = typeof chainId === 'string' ? Number.parseInt(chainId, 16) : chainId;
      config.emitter.emit('change', { chainId: parsed });
    };

    const handleDisconnect: EIP1193EventMap['disconnect'] = () => {
      config.emitter.emit('disconnect', undefined);
    };

    const attachListeners = async () => {
      const currentProvider = await getProvider();
      currentProvider.on?.('accountsChanged', handleAccountsChanged);
      currentProvider.on?.('chainChanged', handleChainChanged);
      currentProvider.on?.('disconnect', handleDisconnect);
    };

    const detachListeners = async () => {
      const currentProvider = provider;
      currentProvider?.removeListener?.('accountsChanged', handleAccountsChanged);
      currentProvider?.removeListener?.('chainChanged', handleChainChanged);
      currentProvider?.removeListener?.('disconnect', handleDisconnect);
    };

    return {
      id: 'frame',
      name: 'Farcaster Wallet',
      type: 'frame' as const,

      async connect({ chainId }: { chainId?: number } = {}) {
        if (chainId && chainId !== targetChainId) {
          throw new Error('Unsupported chain for Farcaster wallet');
        }

        await ensureTargetChain();
        const accounts = await requestAccounts('eth_requestAccounts');
        const currentChainId = await getChainId();

        await attachListeners();
        config.emitter.emit('connect', { accounts, chainId: currentChainId });

        return {
          accounts,
          chainId: currentChainId,
        };
      },

      async disconnect() {
        await detachListeners();
        if (provider) {
          config.emitter.emit('disconnect', undefined);
        }
        provider = null;
      },

      async getAccount() {
        const accounts = await requestAccounts('eth_accounts');
        if (!accounts.length) {
          throw new Error('No accounts from Farcaster wallet');
        }
        return accounts[0];
      },

      async getAccounts() {
        return requestAccounts('eth_accounts');
      },

      async getChainId() {
        return getChainId();
      },

      async getProvider() {
        return getProvider();
      },

      async isAuthorized() {
        try {
          const accounts = await requestAccounts('eth_accounts');
          return accounts.length > 0;
        } catch {
          return false;
        }
      },

      async switchChain({ chainId }: { chainId: number }) {
        if (chainId !== targetChainId) {
          throw new Error('Unsupported chain for Farcaster wallet');
        }

        await ensureTargetChain();
        return baseSepolia;
      },

      onAccountsChanged: handleAccountsChanged,
      onChainChanged: handleChainChanged,
      onDisconnect: handleDisconnect,
    };
  });
