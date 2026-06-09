const config = require('../config');
const { prisma } = require('../lib/prisma');
const { hashToken } = require('../lib/token');
const { HttpError } = require('./error');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[config.sessionCookieName];
    if (!token) {
      throw new HttpError(401, 'Authentication required', { code: 'UNAUTHORIZED' });
    }

    const tokenHash = hashToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      throw new HttpError(401, 'Invalid or expired session', { code: 'UNAUTHORIZED' });
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new HttpError(401, 'Invalid or expired session', { code: 'UNAUTHORIZED' });
    }

    req.user = { id: session.user.id, email: session.user.email };
    req.session = { id: session.id };
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { requireAuth };
