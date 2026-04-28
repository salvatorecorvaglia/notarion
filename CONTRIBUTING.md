# Contributing to notarion 📜

Thank you for your interest in contributing to `notarion`! We appreciate all contributions, from bug reports to new features and documentation improvements.

## 🌈 How to Contribute

### Reporting Bugs 🐛

Before opening a new issue, please check the [existing issues](https://github.com/salvatorecorvaglia/notarion/issues). If the bug hasn't been reported:

- Open a new issue with a clear, descriptive title.
- Provide steps to reproduce the bug.
- Include information about your environment (Node.js version, Docker version, Browser).
- Attach screenshots if applicable.

### Feature Requests 💡

Have a great idea for `notarion`?

- Search the [issues](https://github.com/salvatorecorvaglia/notarion/issues) to see if it's already been proposed.
- Open a new issue explaining the feature and why it would be valuable.

### Pull Requests 🚀

1. **Fork** the repository and create your branch from `main`.
2. **Install dependencies**:
    - For the backend: `cd server && npm install`
    - For the frontend: `cd app && npm install`
3. **Environment Setup**: Copy `.env.example` to `.env` in the root directory and configure the variables.
4. **Develop**:
    - Use `docker compose up -d` to start required infrastructure (MongoDB, IPFS).
    - Backend: `cd server && npm start`
    - Frontend: `cd app && npm start`
5. **Quality Check**:
    - Ensure backend tests pass: `cd server && npm test`
    - Check types: `cd server && npm run type-check`
    - Lint your code: `npm run lint` in both `app` and `server`.
6. **Commit**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat(server): add support for new CID format` or `fix(app): resolve UI jitter on mobile`).
7. **Submit**: Push to your fork and create a Pull Request to the `main` branch.

## 🛠️ Project Structure

`notarion` is a full-stack dApp:

- `/app`: Frontend React application (Vite).
- `/server`: Backend Node.js API (Express + TypeScript).
- `/docker-compose.yml`: Infrastructure orchestration (MongoDB, Kubo IPFS).

## 🏛️ Useful Scripts

### Backend (`server/`)

- `npm start`: Development mode with hot-reload.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm test`: Run Jest tests.
- `npm run type-check`: Verify TypeScript types.

### Frontend (`app/`)

- `npm start`: Start Vite development server.
- `npm run build`: Create production build.
- `npm run lint`: Run ESLint.

## 📜 Code of Conduct

Please maintain a respectful and welcoming environment for all contributors.

---

Happy coding! 🐦‍⬛
