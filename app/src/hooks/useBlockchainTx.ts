import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import apiClient from '../api/axios';
import { STATUS_MESSAGES, TIMEOUTS } from '../constants';
import { getStatusMessageKey, parseError } from '../errors/errorUtils';

export interface TxDetails {
    cid: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    walletAddress: string;
    transactionHash: string;
    blockchainTimestamp?: string;
}

export const useBlockchainTx = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusKey, setStatusKey] = useState<string | null>(null);
    const [txHash, setTxHash] = useState('');

    const saveToDatabase = useCallback(async (details: TxDetails) => {
        setStatusKey(STATUS_MESSAGES.CONFIRMING_TX);
        try {
            // apiClient has baseURL: SERVER_URL configured, so relative path is used here
            await apiClient.post('/api/upload', details, { timeout: TIMEOUTS.DATABASE_SAVE });
            setStatusKey(STATUS_MESSAGES.SUCCESS);
            return true;
        } catch (error) {
            console.error('[BlockchainTx] Database save failed:', error);
            setStatusKey(STATUS_MESSAGES.TX_SUCCESS_DB_FAILED);
            return false;
        }
    }, []);

    const sendTransaction = useCallback(async (cid: string, meta: { name: string; size: number; type: string }) => {
        if (!globalThis.ethereum) return null;

        setIsProcessing(true);
        setStatusKey(STATUS_MESSAGES.SAVING_BLOCKCHAIN);

        try {
            const provider = new ethers.BrowserProvider(globalThis.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            const transaction = await signer.sendTransaction({
                to: '0x000000000000000000000000000000000000dEaD',
                value: 0,
                data: ethers.hexlify(ethers.toUtf8Bytes(cid)),
            });

            setStatusKey(STATUS_MESSAGES.CONFIRMING_TX);
            const receipt = await new Promise<ethers.TransactionReceipt>((resolve, reject) => {
                const timer = setTimeout(
                    () => reject(new Error('Transaction confirmation timeout')),
                    TIMEOUTS.BLOCKCHAIN_TX
                );
                transaction.wait()
                    .then((r) => {
                        clearTimeout(timer);
                        if (r === null) {
                            reject(new Error('Transaction receipt is null'));
                            return;
                        }
                        resolve(r);
                    })
                    .catch((e) => {
                        clearTimeout(timer);
                        reject(e);
                    });
            });

            if (receipt?.status !== 1) {
                setStatusKey(STATUS_MESSAGES.TX_FAILED);
                setIsProcessing(false);
                return null;
            }

            // Fetch the block to get the actual timestamp
            let blockchainTimestamp = new Date().toISOString();
            try {
                const block = await provider.getBlock(receipt.blockNumber);
                if (block?.timestamp) {
                    // block.timestamp is in seconds, convert to milliseconds for Date
                    blockchainTimestamp = new Date(Number(block.timestamp) * 1000).toISOString();
                }
            } catch (blockError) {
                console.error('[BlockchainTx] Failed to fetch block timestamp:', blockError);
                // Fallback to current time if block fetch fails
            }

            const details: TxDetails = {
                cid: cid,
                fileName: meta.name,
                fileSize: meta.size,
                fileType: meta.type,
                walletAddress: address,
                transactionHash: transaction.hash,
                blockchainTimestamp: blockchainTimestamp,
            };

            setTxHash(transaction.hash);
            const saved = await saveToDatabase(details);

            setIsProcessing(false);
            // Return details even if save failed, so UI can handle retry
            return { details, saved };
        } catch (error) {
            setStatusKey(getStatusMessageKey(parseError(error)));
            setIsProcessing(false);
            return null;
        }
    }, [saveToDatabase]);

    return { sendTransaction, saveToDatabase, isProcessing, statusKey, txHash, setStatusKey, setTxHash };
};
