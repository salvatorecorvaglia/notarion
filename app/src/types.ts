// ── Shared application types ───────────────────────────────────────────────

/** Metadata of a file that has been uploaded to IPFS but awaits a blockchain TX. */
export interface PendingFile {
    name: string;
    size: number;
    type: string;
}
