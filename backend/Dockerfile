FROM node:18-alpine

WORKDIR /app

# OpenSSL requis par Prisma sur Alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 3001

# Appliquer les migrations puis démarrer
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
