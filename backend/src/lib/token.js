const { createHash, randomBytes } = require('crypto');

function createOpaqueToken() {
  return randomBytes(32).toString('hex');
}

function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

module.exports = { createOpaqueToken, hashToken };
