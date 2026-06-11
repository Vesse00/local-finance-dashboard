FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci \
  && npm ci --prefix backend \
  && npm run build \
  && npm run build:backend

ENV NODE_ENV=production

EXPOSE 3003 4000

CMD ["sh", "-c", "mkdir -p /data && touch /data/dev.db && ln -sf /data/dev.db /app/dev.db && npm run start -- -p 3003 & PORT=4000 npm run start:backend & wait -n"]
