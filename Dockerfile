FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci --legacy-peer-deps

COPY backend/ .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl dumb-init && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p uploads

ENV NODE_ENV=production

EXPOSE 3000

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node dist/src/main"]
