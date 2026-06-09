const rateLimit = require('express-rate-limit');
const config = require('../config');

const loginRateLimiter =
  config.nodeEnv === 'test'
    ? (_req, _res, next) => next()
    : rateLimit({
        windowMs: config.loginRateLimitWindowMs,
        max: config.loginRateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many login attempts. Please try again later.',
          },
        },
      });

module.exports = { loginRateLimiter };
