const config = require('./config');
const { createApp } = require('./app');
const { purgeExpiredSessions, startSessionCleanupInterval } = require('./lib/sessionCleanup');

const app = createApp();

async function start() {
  await purgeExpiredSessions();
  if (config.nodeEnv !== 'test') {
    startSessionCleanupInterval(config.sessionCleanupIntervalMs);
  }

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
