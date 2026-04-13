/** Convert a hex string to a Uint8Array */
export function hexToByteArray(hex: string): Uint8Array {
    if (typeof hex !== 'string' || hex.length % 2 !== 0) {
        throw new Error('Invalid hexadecimal string');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

/** Decode a hex string to UTF-8 text */
export function decodeHexToUTF8(hex: string): string {
    if (typeof hex !== 'string') {
        throw new Error('Input must be a string');
    }
    const byteArray = hexToByteArray(hex);
    return new TextDecoder('utf-8').decode(byteArray);
}

/** Mask an Ethereum address: 0x1234...abcd */
export const maskAddress = (address: string | null | undefined): string => {
    if (!address) return '';
    return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
};
