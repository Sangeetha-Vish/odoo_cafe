/**
 * Global error handler middleware.
 * Always returns a flat { error: string } shape so the frontend
 * can safely render err.response.data.error without crashing.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);

  const statusCode = err.statusCode || err.status || 500;

  // Always return a plain string — never a nested object
  const message =
    typeof err.message === 'string' ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    error: message,   // ← flat string, not { message, status }
    status: statusCode,
  });
};

module.exports = errorHandler;
