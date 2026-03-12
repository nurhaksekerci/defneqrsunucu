FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER node

EXPOSE 5004

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:5004/health || exit 1

CMD ["node", "src/server.js"]
