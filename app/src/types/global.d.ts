/** Augment globalThis with MetaMask's ethereum provider */
declare global {
    var ethereum: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        on: (event: string, callback: (...args: unknown[]) => void) => void;
        removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    } | undefined;
}

export {};
