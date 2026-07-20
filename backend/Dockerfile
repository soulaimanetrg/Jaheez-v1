FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ─── Production stage ───────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S jaheez -u 1001

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R jaheez:nodejs /app

# Switch to non-root user
USER jaheez

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3002

# Start the application
CMD ["node", "dist/server.js"]
