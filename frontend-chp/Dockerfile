# CHP İstanbul web — Next.js (production)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NODE_ENV=production

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -sf http://127.0.0.1:3000/ >/dev/null || exit 1

# Konteyner içi standart port 3000 (nginx upstream ile uyumlu)
CMD ["npx", "next", "start", "-p", "3000"]
