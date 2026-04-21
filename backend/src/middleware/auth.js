const config = require('../config');
const { prisma } = require('../lib/prisma');
const { HttpError } = require('./error');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[config.sessionCookieName];
    if (!token) {
      throw new HttpError(401, 'Authentication required', { code: 'UNAUTHORIZED' });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new HttpError(401, 'Invalid or expired session', { code: 'UNAUTHORIZED' });
    }

    req.user = { id: session.user.id, email: session.user.email };
    req.session = { id: session.id, token: session.token };
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { requireAuth };
