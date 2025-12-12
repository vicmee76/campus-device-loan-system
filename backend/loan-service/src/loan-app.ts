import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { correlationIdMiddleware } from './api/utils/correlation-id';
import { runWithContext } from './api/utils/logger';
import { defaultRateLimiter } from './api/utils/rate-limiter';
import { checkHealth, checkReadiness } from './api/utils/health-check';
import { metrics } from './api/utils/metrics';
import { alertManager } from './api/utils/alerts';

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

// Middleware
app.use(cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan('combined'));
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

// Health check endpoints
app.get('/health', async (_req, res) => {
  const health = await checkHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/ready', async (_req, res) => {
  const readiness = await checkReadiness();
  const statusCode = readiness.ready ? 200 : 503;
  res.status(statusCode).json(readiness);
});

// Metrics endpoint
app.get('/metrics', (_req, res) => {
  const allMetrics = metrics.getMetrics();
  const jobMetrics = metrics.getJobMetrics();
  
  res.status(200).json({
    metrics: allMetrics.slice(-100), // Last 100 metrics
    jobMetrics: jobMetrics.slice(-100), // Last 100 job metrics
    timestamp: new Date().toISOString(),
  });
});

// Alerts endpoint
app.get('/alerts', (_req, res) => {
  const activeAlerts = alertManager.getActiveAlerts();
  const allAlerts = alertManager.getAllAlerts(50); // Last 50 alerts
  
  res.status(200).json({
    active: activeAlerts,
    recent: allAlerts,
    timestamp: new Date().toISOString(),
  });
});

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

