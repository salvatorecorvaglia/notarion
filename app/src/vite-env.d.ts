/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SERVER_URL: string
    readonly VITE_IPFS_GATEWAY_URL: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

interface Window {
    ethereum?: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        on: (event: string, callback: (...args: unknown[]) => void) => void;
        removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
}
