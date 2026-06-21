/** Explicit CORS matrix for all three frontend dev portals. */
export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

/**
 * Pre-configured Express cors() options with credentials + Authorization header support.
 */
export function createCorsOptions() {
  return {
    origin(origin, callback) {
      // Allow non-browser clients (curl, Postman) with no Origin header.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type'],
    maxAge: 86400,
  };
}

export default createCorsOptions;
