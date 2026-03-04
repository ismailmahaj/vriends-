const rateLimitMap = new Map();

const rateLimit = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitMap.get(ip);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Trop de requêtes, réessayez plus tard' });
    }

    record.count++;
    next();
  };
};

module.exports = rateLimit;
