# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application code
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck and OpenSSL for Prisma
RUN apk add --no-cache curl wget openssl openssl-dev

# Copy node_modules and application from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package*.json ./

# Create directories for uploads and logs
RUN mkdir -p /app/uploads /app/logs && \
    chown -R node:node /app

# Use non-root user
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --spider -q http://localhost:5000/health || exit 1

# Start application
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed && node src/server.js"]
