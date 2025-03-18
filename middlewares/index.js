const cors = require("cors");
const compression = require("compression");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const { log } = require("#common/Logger.js");
const { JwtMiddleware } = require("./JWT");
const initializeCronJobs = require("#services/Cron.js");
const Env = require("#config/Env.js");
const isDev = Env.NODE_ENV === "development";

module.exports = function applyMiddlewares(app) {
  if (isDev) {
    // const interceptor = require("./Interceptor");
    // app.use(interceptor);
  }

  // Enhanced CORS configuration
  app.use(
    cors({
      origin: Env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  log(`CORS Origin: ${Env.CORS_ORIGIN}`, "DEBUG", "CORS");

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: parseInt(Env.RATE_LIMITER_WINDOW_MS) || 60000,
      max: parseInt(Env.RATE_LIMITER_MAX) || 10000,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many requests, please try again later" },
    })
  );

  app.use(compression());

  // Enhanced helmet configuration with comprehensive security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'", Env.CORS_ORIGIN],
          fontSrc: ["'self'", "cdn.jsdelivr.net"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: "same-origin" },
      hsts: {
        maxAge: 15552000, // 180 days
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: "deny", // Prevents clickjacking
      },
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
    })
  );

  // Add CSRF protection middleware for non-GET requests
  app.use((req, res, next) => {
    // Skip for GET, HEAD, OPTIONS requests
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }

    // Check origin/referer against allowed domains
    const origin = req.headers.origin || req.headers.referer || "";
    const allowedOrigins = (Env.CORS_ORIGIN || "").split(",").map((o) => o.trim());

    // Allow all origins if configured with wildcard
    if (allowedOrigins.includes("*")) {
      return next();
    }

    // Check if origin matches allowed origins
    const originAllowed = allowedOrigins.some((allowed) => origin.startsWith(allowed));

    if (!originAllowed) {
      log(`CSRF attempt blocked: ${origin} not in allowed origins`, "WARN", "SECURITY");
      return res.status(403).json({ message: "Forbidden: invalid origin" });
    }

    next();
  });

  app.use(cookieParser());

  // Configure JSON body parser with limits to prevent payload attacks
  app.use(
    express.json({
      limit: "500kb",
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf);
        } catch (e) {
          log("Invalid JSON in request", "WARN", "SECURITY");
          res.status(400).json({ message: "Invalid JSON payload" });
          throw new Error("Invalid JSON");
        }
      },
    })
  );

  app.use(express.urlencoded({ extended: true, limit: "500kb" }));
  app.use(JwtMiddleware);

  // Add response headers for additional security
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Download-Options", "noopen");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  initializeCronJobs();
};
