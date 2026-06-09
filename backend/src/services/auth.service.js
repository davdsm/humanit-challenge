const bcrypt = require('bcryptjs');
const config = require('../config');
const { prisma } = require('../lib/prisma');
const { createOpaqueToken, hashToken } = require('../lib/token');
const { HttpError } = require('../middleware/error');

async function login({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new HttpError(400, 'Email and password are required', { code: 'VALIDATION_ERROR' });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid credentials', { code: 'INVALID_CREDENTIALS' });
  }

  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.sessionTtlMs);

  await prisma.session.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  return { token, user: { id: user.id, email: user.email } };
}

async function logoutByToken(token) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

module.exports = { login, logoutByToken };
