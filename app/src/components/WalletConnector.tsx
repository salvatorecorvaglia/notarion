import React from 'react';
import { useTranslation } from 'react-i18next';
import { maskAddress } from '../functions';

interface WalletConnectorProps {
    walletConnected: boolean;
    account: string;
    loading: boolean;
    connect: () => void;
    disconnect: () => void;
    error?: string | null;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({
    walletConnected,
    account,
    loading,
    connect,
    disconnect,
    error,
}) => {
    const { t } = useTranslation();

    return (
        <div className="wallet-connection">
            {walletConnected ? (
                <div className="connected-account">
                    <p>
                        <span aria-hidden="true">🔗</span>{' '}
                        {t('wallet.connected_account')}: {maskAddress(account)}
                    </p>
                    <button className="disconnect-button" type="button" onClick={disconnect}>
                        {t('wallet.disconnect')}
                    </button>
                </div>
            ) : (
                <>
                    <button
                        className="connect-button"
                        type="button"
                        onClick={connect}
                        disabled={loading}
                    >
                        {loading ? `⏳ ${t('wallet.connect')}` : (
                            <>
                                <span aria-hidden="true">🦊</span>{' '}
                                {t('wallet.connect')}
                            </>
                        )}
                    </button>
                    {error && <p className="wallet-error">{error}</p>}
                </>
            )}
        </div>
    );
};

export default WalletConnector;
