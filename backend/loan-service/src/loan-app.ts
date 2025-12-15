import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { correlationIdMiddleware } from './api/utils/correlation-id';
import { runWithContext } from './api/utils/logger';
import { defaultRateLimiter } from './api/utils/rate-limiter';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 7779;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID'],
  credentials: true,
  exposedHeaders: ['X-Correlation-ID'],
};

// Trust proxy for correct IP address extraction (important for rate limiting)
app.set('trust proxy', true);

// Middleware
app.use(cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
// Disable morgan logging in test environment to reduce test output noise
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Correlation ID middleware
app.use(correlationIdMiddleware);

// Request context middleware (wraps requests with correlation ID and user ID)
app.use((req, _res, next) => {
  const context = {
    correlationId: req.correlationId,
    userId: (req as any).user?.userId, // Assuming req.user is set by auth middleware
  };
  runWithContext(context, () => next());
});

// Rate limiting (apply to all routes except health checks)
app.use(defaultRateLimiter.middleware());

// Health check routes (must be before other routes to avoid rate limiting)
import healthRoutes from './api/routes/health.routes';
app.use('/', healthRoutes);

// Routes
import loanRoutes from './api/routes/loan.routes';
app.use('/v1/api/loans', loanRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Loan Service is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;

