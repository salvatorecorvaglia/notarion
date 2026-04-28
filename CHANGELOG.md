# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-28

### Added

- **Full-stack dApp architecture**: React + Vite frontend and Node.js + Express backend.
- **IPFS Integration**: Secure file uploads to local IPFS node with magic-byte MIME validation.
- **Blockchain Anchoring**: CID anchoring on Ethereum via burn address for immutable proof.
- **Metadata Persistence**: MongoDB storage for upload history and metadata.
- **Retry Mechanism**: Robust client-side retry logic for blockchain transactions and database saves.
- **Transaction Certificates**: Automatic PDF generation for successful notarizations.
- **Multilingual Support**: English and Italian localization via `react-i18next`.
- **Docker Support**: Full Docker Compose configuration for all services (MongoDB, IPFS, API, UI).
- **Security Features**: Rate limiting, Helmet security headers, and strict input validation via Zod and express-validator.
- **Documentation**: Comprehensive README, Contributing guidelines, and Security policy.
