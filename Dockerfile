# Production Dockerfile for ASPL 2026 Backend (Hugging Face Spaces / Cloud Container)
FROM node:20-slim

# Install OpenSSL and CA certificates required for Prisma & HTTPS connections
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency definitions and Prisma schema first for efficient Docker layer caching
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client for Linux
RUN npm install --include=dev
RUN npx prisma generate

# Copy application source code
COPY src ./src/
COPY scripts ./scripts/

# Create non-root directories and set permissions for security (Hugging Face default user 1000)
RUN mkdir -p /app/baileys_auth_info && chown -R node:node /app

# Switch to standard non-root user
USER node

# Hugging Face Spaces exposes port 7860 by default
ENV PORT=7860
ENV NODE_ENV=production
EXPOSE 7860

# Start Express + Socket.IO server using tsx
CMD ["node", "node_modules/tsx/dist/cli.mjs", "src/server/index.ts"]
