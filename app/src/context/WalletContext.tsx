import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
    cleanupAccountChangeListener,
    cleanupDisconnectListener,
    connectToMetamask,
    disconnectMetamask,
    isConnected,
    setupAccountChangeListener,
    setupDisconnectListener,
} from '../connections/MetamaskConnect';
import { ethers } from 'ethers';

export interface WalletState {
    walletConnected: boolean;
    account: string | null;
    chainId: number | null;
    balance: string | null;
    loading: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    switchNetwork: (targetChainId: number) => Promise<void>;
    refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [walletConnected, setWalletConnected] = useState(false);
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDisconnect = useCallback(async () => {
        await disconnectMetamask();
        setWalletConnected(false);
        setAccount(null);
        setChainId(null);
        setBalance(null);
        setError(null);
        sessionStorage.removeItem('pendingCid');
        sessionStorage.removeItem('pendingFile');
        sessionStorage.removeItem('wallet_connected_session');
        localStorage.removeItem('user_disconnected');
    }, []);

    // Extracted balance fetching to avoid duplication
    const fetchBalance = useCallback(async (address: string) => {
        if (!globalThis.ethereum) return null;
        try {
            const provider = new ethers.BrowserProvider(globalThis.ethereum);
            const bal = await provider.getBalance(address);
            const formatted = ethers.formatEther(bal);
            setBalance(formatted);
            return formatted;
        } catch (err) {
            console.warn('Failed to fetch balance:', err);
            return null;
        }
    }, []);

    const handleAccountsChanged = useCallback(async (accounts: string[]) => {
        if (accounts.length > 0) {
            setAccount(accounts[0]);
            await fetchBalance(accounts[0]);
        } else {
            handleDisconnect();
        }
    }, [handleDisconnect, fetchBalance]);

    const handleChainChanged = useCallback(async (chainIdHex: unknown) => {
        const newChainId = typeof chainIdHex === 'string'
            ? Number.parseInt(chainIdHex, 16)
            : Number(chainIdHex);
        setChainId(newChainId);
        if (globalThis.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(globalThis.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address);
                await fetchBalance(address);
            } catch {
                setBalance(null);
            }
        }
    }, [fetchBalance]);

    useEffect(() => {
        const checkConnection = async () => {
            const hasSession = sessionStorage.getItem('wallet_connected_session') === 'true';
            if (!hasSession) return;

            try {
                const alreadyConnected = await isConnected();
                if (alreadyConnected && globalThis.ethereum) {
                    const provider = new ethers.BrowserProvider(globalThis.ethereum);
                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();
                    const network = await provider.getNetwork();
                    setAccount(address);
                    setChainId(Number(network.chainId));
                    await fetchBalance(address);
                    setWalletConnected(true);
                }
            } catch (err) {
                setError((err as Error).message);
            }
        };
        checkConnection();
    }, [fetchBalance]);

    useEffect(() => {
        if (globalThis.ethereum) {
            setupAccountChangeListener(handleAccountsChanged);
            setupDisconnectListener(handleDisconnect);
            globalThis.ethereum.on('chainChanged', handleChainChanged as (...a: unknown[]) => void);
            return () => {
                cleanupAccountChangeListener(handleAccountsChanged);
                cleanupDisconnectListener(handleDisconnect);
                globalThis.ethereum?.removeListener('chainChanged', handleChainChanged as (...a: unknown[]) => void);
            };
        }
    }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

    const connect = useCallback(async () => {
        setLoading(true);
        setError(null);
        localStorage.removeItem('user_disconnected');
        try {
            const signer = await connectToMetamask();
            const address = await signer.getAddress();
            sessionStorage.setItem('wallet_connected_session', 'true');
            if (globalThis.ethereum) {
                const provider = new ethers.BrowserProvider(globalThis.ethereum);
                const network = await provider.getNetwork();
                setAccount(address);
                setChainId(Number(network.chainId));
                await fetchBalance(address);
                setWalletConnected(true);
            }
        } catch (err) {
            setError((err as Error).message || 'Failed to connect wallet');
        } finally {
            setLoading(false);
        }
    }, [fetchBalance]);

    const switchNetwork = useCallback(async (targetChainId: number) => {
        if (!globalThis.ethereum) { setError('MetaMask is not installed'); return; }
        try {
            await globalThis.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${targetChainId.toString(16)}` }],
            });
        } catch (err) {
            const e = err as { code?: number; message?: string };
            setError(e.code === 4902
                ? 'This network is not available in your MetaMask, please add it'
                : e.message ?? 'Network switch failed');
        }
    }, []);

    const refreshBalance = useCallback(async () => {
        if (!account) return;
        await fetchBalance(account);
    }, [account, fetchBalance]);

    const value = React.useMemo(() => ({
        walletConnected,
        account,
        chainId,
        balance,
        loading,
        error,
        connect,
        disconnect: handleDisconnect,
        switchNetwork,
        refreshBalance,
    }), [
        walletConnected,
        account,
        chainId,
        balance,
        loading,
        error,
        connect,
        handleDisconnect,
        switchNetwork,
        refreshBalance
    ]);

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletState => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
