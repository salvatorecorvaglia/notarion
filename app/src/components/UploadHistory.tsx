import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/axios';
import { IPFS_GATEWAY_URL, SERVER_URL } from '../config';
import { maskAddress } from '../functions';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TransactionCertificate from './TransactionCertificate';
import '../styles/index.css';

interface UploadRecord {
    _id: string;
    cid: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    walletAddress: string;
    transactionHash: string;
    explorerUrl: string;
    blockchainTimestamp?: string;
}

interface UploadHistoryProps {
    address: string | null;
    refreshTrigger?: number;
}

const PAGE_SIZE = 10;

const UploadHistory: React.FC<UploadHistoryProps> = ({ address, refreshTrigger }) => {
    const { t } = useTranslation();
    const [uploads, setUploads] = useState<UploadRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [copiedCID, setCopiedCID] = useState<string | null>(null);
    const tRef = useRef(t);
    useEffect(() => { tRef.current = t; }, [t]);

    // fetchHistory is the stable dependency; refreshTrigger drives re-fetch via useEffect
    const fetchHistory = useCallback(async (currentSkip: number, append: boolean) => {
        if (!address) return;
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(
                `${SERVER_URL}/api/upload/wallet/${address}`,
                { params: { limit: PAGE_SIZE, skip: currentSkip } }
            );
            if (response.data?.success) {
                const fetched: UploadRecord[] = response.data.uploads;
                setUploads((prev) => append ? [...prev, ...fetched] : fetched);
                setHasMore(response.data.pagination?.hasMore ?? false);
            }
        } catch (err) {
            console.error('[UploadHistory] Error fetching history:', err);
            setError(tRef.current('history.fetch_error'));
        } finally {
            setLoading(false);
        }
    }, [address]);

    // Reset pagination and fetch from scratch whenever address or refreshTrigger changes
    useEffect(() => {
        setSkip(0);
        setUploads([]);
        setHasMore(false);
        fetchHistory(0, false);
    }, [address, refreshTrigger, fetchHistory]);

    // Load next page of pagination
    const handleLoadMore = useCallback(() => {
        const nextSkip = skip + PAGE_SIZE;
        setSkip(nextSkip);
        fetchHistory(nextSkip, true);
    }, [skip, fetchHistory]);

    const handleCopyCID = useCallback((cid: string) => {
        navigator.clipboard.writeText(cid).then(() => {
            setCopiedCID(cid);
            setTimeout(() => setCopiedCID(null), 2000);
        }).catch(() => {
            // Clipboard API may fail in non-HTTPS contexts
            console.warn('[UploadHistory] Failed to copy CID to clipboard');
        });
    }, []);

    if (!address) return null;

    return (
        <div className="upload-history-container">
            <h2 className="history-title">{t('history.title')}</h2>

            {/* Visible error message */}
            {error && <p className="history-error">{error}</p>}

            {loading && uploads.length === 0 ? (
                <p className="history-loading">{t('history.loading')}</p>
            ) : uploads.length > 0 ? (
                <>
                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>{t('history.table.name')}</th>
                                    <th>{t('history.table.format')}</th>
                                    <th>{t('history.table.date')}</th>
                                    <th>{t('history.table.cid')}</th>
                                    <th>{t('history.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploads.map((upload) => (
                                    <tr key={upload._id}>
                                        <td title={upload.fileName}>
                                            {upload.fileName ? upload.fileName.substring(0, upload.fileName.lastIndexOf('.')) || upload.fileName : 'N/A'}
                                        </td>
                                        <td className="monospace">
                                            {upload.fileName ? upload.fileName.substring(upload.fileName.lastIndexOf('.') + 1).toUpperCase() : 'N/A'}
                                        </td>
                                        <td>
                                            {upload.blockchainTimestamp && !isNaN(Date.parse(upload.blockchainTimestamp))
                                                ? new Date(upload.blockchainTimestamp).toLocaleDateString()
                                                : 'N/A'}
                                        </td>
                                        <td
                                            className={`monospace cid-cell ${copiedCID === upload.cid ? 'copied' : ''}`}
                                            onClick={() => handleCopyCID(upload.cid)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleCopyCID(upload.cid);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            title={upload.cid}
                                        >
                                            {copiedCID === upload.cid ? (
                                                <span className="copy-badge">{t('history.copy_success')}</span>
                                            ) : (
                                                maskAddress(upload.cid)
                                            )}
                                        </td>
                                        <td className="history-actions">
                                            <a
                                                href={upload.explorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="history-link explorer"
                                                aria-label={`View transaction on Etherscan: ${upload.transactionHash?.substring(0, 10) ?? 'unknown'}...`}
                                            >
                                                {t('history.view_explorer')}
                                            </a>
                                            <a
                                                href={`${IPFS_GATEWAY_URL}/ipfs/${upload.cid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="history-link ipfs"
                                                aria-label={`View file on IPFS gateway: ${upload.fileName}`}
                                            >
                                                {t('history.view_ipfs')}
                                            </a>
                                            <PDFDownloadLink
                                                document={
                                                    <TransactionCertificate
                                                        fileName={upload.fileName}
                                                        fileSize={upload.fileSize}
                                                        fileType={upload.fileType}
                                                        cid={upload.cid}
                                                        transactionHash={upload.transactionHash}
                                                        walletAddress={upload.walletAddress}
                                                        timestamp={upload.blockchainTimestamp}
                                                        i18n={{
                                                            title: t('certificate.title'),
                                                            subtitle: t('certificate.subtitle'),
                                                            file_details: t('certificate.file_details'),
                                                            file_name: t('certificate.file_name'),
                                                            file_type: t('certificate.file_type'),
                                                            file_size: t('certificate.file_size'),
                                                            blockchain_details: t('certificate.blockchain_details'),
                                                            ipfs_cid: t('certificate.ipfs_cid'),
                                                            transaction_hash: t('certificate.transaction_hash'),
                                                            wallet_address: t('certificate.wallet_address'),
                                                            timestamp_label: t('certificate.timestamp'),
                                                            footer_1: t('certificate.footer_1'),
                                                            footer_2: t('certificate.footer_2'),
                                                        }}
                                                    />
                                                }
                                                fileName={`notarion_${upload.fileName || 'file'}.pdf`}
                                                className="history-link explorer"
                                            >
                                                {t('history.view_certificate')}
                                            </PDFDownloadLink>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Load more button */}
                    {hasMore && (
                        <button
                            className="load-more-button"
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            {loading ? t('history.loading') : t('history.load_more')}
                        </button>
                    )}
                </>
            ) : (
                !error && (
                    <div className="history-empty">
                        <p>{t('history.no_uploads')}</p>
                        <div className="history-diagnostic">
                            <small>{t('history.current_address')}:</small>
                            <code style={{ marginLeft: '5px', fontSize: '0.8rem', opacity: 0.8 }}>{address}</code>
                        </div>
                    </div>
                )
            )}

            <button className="refresh-button" onClick={() => { setSkip(0); setUploads([]); fetchHistory(0, false); }} disabled={loading}>
                🔄
            </button>
        </div>
    );
};

export default UploadHistory;
