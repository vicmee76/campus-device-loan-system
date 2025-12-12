import { logger } from './logger';

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: { [key: string]: string };
}

export interface JobMetrics {
  jobName: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  tags?: { [key: string]: string };
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private jobMetrics: JobMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  recordMetric(name: string, value: number, unit: string = 'ms', tags?: { [key: string]: string }): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log metric for external collection (e.g., Prometheus, CloudWatch)
    logger.info('Metric recorded', {
      metric: name,
      value,
      unit,
      tags,
      timestamp: metric.timestamp.toISOString(),
    });
  }

  recordJobMetrics(jobName: string, duration: number, success: boolean, error?: string, tags?: { [key: string]: string }): void {
    const jobMetric: JobMetrics = {
      jobName,
      duration,
      success,
      error,
      timestamp: new Date(),
      tags,
    };

    this.jobMetrics.push(jobMetric);

    // Keep only last N job metrics
    if (this.jobMetrics.length > this.maxMetrics) {
      this.jobMetrics.shift();
    }

    // Log job metric
    logger.info('Job metric recorded', {
      job: jobName,
      duration,
      success,
      error,
      tags,
      timestamp: jobMetric.timestamp.toISOString(),
    });
  }

  getMetrics(name?: string, tags?: { [key: string]: string }): Metric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter((m) => m.name === name);
    }

    if (tags) {
      filtered = filtered.filter((m) => {
        if (!m.tags) return false;
        return Object.keys(tags).every((key) => m.tags![key] === tags[key]);
      });
    }

    return filtered;
  }

  getJobMetrics(jobName?: string): JobMetrics[] {
    if (jobName) {
      return this.jobMetrics.filter((jm) => jm.jobName === jobName);
    }
    return this.jobMetrics;
  }

  getJobStats(jobName: string): {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
  } | null {
    const jobs = this.getJobMetrics(jobName);
    if (jobs.length === 0) return null;

    const successful = jobs.filter((j) => j.success).length;
    const failed = jobs.length - successful;
    const durations = jobs.map((j) => j.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    return {
      total: jobs.length,
      successful,
      failed,
      avgDuration,
      minDuration,
      maxDuration,
    };
  }

  clear(): void {
    this.metrics = [];
    this.jobMetrics = [];
  }
}

export const metrics = new MetricsCollector();

// Helper to measure execution time
export async function measureExecutionTime<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: { [key: string]: string }
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let error: string | undefined;

  try {
    const result = await fn();
    return result;
  } catch (err) {
    success = false;
    error = err instanceof Error ? err.message : 'Unknown error';
    throw err;
  } finally {
    const duration = Date.now() - startTime;
    metrics.recordJobMetrics(name, duration, success, error, tags);
  }
}

// Helper to measure synchronous execution time
export function measureExecutionTimeSync<T>(
  name: string,
  fn: () => T,
  tags?: { [key: string]: string }
): T {
  const startTime = Date.now();
  let success = true;
  let error: string | undefined;

  try {
    return fn();
  } catch (err) {
    success = false;
    error = err instanceof Error ? err.message : 'Unknown error';
    throw err;
  } finally {
    const duration = Date.now() - startTime;
    metrics.recordJobMetrics(name, duration, success, error, tags);
  }
}

