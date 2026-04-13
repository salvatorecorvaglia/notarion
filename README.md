# Notarion - Distributed Ledger Technologies Validation

A full-stack decentralized application (dApp) that enables secure file uploads to a local IPFS node, anchors the Content Identifier (CID) on the blockchain, and maintains metadata in MongoDB. Built with **React + TypeScript**, **Node.js + TypeScript**, and Web3 technologies.

## ✨ Features

🔒 **Enhanced Security**: API keys safely stored on backend with magic-byte MIME validation
📊 **Upload Progress**: Real-time progress tracking for file uploads
🔍 **Advanced Queries**: Retrieve uploads by CID, wallet address, or pagination
🐳 **Docker Ready**: Complete Docker Compose setup with all services running
📜 **Transaction Certificate**: Download a PDF certificate after each upload
⛓️ **Burn Address Anchoring**: CID stored on-chain via burn address — no MetaMask security warnings
🔄 **Blockchain Retry**: If the MetaMask tx is rejected, retry without re-uploading to IPFS
💾 **Database Save Retry**: If the DB save fails after a successful blockchain tx, a "Retry DB Save" button appears
📜 **Upload History**: View all previous uploads for your connected wallet (case-insensitive)
⚡ **Full TypeScript**: Frontend and backend, powered by **Vite**
🌍 **Internationalization**: Dual-language support (Italian/English) via `react-i18next`
🧩 **Service Layer**: Business logic isolated in `services/` for clean, testable code
💡 **Global Notifications**: App-wide toast notifications
🗜️ **HTTP Compression**: gzip/brotli response compression
💾 **Persistent State**: `sessionStorage` for pending CID, `localStorage` for pending DB save — retry works even after wallet disconnect or page refresh
🛡️ **Error Boundary**: App-wide error boundary catches runtime errors gracefully
🔍 **Duplicate Prevention**: Backend CID checks prevent re-uploading and paying gas fees for duplicate files
📂 **Drag & Drop**: User-friendly file upload with drag-and-drop (`FileDropzone.tsx`)
🌐 **IPFS Web UI & MFS**: Uploads linked to IPFS Mutable File System, visible in Kubo Web UI

## 🚀 Quick Start

### Prerequisites

- Node.js (v20 recommended)
- npm
- Docker and Docker Compose
- MetaMask browser extension

### Option 1: Docker (Recommended — Full Stack)

All services (MongoDB, IPFS, backend, frontend) are fully configured in `docker-compose.yml` and ready to run:

```bash
# 1. Clone the repository
git clone <repository-url>
cd notarion

# 2. Create .env from example
cp .env.example .env

# 3. Edit .env and customize your environment if needed

# 4. Start all services
docker compose up -d

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5002
# IPFS Web UI: http://127.0.0.1:5001/webui
# MongoDB: localhost:27017 (bound to 127.0.0.1 only)
```

> The frontend container runs nginx on port **80** internally. The Docker port mapping is `3000:80`. All `/api` requests are proxied to the backend.

### Option 2: Manual Setup (Development)

**Start Infrastructure (Docker):**
```bash
docker compose up -d mongodb ipfs
```

**Backend:**
```bash
cd server
npm install
npm start           # nodemon + ts-node --transpile-only (dev with hot-reload)
npm run type-check  # tsc --noEmit (verify types without compiling)
# or for production:
npm run build       # tsc → dist/
npm run start:prod  # tsc && NODE_ENV=production node dist/server.js
```

**Frontend:**
```bash
cd app
npm install
npm start           # Vite dev server (port 3000, auto-opens browser)
# or for production:
npm run build       # tsc + vite build → dist/
npm run preview     # Preview production build locally
```

## 🔧 API Documentation

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/ipfs` | Upload file to IPFS (multipart/form-data, magic-byte validation) |
| `POST` | `/api/upload` | Save upload metadata to MongoDB |
| `GET` | `/api/upload/cid/:cid` | Get upload by CID |
| `GET` | `/api/upload/wallet/:address` | Get uploads by wallet (paginated) |
| `GET` | `/api/upload` | Get all uploads (paginated) |
| `GET` | `/health` | Health check (minimal in production, detailed in development) |

**Rate Limiting:**
- Generic: 100 requests per 15 minutes per IP
- IPFS upload: 10 requests per 15 minutes per IP

**CORS:** Configurable via `ALLOWED_ORIGINS` env var (default: `http://localhost:3000,http://localhost:3001`). Fully open in development mode.

**Error Codes:** `ERR_VALIDATION`, `ERR_NOT_FOUND`, `ERR_DUPLICATE`, `ERR_IPFS_UPLOAD`, `ERR_FILE_MISSING`, `ERR_FILE_TYPE`, `ERR_FILE_SIZE`, `ERR_CORS`, `ERR_RATE_LIMIT`, `ERR_INTERNAL`

### Upload Flow

