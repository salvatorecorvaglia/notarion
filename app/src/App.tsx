import React from 'react';
import './styles/app.css';
import './i18n/i18n'; // initialise react-i18next
import UploadIPFS from './components/UploadIPFS';
import UploadHistory from './components/UploadHistory';
import { GlobalNotification } from './components/GlobalNotification';
import { useTranslation } from 'react-i18next';
import { useWallet } from './hooks/useWallet';

const App: React.FC = () => {
    const { t, i18n } = useTranslation();
    const wallet = useWallet();
    const [refreshHistoryTicket, setRefreshHistoryTicket] = React.useState(0);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const handleUploadSuccess = () => {
        setRefreshHistoryTicket((prev) => prev + 1);
    };

    return (
        <div className="App">
            <header className="app-header">
                <div className="header-left">
                    <img src="/logo.png" alt="Logo" className="header-logo" />
                    <h1 className="header-title">{t('app.title')}</h1>
                </div>
                <div className="language-switcher">
                    <button
                        className={`lang-btn ${i18n.language === 'it' ? 'active' : ''}`}
                        onClick={() => changeLanguage('it')}
                        aria-pressed={i18n.language === 'it'}
                    >
                        IT
                    </button>
                    <button
                        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                        onClick={() => changeLanguage('en')}
                        aria-pressed={i18n.language === 'en'}
                    >
                        EN
                    </button>
                </div>
            </header>
            <main className="main-content">
                <UploadIPFS onUploadSuccess={handleUploadSuccess} />
                {wallet.walletConnected && (
                    <UploadHistory address={wallet.account} refreshTrigger={refreshHistoryTicket} />
                )}
            </main>

            <GlobalNotification />
        </div>
    );
};

export default App;
