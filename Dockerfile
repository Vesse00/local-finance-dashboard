FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/

RUN npm ci --ignore-scripts \
  && npm ci --ignore-scripts --prefix backend

FROM deps AS builder

WORKDIR /app

ENV DATABASE_URL=file:./dev.db

COPY . .

RUN npm run build \
  && npm run build:backend

FROM node:20-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/data/dev.db

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/

RUN npm ci --omit=dev --ignore-scripts \
  && npm ci --omit=dev --ignore-scripts --prefix backend \
  && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/backend/dist ./backend/dist

EXPOSE 3003 4000

CMD ["sh", "-c", "mkdir -p /data /app/public/uploads && npm run prisma:migrate:deploy && npm run start -- -p 3003 & PORT=${PORT:-4000} npm run start:backend & wait -n"]
