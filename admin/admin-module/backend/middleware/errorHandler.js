/**
 * Centralized error handler. Controllers call next(err) on failure
 * and this formats a consistent JSON error response.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  // Postgres unique_violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Resource already exists (duplicate value)' });
  }

  // Postgres foreign_key_violation
  if (err.code === '23503') {
    return res.status(409).json({ success: false, message: 'Operation violates a related record constraint' });
  }

  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
