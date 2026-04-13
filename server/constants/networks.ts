/**
 * Mapping of Ethereum networks to their Etherscan explorer base URLs.
 * Keep in sync with app/src/constants/networks.tsx.
 */
export const EXPLORER_BASE: Record<string, string> = {
    mainnet: 'https://etherscan.io',

    // Current Ethereum testnets
    sepolia: 'https://sepolia.etherscan.io',
    holesky: 'https://holesky.etherscan.io'
};
