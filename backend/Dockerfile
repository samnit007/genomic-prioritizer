FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

RUN chown -R node:node /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

USER node

CMD ["sh", "-c", "npx prisma db push && npx ts-node --transpile-only prisma/seed.ts; node dist/index.js"]
