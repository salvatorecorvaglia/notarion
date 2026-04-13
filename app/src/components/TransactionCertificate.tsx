import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// ── Props ─────────────────────────────────────────────────────────────────────
export interface TransactionCertificateProps {
    fileName: string;
    fileSize: number;
    fileType: string;
    cid: string;
    transactionHash: string;
    walletAddress: string;
    timestamp?: string;
    // i18n strings passed as props to avoid useTranslation in PDF context
    i18n: {
        title: string;
        subtitle: string;
        file_details: string;
        file_name: string;
        file_type: string;
        file_size: string;
        blockchain_details: string;
        ipfs_cid: string;
        transaction_hash: string;
        wallet_address: string;
        timestamp_label: string;
        footer_1: string;
        footer_2: string;
    };
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    logo: {
        width: 140,
    },
    header: {
        marginBottom: 20,
        borderBottom: 2,
        borderBottomColor: '#1a73e8',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    sectionTitle: {
        fontSize: 16,
        marginBottom: 15,
        color: '#1a73e8',
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
        borderBottom: 1,
        borderBottomColor: '#eeeeee',
        paddingBottom: 5,
    },
    label: {
        width: 130,
        fontSize: 11,
        fontWeight: 'bold',
        color: '#333333',
    },
    value: {
        flex: 1,
        fontSize: 10,
        color: '#555555',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 10,
        color: '#999999',
        borderTop: 1,
        borderTopColor: '#eeeeee',
        paddingTop: 10,
    },
    highlight: {
        backgroundColor: '#f0f8ff',
        padding: 5,
        borderRadius: 4,
    },
    qrPlaceholder: {
        width: 100,
        height: 100,
        backgroundColor: '#f0f0f0',
        alignSelf: 'center',
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrLabel: {
        fontSize: 8,
        color: '#999999',
    },
    footerTimestamp: {
        fontSize: 8,
        marginTop: 5,
    },
});

// ── Component ─────────────────────────────────────────────────────────────────
const TransactionCertificate: React.FC<TransactionCertificateProps> = ({
    fileName,
    fileSize,
    fileType,
    cid,
    transactionHash,
    walletAddress,
    timestamp,
    i18n,
}) => {

    const formatDate = (dateValue?: string, includeTime: boolean = false) => {
        const d = dateValue ? new Date(dateValue) : new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        let result = `${dd}-${mm}-${yyyy}`;

        if (includeTime) {
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            // getTimezoneOffset() returns minutes offset from UTC (negative for UTC+)
            const offsetMin = -d.getTimezoneOffset();
            const sign = offsetMin >= 0 ? '+' : '-';
            const absH = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, '0');
            const absM = String(Math.abs(offsetMin) % 60).padStart(2, '0');
            const tz = absM === '00' ? `UTC${sign}${Number(absH)}` : `UTC${sign}${absH}:${absM}`;
            result += ` ${hours}:${minutes}:${seconds} ${tz}`;
        }

        return result;
    };

    const formattedTimestamp = formatDate(timestamp, true);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{i18n.title}</Text>
                        <Text style={styles.subtitle}>{i18n.subtitle}</Text>
                    </View>
                    <Image src={`${globalThis.location.origin}/logo.png`} style={styles.logo} />
                </View>

                {/* File Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.file_details}</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>{i18n.file_name}</Text>
                        <Text style={styles.value}>{fileName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{i18n.file_type}</Text>
                        <Text style={styles.value}>{fileType}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{i18n.file_size}</Text>
                        <Text style={styles.value}>
                            {(fileSize / 1024 / 1024).toFixed(4)} MB
                        </Text>
                    </View>
                </View>

                {/* Blockchain & Storage Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.blockchain_details}</Text>

                    <View style={[styles.row, styles.highlight]}>
                        <Text style={styles.label}>{i18n.ipfs_cid}</Text>
                        <Text style={styles.value}>{cid}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{i18n.transaction_hash}</Text>
                        <Text style={styles.value}>{transactionHash}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{i18n.wallet_address}</Text>
                        <Text style={styles.value}>{walletAddress}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{i18n.timestamp_label}</Text>
                        <Text style={styles.value}>{formattedTimestamp}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        {i18n.footer_1}
                    </Text>
                    <Text>{i18n.footer_2}</Text>
                    <Text style={styles.footerTimestamp}>{formatDate()}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default TransactionCertificate;
