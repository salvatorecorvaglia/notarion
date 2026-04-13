# Stage 1: Build (TypeScript → JavaScript)
FROM node:20.11-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install ALL dependencies (devDeps needed for tsc)
RUN npm ci

# Copy source files
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Prune devDependencies so node_modules is production-ready
RUN npm prune --omit=dev

# Stage 2: Production runtime (JS only — no TypeScript compiler needed)
FROM node:20.11-alpine AS production

WORKDIR /app

# Copy pruned node_modules and compiled output directly from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Expose port
EXPOSE 5002

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5002/health || exit 1

# Start the compiled server
USER nodejs
CMD ["node", "dist/server.js"]
