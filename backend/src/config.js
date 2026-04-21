require('dotenv').config();
const path = require('path');

const toInt = (v, fallback) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
};

const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');
const trashDir = process.env.TRASH_DIR
  ? path.resolve(process.env.TRASH_DIR)
  : path.join(__dirname, '..', 'trash');

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL || 'file:./prisma/data/dev.db',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'sid',
  sessionTtlMs: toInt(process.env.SESSION_TTL_MS, 1000 * 60 * 60 * 24 * 7),
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  bcryptCost: toInt(process.env.BCRYPT_COST, 10),
  uploadDir,
  trashDir,
  maxUploadBytes: toInt(process.env.MAX_UPLOAD_BYTES, 10 * 1024 * 1024),
};
