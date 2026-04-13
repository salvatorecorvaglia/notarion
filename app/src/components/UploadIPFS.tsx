import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';

import { useWallet } from '../hooks/useWallet';
import { useIpfsUpload } from '../hooks/useIpfsUpload';
import { TxDetails, useBlockchainTx } from '../hooks/useBlockchainTx';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL, STATUS_MESSAGES } from '../constants';
import '../styles/index.css';

import WalletConnector from './WalletConnector';
import FileDropzone from './FileDropzone';
import UploadProgress from './UploadProgress';
import TransactionResult from './TransactionResult';

import type { PendingFile } from '../types';

type UploadPhase = 'idle' | 'ipfs' | 'blockchain' | 'saving' | 'done';

const getStatusVariant = (statusKey: string | null): string => {
    if (!statusKey) return '';
    if (statusKey === STATUS_MESSAGES.SUCCESS || statusKey === STATUS_MESSAGES.CONFIRMING_TX) {
        return 'upload-status--success';
    }
    const errorKeys: string[] = [
        STATUS_MESSAGES.ERROR,
        STATUS_MESSAGES.TX_FAILED,
        STATUS_MESSAGES.IPFS_FAILED,
        STATUS_MESSAGES.TX_CANCELLED,
        STATUS_MESSAGES.INSUFFICIENT_FUNDS,
        STATUS_MESSAGES.INVALID_FILE_TYPE,
        STATUS_MESSAGES.FILE_TOO_LARGE,
        STATUS_MESSAGES.FILE_ALREADY_EXISTS,
    ];
    if (errorKeys.includes(statusKey)) {
        return 'upload-status--error';
    }
    return 'upload-status--info';
};

interface UploadIPFSProps {
    onUploadSuccess?: () => void;
}

