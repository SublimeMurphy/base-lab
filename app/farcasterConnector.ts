'use client';

import { createConnector } from 'wagmi';
import type { EIP1193Provider } from 'viem';
import sdk from '@farcaster/miniapp-sdk';
import { baseSepolia } from 'wagmi/chains';

const targetChainId = baseSepolia.id;
const targetChainHex = `0x${targetChainId.toString(16)}`;

export const farcasterConnector = createConnector(() => {
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

      const account = accounts[0];
      if (!account) {
        throw new Error('Farcaster wallet did not return an account');
      }

      return {
        account,
        chain: {
          id: currentChainId,
          unsupported: currentChainId !== targetChainId,
        },
        provider: await getProvider(),
      };
    },

    async disconnect() {
      provider = null;
    },

    async getAccount() {
      const accounts = await requestAccounts('eth_accounts');
      if (!accounts.length) {
        throw new Error('No accounts from Farcaster wallet');
      }
      return accounts[0];
    },

    async getChainId() {
      return getChainId();
    },

    async getProvider() {
      return getProvider();
    },

    async isAuthorized() {
      try {
        const currentProvider = await getProvider();
        const accounts = (await currentProvider.request({
          method: 'eth_accounts',
        })) as string[];
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    async switchChain(chainId: number) {
      if (chainId !== targetChainId) {
        throw new Error('Unsupported chain for Farcaster wallet');
      }

      const currentProvider = await getProvider();
      await currentProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainHex }],
      });

      return {
        ...baseSepolia,
      };
    },
  };
});
