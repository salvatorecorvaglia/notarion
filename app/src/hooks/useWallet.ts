/**
 * Public hook to access the wallet state and actions.
 *
 * This file acts as the stable public API surface for wallet functionality.
 * It re-exports from WalletContext so that consumers are decoupled from the
 * internal context structure — if the context implementation changes (e.g. split
 * into multiple contexts), only this file needs updating.
 *
 * Source of truth: {@link ../context/WalletContext}
 */
export type { WalletState } from '../context/WalletContext';
export { WalletProvider } from '../context/WalletContext';
export { useWallet as default, useWallet } from '../context/WalletContext';
