const config = require('../config');
const { login, logoutByToken } = require('../services/auth.service');
const { loginSchema } = require('../validators/client.schemas');
const { HttpError } = require('../middleware/error');

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: config.sessionTtlMs,
    path: '/',
  };
}

async function postLogin(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid request body', { code: 'VALIDATION_ERROR', expose: true });
    }
    const { token, user } = await login(parsed.data);
    res.cookie(config.sessionCookieName, token, cookieOptions());
    res.status(200).json({ user });
  } catch (e) {
    next(e);
  }
}

async function postLogout(req, res, next) {
  try {
    const token = req.cookies?.[config.sessionCookieName];
    await logoutByToken(token);
    res.clearCookie(config.sessionCookieName, { path: '/', httpOnly: true, sameSite: 'lax' });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

module.exports = { postLogin, postLogout };
