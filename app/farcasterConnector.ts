'use client';

import { createConnector } from 'wagmi';
import type { Address, EIP1193EventMap, EIP1193Provider } from 'viem';
import sdk from '@farcaster/miniapp-sdk';
import { baseSepolia } from 'wagmi/chains';

const targetChainId = baseSepolia.id;
const targetChainHex = `0x${targetChainId.toString(16)}`;

type WagmiConnectorReturn = ReturnType<Parameters<typeof createConnector>[0]>;

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

    const requestAccounts = async (
      method: 'eth_requestAccounts' | 'eth_accounts',
    ): Promise<readonly Address[]> => {
      const currentProvider = await getProvider();
      const accounts = (await currentProvider.request({
        method,
      })) as string[];
      return accounts.map((account) => account as Address) as readonly Address[];
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
      config.emitter.emit('disconnect');
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

    const connector: WagmiConnectorReturn = {
      id: 'frame',
      name: 'Farcaster Wallet',
      type: 'frame' as const,

      connect: (async ({
        chainId,
        isReconnecting,
        withCapabilities,
      }: {
        chainId?: number;
        isReconnecting?: boolean;
        withCapabilities?: boolean;
      } = {}) => {
        if (chainId && chainId !== targetChainId) {
          throw new Error('Unsupported chain for Farcaster wallet');
        }

        await ensureTargetChain();
        let accounts = await requestAccounts('eth_accounts');
        if (!accounts.length || !isReconnecting) {
          accounts = await requestAccounts('eth_requestAccounts');
        }

        const currentChainId = await getChainId();

        await attachListeners();
        config.emitter.emit('connect', { accounts, chainId: currentChainId });

        if (withCapabilities) {
          const enriched = accounts.map((address) => ({
            address,
            capabilities: {} as Record<string, unknown>,
          }));

          return {
            accounts: enriched,
            chainId: currentChainId,
          };
        }

        return {
          accounts,
          chainId: currentChainId,
        };
      }) as WagmiConnectorReturn['connect'],

      async disconnect() {
        await detachListeners();
        if (provider) {
          config.emitter.emit('disconnect');
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
    return connector;
  });
