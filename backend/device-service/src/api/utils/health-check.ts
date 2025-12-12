import db from '../../database/connection';
import { logger } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  timestamp: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {
    database: {
      status: 'down',
    },
  };

  try {
    // Check database connection
    const dbStartTime = Date.now();
    await db.raw('SELECT 1');
    const dbResponseTime = Date.now() - dbStartTime;

    checks.database = {
      status: 'up',
      responseTime: dbResponseTime,
    };

    const overallStatus: HealthStatus['status'] = 'healthy';
    return {
      status: overallStatus,
      service: 'device-service',
      timestamp: new Date().toISOString(),
      checks,
    };
  } catch (error) {
    logger.error('Health check failed', error);
    checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return {
      status: 'unhealthy',
      service: 'device-service',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}

export async function checkReadiness(): Promise<{ ready: boolean; reason?: string }> {
  try {
    // Check if database is accessible
    await db.raw('SELECT 1');
    return { ready: true };
  } catch (error) {
    logger.error('Readiness check failed', error);
    return {
      ready: false,
      reason: error instanceof Error ? error.message : 'Database unavailable',
    };
  }
}

