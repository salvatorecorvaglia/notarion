import React from 'react';
import { useTranslation } from 'react-i18next';

interface UploadProgressProps {
    phase: 'idle' | 'ipfs' | 'blockchain' | 'saving' | 'done';
    progress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ phase, progress }) => {
    const { t } = useTranslation();

    const getProgressText = () => {
        if (phase === 'ipfs') return t('progress.phase_ipfs') + ` (${progress}%)`;
        if (phase === 'blockchain') return t('progress.phase_blockchain');
        if (phase === 'saving') return t('progress.phase_saving');
        // 'done' and 'idle' phases are not shown
        return '';
    };

    if (phase === 'idle' || phase === 'done') return null;

    return (
        <div className="upload-progress">
            <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={getProgressText()}
            >
                <div
                    className={`progress-fill ${phase === 'blockchain' ? 'pulsing' : ''}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p>{getProgressText()}</p>
        </div>
    );
};

export default UploadProgress;
