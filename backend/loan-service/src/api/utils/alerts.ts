import { logger } from './logger';
import { metrics } from './metrics';

export interface AlertRule {
  name: string;
  condition: () => boolean | Promise<boolean>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldownPeriod?: number; // Time in ms before alert can fire again
}

export interface Alert {
  name: string;
  severity: string;
  message: string;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

class AlertManager {
  private alerts: Alert[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();

  async checkRules(rules: AlertRule[]): Promise<void> {
    for (const rule of rules) {
      try {
        const shouldAlert = await rule.condition();

        if (shouldAlert) {
          await this.triggerAlert(rule);
        } else {
          // Check if we should resolve an active alert
          const activeAlert = this.activeAlerts.get(rule.name);
          if (activeAlert && !activeAlert.resolved) {
            this.resolveAlert(rule.name);
          }
        }
      } catch (error) {
        logger.error(`Error checking alert rule: ${rule.name}`, error);
      }
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    const now = Date.now();
    const lastTime = this.lastAlertTime.get(rule.name) || 0;
    const cooldown = rule.cooldownPeriod || 300000; // Default 5 minutes

    // Check cooldown period
    if (now - lastTime < cooldown) {
      return;
    }

    // Check if alert is already active
    const activeAlert = this.activeAlerts.get(rule.name);
    if (activeAlert && !activeAlert.resolved) {
      return; // Alert already active
    }

    const alert: Alert = {
      name: rule.name,
      severity: rule.severity,
      message: rule.message,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);
    this.activeAlerts.set(rule.name, alert);
    this.lastAlertTime.set(rule.name, now);

    // Log alert
    logger.error(`ALERT: ${rule.severity.toUpperCase()} - ${rule.name}`, {
      alert: rule.name,
      severity: rule.severity,
      message: rule.message,
      timestamp: alert.timestamp.toISOString(),
    });

    // TODO: Send to external alerting system (e.g., PagerDuty, Slack, email)
    // Example:
    // await sendToSlack(alert);
    // await sendToPagerDuty(alert);
  }

  private resolveAlert(alertName: string): void {
    const alert = this.activeAlerts.get(alertName);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      logger.info(`Alert resolved: ${alertName}`, {
        alert: alertName,
        resolvedAt: alert.resolvedAt.toISOString(),
      });
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter((a) => !a.resolved);
  }

  getAllAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  clear(): void {
    this.alerts = [];
    this.activeAlerts.clear();
    this.lastAlertTime.clear();
  }
}

export const alertManager = new AlertManager();

// Predefined alert rules
export function createDefaultAlertRules(): AlertRule[] {
  return [
    {
      name: 'high_error_rate',
      severity: 'high',
      message: 'High error rate detected in recent requests',
      condition: async () => {
        const recentJobs = metrics.getJobMetrics().filter(
          (jm) => Date.now() - jm.timestamp.getTime() < 60000 // Last minute
        );
        if (recentJobs.length === 0) return false;

        const errorRate = recentJobs.filter((j) => !j.success).length / recentJobs.length;
        return errorRate > 0.1; // More than 10% errors
      },
      cooldownPeriod: 300000, // 5 minutes
    },
    {
      name: 'slow_response_time',
      severity: 'medium',
      message: 'Slow response times detected',
      condition: async () => {
        const recentJobs = metrics.getJobMetrics().filter(
          (jm) => Date.now() - jm.timestamp.getTime() < 60000 // Last minute
        );
        if (recentJobs.length === 0) return false;

        const avgDuration = recentJobs.reduce((sum, j) => sum + j.duration, 0) / recentJobs.length;
        return avgDuration > 5000; // Average > 5 seconds
      },
      cooldownPeriod: 300000, // 5 minutes
    },
    {
      name: 'database_connection_issues',
      severity: 'critical',
      message: 'Database connection issues detected',
      condition: async () => {
        const dbJobs = metrics.getJobMetrics().filter(
          (jm) => jm.jobName.includes('database') && Date.now() - jm.timestamp.getTime() < 60000
        );
        if (dbJobs.length === 0) return false;

        const failureRate = dbJobs.filter((j) => !j.success).length / dbJobs.length;
        return failureRate > 0.2; // More than 20% failures
      },
      cooldownPeriod: 60000, // 1 minute
    },
  ];
}

// Start alert monitoring
let alertInterval: NodeJS.Timeout | null = null;

export function startAlertMonitoring(intervalMs: number = 60000): void {
  if (alertInterval) {
    clearInterval(alertInterval);
  }

  const rules = createDefaultAlertRules();
  alertInterval = setInterval(() => {
    alertManager.checkRules(rules).catch((error) => {
      logger.error('Error in alert monitoring', error);
    });
  }, intervalMs);

  logger.info('Alert monitoring started', { intervalMs });
}

export function stopAlertMonitoring(): void {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
    logger.info('Alert monitoring stopped');
  }
}

