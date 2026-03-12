FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache wget openssl openssl-dev

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package*.json ./

USER node

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --spider -q http://localhost:5001/health || exit 1

CMD ["sh", "-c", "npx prisma db push && node src/server.js"]
