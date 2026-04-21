const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');
const config = require('../config');
const { prisma } = require('../lib/prisma');
const { HttpError } = require('../middleware/error');

function createOpaqueToken() {
  return randomBytes(32).toString('hex');
}

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
  const expiresAt = new Date(Date.now() + config.sessionTtlMs);

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  return { token, user: { id: user.id, email: user.email } };
}

async function logoutByToken(token) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

module.exports = { login, logoutByToken };