const UploadIPFS: React.FC<UploadIPFSProps> = ({ onUploadSuccess }) => {
    const { t } = useTranslation();
    const wallet = useWallet();
    const ipfs = useIpfsUpload();
    const blockchain = useBlockchainTx();

    const [file, setFile] = useState<(File & { preview?: string }) | null>(null);
    const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
    const [txDetails, setTxDetails] = useState<TxDetails | null>(null);
    const [pendingCid, setPendingCid] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
    const [statusKey, setStatusKey] = useState<string | null>(null);
    const [utf8String, setUtf8String] = useState('');
    const [pendingSaveDetails, setPendingSaveDetails] = useState<TxDetails | null>(null);
    const requestInProgress = useRef(false);

    // Reset all upload state to initial values
    const resetUploadState = useCallback(() => {
        setFile(null);
        setStatusKey(null);
        setUploadPhase('idle');
        setTxDetails(null);
        setUtf8String('');
        blockchain.setTxHash('');
        updatePendingState(null, null);
    }, [blockchain]);

    // Persist pending state
    useEffect(() => {
        const savedCid = sessionStorage.getItem('pendingCid');
        const savedFile = sessionStorage.getItem('pendingFile');
        if (savedCid && savedFile) {
            try {
                setPendingCid(savedCid);
                setPendingFile(JSON.parse(savedFile));
            } catch (e) {
                console.error('Failed to parse pendingFile', e);
                sessionStorage.removeItem('pendingCid');
                sessionStorage.removeItem('pendingFile');
            }
        }

        const savedPendingSave = localStorage.getItem('pendingSaveDetails');
        if (savedPendingSave) {
            try {
                const details = JSON.parse(savedPendingSave);
                setPendingSaveDetails(details);
                setUtf8String(details.cid);
            } catch (e) {
                console.error('Failed to parse pendingSaveDetails', e);
                localStorage.removeItem('pendingSaveDetails');
            }
        }
    }, []);

    const updatePendingState = (cid: string | null, meta: PendingFile | null) => {
        setPendingCid(cid);
        setPendingFile(meta);
        if (cid && meta) {
            sessionStorage.setItem('pendingCid', cid);
            sessionStorage.setItem('pendingFile', JSON.stringify(meta));
        } else {
            sessionStorage.removeItem('pendingCid');
            sessionStorage.removeItem('pendingFile');
        }
    };

    const updatePendingSaveState = (details: TxDetails | null) => {
        setPendingSaveDetails(details);
        if (details) {
            localStorage.setItem('pendingSaveDetails', JSON.stringify(details));
        } else {
            localStorage.removeItem('pendingSaveDetails');
        }
    };

    // Sync status messages from hooks
    useEffect(() => {
        if (ipfs.statusKey) setStatusKey(ipfs.statusKey);
    }, [ipfs.statusKey]);

    useEffect(() => {
        if (blockchain.statusKey) setStatusKey(blockchain.statusKey);
    }, [blockchain.statusKey]);

    // Reset on disconnect
    useEffect(() => {
        if (!wallet.walletConnected) {
            resetUploadState();
        }
    }, [wallet.walletConnected, resetUploadState]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0] as File & { preview?: string };
        if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
            return setStatusKey(STATUS_MESSAGES.INVALID_FILE_TYPE);
        }
        if (selectedFile.size > MAX_FILE_SIZE) {
            return setStatusKey(STATUS_MESSAGES.FILE_TOO_LARGE);
        }
        selectedFile.preview = URL.createObjectURL(selectedFile);
        setFile(selectedFile);
        setStatusKey(null);
        setUploadPhase('idle');
        setTxDetails(null);
        setUtf8String('');
        blockchain.setTxHash('');
        updatePendingState(null, null);
    }, [blockchain]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleTransaction = useCallback(async (cid: string, meta: PendingFile) => {
        setUploadPhase('blockchain');
        const result = await blockchain.sendTransaction(cid, meta);
        if (result) {
            const { details, saved } = result;
            setUploadPhase(saved ? 'done' : 'idle');
            setTxDetails(details);
            setUtf8String(cid);

            if (!saved) {
                updatePendingSaveState(details);
            } else {
                updatePendingSaveState(null);
                if (onUploadSuccess) onUploadSuccess();
            }

            setFile(null);
            updatePendingState(null, null);
        } else {
            setUploadPhase('idle');
        }
    }, [blockchain, onUploadSuccess]);

    const handleRetrySave = useCallback(async () => {
        if (!pendingSaveDetails) return;
        setUploadPhase('saving');
        const success = await blockchain.saveToDatabase(pendingSaveDetails);
        if (success) {
            setUploadPhase('done');
            setTxDetails(pendingSaveDetails);
            updatePendingSaveState(null);
            if (onUploadSuccess) onUploadSuccess();
        } else {
            setUploadPhase('idle');
        }
    }, [pendingSaveDetails, blockchain, onUploadSuccess]);

    const handleUpload = useCallback(async () => {
        if (!wallet.walletConnected) return setStatusKey(STATUS_MESSAGES.CONNECT_WALLET);
        if (!file) return setStatusKey(STATUS_MESSAGES.UPLOAD_FILE);
        if (requestInProgress.current) return; // Prevent double-click

        requestInProgress.current = true;
        setUploadPhase('ipfs');
        const result = await ipfs.uploadFile(file);

        if (result) {
            updatePendingState(result.cid, result.meta);
            await handleTransaction(result.cid, result.meta);
        } else {
            setUploadPhase('idle');
        }
        requestInProgress.current = false;
    }, [wallet.walletConnected, file, ipfs, handleTransaction]);

    const handleRetry = useCallback(async () => {
        if (pendingCid && pendingFile) {
            await handleTransaction(pendingCid, pendingFile);
        }
    }, [pendingCid, pendingFile, handleTransaction]);

    const handleRemoveFile = useCallback(() => {
        resetUploadState();
    }, [resetUploadState]);

    useEffect(() => () => { if (file?.preview) URL.revokeObjectURL(file.preview); }, [file]);

    const getProgress = () => {
        if (uploadPhase === 'ipfs') return ipfs.uploadProgress;
        if (uploadPhase === 'blockchain') return 70;
        if (uploadPhase === 'saving') return 95;
        if (uploadPhase === 'done') return 100;
        return 0;
    };

    const progress = getProgress();

    const loading = ['ipfs', 'blockchain', 'saving'].includes(uploadPhase);
    const hasPendingCid = Boolean(pendingCid);
    const canUpload = wallet.walletConnected && file && !loading && !hasPendingCid;
    const canRetryTx = wallet.walletConnected && hasPendingCid && !loading;

    return (
        <div className="document-upload-container">
            <WalletConnector
                walletConnected={wallet.walletConnected}
                account={wallet.account || ''}
                loading={wallet.loading}
                connect={wallet.connect}
                disconnect={wallet.disconnect}
                error={wallet.error}
            />

            <FileDropzone
                isDragActive={isDragActive}
                getRootProps={getRootProps}
                getInputProps={getInputProps}
            />

            {file && (
                <div className="file-details">
                    <h3>{t('file.selected_title')}</h3>
                    <p><strong>{t('file.name')}:</strong> {file.name}</p>
                    <p><strong>{t('file.type')}:</strong> {file.type}</p>
                    <p><strong>{t('file.size')}:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    {file.type.startsWith('image/') && file.preview && (
                        <div className="file-preview">
                            <img src={file.preview} alt="Preview" />
                        </div>
                    )}
                    <button
                        className="remove-file-button"
                        onClick={handleRemoveFile}
                        disabled={loading}
                    >
                        🗑️ {t('file.remove')}
                    </button>
                </div>
            )}

            <button className="upload-button" onClick={handleUpload} disabled={!canUpload}>
                {loading && !hasPendingCid ? `⏳ ${t('buttons.uploading')}` : `🚀 ${t('buttons.upload')}`}
            </button>

            {canRetryTx && (
                <div className="pending-cid-section">
                    <p className="pending-cid-hint">
                        {t('status.pending_cid_hint', { cid: pendingCid?.substring(0, 12) })}
                    </p>
                    <button className="upload-button retry-tx-button" onClick={handleRetry}>
                        🔄 {t('buttons.retry_tx')}
                    </button>
                </div>
            )}

            {pendingSaveDetails && !loading && (
                <div className="pending-cid-section pending-save-section">
                    <p className="pending-cid-hint">
                        {t('status.pending_save_hint', { tx: pendingSaveDetails.transactionHash.substring(0, 12) })}
                    </p>
                    <button className="upload-button retry-tx-button" onClick={handleRetrySave}>
                        🔄 {t('buttons.retry_db_save')}
                    </button>
                </div>
            )}

            <UploadProgress
                phase={uploadPhase}
                progress={progress}
            />

            {statusKey && (
                <p className={`upload-status ${getStatusVariant(statusKey)}`}>
                    {t(statusKey, { maxSize: MAX_FILE_SIZE_LABEL })}
                </p>
            )}

            <TransactionResult
                transactionHash={blockchain.txHash}
                utf8String={utf8String}
                txDetails={txDetails}
            />
        </div>
    );
};

export default UploadIPFS;
