const { prisma } = require('./prisma');

async function purgeExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

function startSessionCleanupInterval(intervalMs = 60 * 60 * 1000) {
  const tick = () => {
    purgeExpiredSessions().catch((err) => {
      console.error('Failed to purge expired sessions:', err);
    });
  };

  tick();
  return setInterval(tick, intervalMs);
}

module.exports = { purgeExpiredSessions, startSessionCleanupInterval };
