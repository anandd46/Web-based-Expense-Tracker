const rateLimit = require('express-rate-limit');

// Rate limiting setup: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom simple XSS protection middleware (removes script tags and javascript: links)
const sanitizeInput = (req, res, next) => {
  const sanitize = (val) => {
    if (typeof val === 'string') {
      // Basic regex replacement for HTML script tags and javascript: protocols
      return val
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+="[^"]*"/gi, '');
    }
    if (typeof val === 'object' && val !== null) {
      for (const key in val) {
        val[key] = sanitize(val[key]);
      }
    }
    return val;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

module.exports = { apiLimiter, sanitizeInput };
