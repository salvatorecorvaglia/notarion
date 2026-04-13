import React from 'react';
import { useTranslation } from 'react-i18next';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TransactionCertificate from './TransactionCertificate';
import { IPFS_GATEWAY_URL } from '../config';

interface TransactionResultProps {
    transactionHash: string;
    utf8String: string;
    txDetails: {
        cid: string;
        fileName: string;
        fileSize: number;
        fileType: string;
        walletAddress: string;
        transactionHash: string;
        blockchainTimestamp?: string;
    } | null;
}

const TransactionResult: React.FC<TransactionResultProps> = ({
    transactionHash,
    utf8String,
    txDetails,
}) => {
    const { t } = useTranslation();

    if (!transactionHash) return null;

    return (
        <div className="transaction-details">
            <p className="transaction-hash">
                <button
                    className="disconnect-button"
                    onClick={() => {
                        globalThis.open(`${IPFS_GATEWAY_URL}/ipfs/${utf8String}`, '_blank');
                    }}
                >
                    🌐 {t('buttons.view_ipfs')}
                </button>
            </p>
            {txDetails && (
                <div className="certificate-section">
                    <PDFDownloadLink
                        document={
                            <TransactionCertificate
                                {...txDetails}
                                timestamp={txDetails.blockchainTimestamp}
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
                        fileName={`transaction-certificate-${transactionHash.substring(0, 8)}.pdf`}
                        className="upload-button certificate-download-link"
                    >
                        {({ loading }) =>
                            loading
                                ? `⏳ ${t('buttons.generating_certificate')}`
                                : `📄 ${t('buttons.download_certificate')}`
                        }
                    </PDFDownloadLink>
                </div>
            )}
        </div>
    );
};

export default TransactionResult;
