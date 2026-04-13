import React from 'react';
import { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

interface FileDropzoneProps {
    isDragActive: boolean;
    getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
    getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
}

const CloudUploadIcon: React.FC<{ active: boolean }> = ({ active }) => (
    <svg
        className="dropzone-icon"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#8b5cf6' : '#64748b'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
);

const FileDropzone: React.FC<FileDropzoneProps> = ({
    isDragActive,
    getRootProps,
    getInputProps,
}) => {
    const { t } = useTranslation();

    return (
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <CloudUploadIcon active={isDragActive} />
            <p>{isDragActive ? t('dropzone.drop_active') : t('dropzone.idle')}</p>
        </div>
    );
};

export default FileDropzone;
