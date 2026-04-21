function errorMiddleware(err, req, res, _next) {
  if (err?.name === 'MulterError' && err?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'File too large', requestId: req.requestId },
    });
    return;
  }

  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  const message = err.expose ? err.message : status === 500 ? 'Internal Server Error' : err.message;

  if (status === 500) {
    console.error(`[${req.requestId || 'no-id'}]`, err);
  }

  res.status(status).json({
    error: { code, message, requestId: req.requestId },
  });
}

class HttpError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.status = status;
    this.expose = options.expose !== false;
    this.code = options.code;
  }
}

module.exports = { errorMiddleware, HttpError };
