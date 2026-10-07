# ==============================================================================
# Production Dockerfile for UNO Flip — Monorepo Single-Container Deployment
# ==============================================================================

# Stage 1: Build the React + Vite Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy server dependencies and source
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/

# Copy built client bundle for Express static serving
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/src/index.js"]
