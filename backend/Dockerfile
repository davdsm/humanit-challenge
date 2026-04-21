FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
