const path = require('path');
const fs = require('fs');
const Module = require('module');

const localNm = path.join(__dirname, '../local_modules/node_modules');
if (fs.existsSync(localNm)) {
  process.env.NODE_PATH = [localNm, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
  Module._initPaths();
}

const { PrismaClient } = require(fs.existsSync(path.join(localNm, '@prisma/client'))
  ? path.join(localNm, '@prisma/client')
  : '@prisma/client');

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.PRISMA_LOG === '1' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
