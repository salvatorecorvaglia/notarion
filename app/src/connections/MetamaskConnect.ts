import { ethers } from 'ethers';

/** Connect to MetaMask and return a Signer */
export const connectToMetamask = async (): Promise<ethers.JsonRpcSigner> => {
    if (!globalThis.ethereum) {
        throw new Error('Please install MetaMask!');
    }
    try {
        const provider = new ethers.BrowserProvider(globalThis.ethereum);
        // Force MetaMask to show the account selection/permission popup
        await globalThis.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
        });
        await globalThis.ethereum.request({ method: 'eth_requestAccounts' });
        return provider.getSigner();
    } catch {
        throw new Error('Failed to connect to MetaMask. Please try again or check if it is installed.');
    }
};

/** Revoke MetaMask permissions to simulate a proper disconnect */
export const disconnectMetamask = async (): Promise<void> => {
    if (!globalThis.ethereum) return;
    try {
        await globalThis.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
        });
    } catch {
        // MetaMask may not support wallet_revokePermissions, fallback to no-op
    }
};

/** Check whether MetaMask already has a connected account */
export const isConnected = async (): Promise<boolean> => {
    if (!globalThis.ethereum) return false;
    try {
        const accounts = (await globalThis.ethereum.request({ method: 'eth_accounts' })) as string[];
        return accounts.length > 0;
    } catch {
        return false;
    }
};

/** Register a listener for account changes */
export const setupAccountChangeListener = (
    callback: (accounts: string[]) => void,
): void => {
    if (globalThis.ethereum) {
        globalThis.ethereum.on('accountsChanged', callback as (...args: unknown[]) => void);
    } else {
        console.warn('MetaMask is not installed, unable to set up account change listener.');
    }
};

/** Unregister a listener for account changes */
export const cleanupAccountChangeListener = (
    callback: (accounts: string[]) => void,
): void => {
    if (globalThis.ethereum) {
        globalThis.ethereum.removeListener('accountsChanged', callback as (...args: unknown[]) => void);
    } else {
        console.warn('MetaMask is not installed, unable to clean up account change listener.');
    }
};

/** Register a listener for provider disconnection */
export const setupDisconnectListener = (
    callback: (error: { code: number; message: string }) => void,
): void => {
    if (globalThis.ethereum) {
        globalThis.ethereum.on('disconnect', callback as (...args: unknown[]) => void);
    }
};

/** Unregister a listener for provider disconnection */
export const cleanupDisconnectListener = (
    callback: (error: { code: number; message: string }) => void,
): void => {
    if (globalThis.ethereum) {
        globalThis.ethereum.removeListener('disconnect', callback as (...args: unknown[]) => void);
    }
};