1. **File Selection**: User selects or drops a file (PDF, PNG, JPEG, JSON, ZIP, MP4)
2. **Client Validation**: File type and size checked (max 100 MB)
3. **Wallet Connection**: MetaMask connection required (via `WalletContext`)
4. **Stage 1 — IPFS Upload**: File uploaded to the local IPFS node via backend; server validates MIME (header + magic bytes); CID saved as `pendingCid` in `sessionStorage`
5. **Duplicate Check**: The app queries the backend (`GET /api/upload/cid/:cid`). If the file already exists, the upload stops here to save gas fees.
6. **Stage 2 — Blockchain Transaction**: CID hexlified and sent as calldata to burn address `0x000...dEaD` with `value: 0` — immutable on-chain proof
7. **Database Storage**: Metadata (CID, wallet, tx hash, file info) saved to MongoDB
8. **Confirmation**: Transaction hash, IPFS gateway link, and downloadable **Transaction Certificate PDF**

> **Retry Logic:** If the MetaMask tx is rejected at step 6, the `pendingCid` is preserved and a **Retry Transaction** button appears — no need to re-upload to IPFS. If the database save fails at step 7, pending details are stored in `localStorage` and a **Retry DB Save** button appears.

## 🌍 Internationalisation

All user-facing strings are localized in `app/src/i18n/it.json` (Italian) and `app/src/i18n/en.json` (English).
The app uses [react-i18next](https://react.i18next.com/) with automatic browser language detection and Italian as the default fallback.

To add a new language:
1. Create `app/src/i18n/<code>.json` (same keys as `it.json` and `en.json`)
2. Add it as a resource in `app/src/i18n/i18n.ts`

## 🔐 Security Features

- **Backend Security**: Only the backend communicates with the local IPFS node's API.
- **Magic-Byte MIME Validation**: File content verified with `file-type` in addition to the declared MIME type
- **File Validation**: Strict file type and size validation (client + server)
- **Input Sanitization**: Server-side validation via `express-validator`
- **HTTP Security**: Helmet middleware for secure HTTP headers
- **Rate Limiting**: Protection against brute-force and DoS attacks — 100 requests / 15 min (generic) and 10 requests / 15 min (IPFS upload)
- **CORS Configuration**: Configurable allowed origins (default: `http://localhost:3000`); fully open in development
- **Error Handling**: Comprehensive error handling without information leakage
- **Blockchain Retry**: CID preserved after IPFS upload so users can retry the tx without re-uploading
- **TypeScript**: End-to-end type safety reduces entire classes of runtime bugs
- **HTTP Compression**: gzip/brotli via `compression` middleware
- **Zod Validation**: Strict runtime validation of environment variables at startup
- **Graceful Shutdown**: Race-condition-free shutdown with 10s timeout for cleanup
- **Health Endpoint**: Returns minimal info in production to prevent info leakage

## 🌐 Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

### Docker / MongoDB
| Variable | Description | Default |
|---|---|---|
| `MONGO_INITDB_ROOT_USERNAME` | MongoDB admin username | `admin` |
| `MONGO_INITDB_ROOT_PASSWORD` | MongoDB admin password | `admin` |

### Backend
| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5002` |
| `NODE_ENV` | `development`, `production`, or `test` | `development` |
| `TZ` | Timezone | `Europe/Rome` |
| `MONGO_URI` | MongoDB connection string | — (required) |
| `ETH_NETWORK` | Ethereum network name (`mainnet`, `sepolia`, `holesky`) | — (optional) |
| `IPFS_API_URL` | Local IPFS API URL | `http://localhost:5001` |
| `IPFS_GATEWAY_URL` | Public IPFS Gateway URL | `http://localhost:8080` |
| `IPFS_TIMEOUT` | IPFS upload timeout in ms | `60000` |
| `IPFS_MAX_RETRIES` | Max retry attempts for IPFS upload | `2` |
| `MAX_FILE_SIZE` | Max file size in bytes | `104857600` (100 MB) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000,http://localhost:3001` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max generic requests per window | `100` |
| `IPFS_RATE_LIMIT_WINDOW_MS` | Rate-limit window for IPFS uploads in ms | `900000` |
| `IPFS_RATE_LIMIT_MAX_REQUESTS` | Max IPFS upload requests per window | `10` |

### Frontend (`VITE_*`)
| Variable | Description | Default |
|---|---|---|
| `VITE_SERVER_URL` | Backend URL | `http://localhost:5002` |
| `VITE_IPFS_GATEWAY_URL` | IPFS gateway URL | `http://localhost:8080` |

## 🧰 Development Scripts

### Frontend (`app/`)
```bash
npm start          # Vite dev server (port 3000, auto-opens browser)
npm run build      # Production bundle (tsc + vite build)
npm run preview    # Preview production build
npm run lint       # ESLint
npm run lint:fix   # ESLint with auto-fix
npm run format     # Prettier
```

### Backend (`server/`)
```bash
npm start          # nodemon + ts-node --transpile-only (dev, hot-reload)
npm run build      # tsc → dist/
npm run start:prod # NODE_ENV=production node dist/server.js
npm run type-check # tsc --noEmit (verify types without compiling)
npm test           # Jest test suite (supertest + mongodb-memory-server)
npm run test:coverage # Jest with coverage report
npm run lint       # ESLint (flat config)
npm run lint:fix   # ESLint with auto-fix
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚖️ License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## 📝 Author

**Salvatore Corvaglia**

- GitHub: [@salvatorecorvaglia](https://github.com/salvatorecorvaglia)
