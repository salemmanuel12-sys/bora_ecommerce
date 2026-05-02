const rateLimit = require('express-rate-limit');

function createJsonLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        ok: false,
        message: 'Demasiados intentos. Intenta nuevamente en unos minutos.',
      });
    },
  });
}

const loginLimiter = createJsonLimiter({ windowMs: 5 * 60 * 1000, max: 20 });
const refreshLimiter = createJsonLimiter({ windowMs: 15 * 60 * 1000, max: 20 });
const resetLimiter = createJsonLimiter({ windowMs: 15 * 60 * 1000, max: 5 });

module.exports = {
  loginLimiter,
  refreshLimiter,
  resetLimiter,
};