const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const { requestIdMiddleware } = require('./middleware/requestId');
const { errorMiddleware, HttpError } = require('./middleware/error');
const openApi = require('./docs/openapi');
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');

function createApp() {
  const app = express();

  fs.mkdirSync(config.uploadDir, { recursive: true });
  fs.mkdirSync(config.trashDir, { recursive: true });

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(
    cors({
      origin: config.frontendOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  api.get('/openapi.json', (_req, res) => {
    res.json(openApi);
  });

  api.use('/docs', swaggerUi.serve, swaggerUi.setup(openApi, { explorer: true }));

  api.use('/auth', authRoutes);
  api.use('/clients', clientRoutes);

  app.use('/api', api);

  app.use((_req, _res, next) => {
    next(new HttpError(404, 'Not Found', { code: 'NOT_FOUND' }));
  });

  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };
