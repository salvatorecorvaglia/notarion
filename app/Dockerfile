# Stage 1: Build (TypeScript compilation + Vite build)
FROM node:20.11-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (incl. devDeps for TypeScript)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Add build args for Vite
ARG VITE_SERVER_URL
ARG VITE_IPFS_GATEWAY_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_IPFS_GATEWAY_URL=$VITE_IPFS_GATEWAY_URL

# Build the React application (Vite compiles TS → JS)
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine

# Copy built static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration for API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
