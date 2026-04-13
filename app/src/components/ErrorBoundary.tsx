import React, { ErrorInfo, PropsWithChildren } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import '../styles/index.css';

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

type Props = PropsWithChildren<WithTranslation>;

class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null, errorInfo: null };

    static getDerivedStateFromError(): Pick<State, 'hasError'> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        const { t } = this.props;
        if (this.state.hasError) {
            return (
                <div className="error-boundary-overlay">
                    <div className="error-boundary-card">
                        <h1 className="error-boundary-title">
                            {t('error_boundary.title')}
                        </h1>
                        <p className="error-boundary-description">
                            {t('error_boundary.description')}
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <details className="error-boundary-details">
                                <summary>
                                    {t('error_boundary.details_summary')}
                                </summary>
                                <pre className="error-boundary-stack">
                                    {this.state.error.toString()}
                                </pre>
                                {this.state.errorInfo && (
                                    <pre className="error-boundary-component-stack">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </details>
                        )}
                        <div className="error-boundary-actions">
                            <button
                                className="error-boundary-btn-retry"
                                onClick={this.handleReset}
                            >
                                {t('buttons.try_again')}
                            </button>
                            <button
                                className="error-boundary-btn-home"
                                onClick={() => { globalThis.location.href = '/'; }}
                            >
                                {t('buttons.go_home')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default withTranslation()(ErrorBoundary);
