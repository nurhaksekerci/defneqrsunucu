const logger = require('./logger');
const nodemailer = require('nodemailer');

/**
 * Alert Configuration
 */
const ALERT_CONFIG = {
  // Email settings
  email: {
    enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
    from: process.env.ALERT_EMAIL_FROM || 'alerts@defneqr.com',
    to: process.env.ALERT_EMAIL_TO ? process.env.ALERT_EMAIL_TO.split(',') : [],
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },
  
  // Webhook settings (Slack, Discord, etc.)
  webhook: {
    enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
    url: process.env.ALERT_WEBHOOK_URL
  },
  
  // Alert thresholds
  thresholds: {
    errorRate: parseInt(process.env.ALERT_ERROR_RATE_THRESHOLD || '10'), // errors per minute
    responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '5000'), // ms
    cpuUsage: parseInt(process.env.ALERT_CPU_USAGE_THRESHOLD || '90'), // percentage
    memoryUsage: parseInt(process.env.ALERT_MEMORY_USAGE_THRESHOLD || '90') // percentage
  }
};

/**
 * Email transporter (singleton)
 */
let emailTransporter = null;

function getEmailTransporter() {
  if (!emailTransporter && ALERT_CONFIG.email.enabled) {
    try {
      emailTransporter = nodemailer.createTransporter(ALERT_CONFIG.email.smtp);
      logger.info('Email transporter initialized for alerting');
    } catch (error) {
      logger.error('Failed to initialize email transporter', error);
    }
  }
  return emailTransporter;
}

/**
 * Send email alert
 */
async function sendEmailAlert(subject, message, severity = 'error') {
  if (!ALERT_CONFIG.email.enabled || ALERT_CONFIG.email.to.length === 0) {
    return;
  }

  const transporter = getEmailTransporter();
  if (!transporter) {
    return;
  }

  const severityColors = {
    critical: '#DC2626',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  };

  const color = severityColors[severity] || severityColors.error;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
        .badge { display: inline-block; padding: 4px 12px; background: ${color}; color: white; border-radius: 4px; font-size: 12px; text-transform: uppercase; }
        pre { background: #1f2937; color: #f3f4f6; padding: 12px; border-radius: 4px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚨 Defne Qr Alert</h2>
          <span class="badge">${severity}</span>
        </div>
        <div class="content">
          <h3>${subject}</h3>
          <div>${message}</div>
          <div class="footer">
            <p>Time: ${new Date().toLocaleString('tr-TR')}</p>
            <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
            <p>Server: ${process.env.SERVER_NAME || 'Unknown'}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: ALERT_CONFIG.email.from,
      to: ALERT_CONFIG.email.to.join(','),
      subject: `[${severity.toUpperCase()}] ${subject}`,
      text: message,
      html: htmlContent
    });

    logger.info('Email alert sent', { subject, severity });
  } catch (error) {
    logger.error('Failed to send email alert', error);
  }
}

/**
 * Send webhook alert (Slack, Discord, etc.)
 */
async function sendWebhookAlert(subject, message, severity = 'error') {
  if (!ALERT_CONFIG.webhook.enabled || !ALERT_CONFIG.webhook.url) {
    return;
  }

  const severityEmojis = {
    critical: '🔴',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const emoji = severityEmojis[severity] || severityEmojis.error;

  // Slack-compatible payload (also works with many webhook services)
  const payload = {
    text: `${emoji} *${subject}*`,
    attachments: [
      {
        color: severity === 'critical' || severity === 'error' ? 'danger' : 'warning',
        fields: [
          {
            title: 'Message',
            value: message,
            short: false
          },
          {
            title: 'Severity',
            value: severity.toUpperCase(),
            short: true
          },
          {
            title: 'Environment',
            value: process.env.NODE_ENV || 'development',
            short: true
          },
          {
            title: 'Time',
            value: new Date().toLocaleString('tr-TR'),
            short: true
          }
        ]
      }
    ]
  };

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(ALERT_CONFIG.webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    logger.info('Webhook alert sent', { subject, severity });
  } catch (error) {
    logger.error('Failed to send webhook alert', error);
  }
}

/**
 * Main alert function
 */
async function sendAlert(subject, message, severity = 'error', metadata = {}) {
  logger[severity](`Alert: ${subject}`, { message, ...metadata });

  // Send to email
  if (ALERT_CONFIG.email.enabled) {
    await sendEmailAlert(subject, message, severity);
  }

  // Send to webhook
  if (ALERT_CONFIG.webhook.enabled) {
    await sendWebhookAlert(subject, message, severity);
  }
}

/**
 * Predefined alert types
 */
const alerts = {
  // Critical system errors
  criticalError: (error, context = {}) => {
    const message = `
      <strong>Critical Error Occurred</strong>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Type:</strong> ${error.name}</p>
      ${context.url ? `<p><strong>URL:</strong> ${context.url}</p>` : ''}
      ${context.userId ? `<p><strong>User ID:</strong> ${context.userId}</p>` : ''}
      <pre>${error.stack || 'No stack trace available'}</pre>
    `;
    
    return sendAlert('Critical Application Error', message, 'critical', context);
  },

  // Database errors
  databaseError: (error, operation) => {
    const message = `
      <strong>Database Operation Failed</strong>
      <p><strong>Operation:</strong> ${operation}</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Code:</strong> ${error.code || 'Unknown'}</p>
    `;
    
    return sendAlert('Database Error', message, 'error', { operation });
  },

  // High error rate
  highErrorRate: (count, timeWindow) => {
    const message = `
      <strong>High Error Rate Detected</strong>
      <p>${count} errors occurred in the last ${timeWindow} minutes</p>
      <p>Threshold: ${ALERT_CONFIG.thresholds.errorRate} errors/minute</p>
      <p><strong>Action Required:</strong> Investigate logs and check system health</p>
    `;
    
    return sendAlert('High Error Rate Alert', message, 'warning', { count, timeWindow });
  },

  // Performance degradation
  performanceDegradation: (metric, value, threshold) => {
    const message = `
      <strong>Performance Degradation Detected</strong>
      <p><strong>Metric:</strong> ${metric}</p>
      <p><strong>Current Value:</strong> ${value}</p>
      <p><strong>Threshold:</strong> ${threshold}</p>
      <p><strong>Action Required:</strong> Check server resources and optimize</p>
    `;
    
    return sendAlert('Performance Alert', message, 'warning', { metric, value, threshold });
  },

  // Security alerts
  securityIncident: (incident, details) => {
    const message = `
      <strong>Security Incident Detected</strong>
      <p><strong>Incident:</strong> ${incident}</p>
      <p><strong>Details:</strong> ${details}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString('tr-TR')}</p>
      <p><strong>Action Required:</strong> Immediate investigation required</p>
    `;
    
    return sendAlert('Security Alert', message, 'critical', { incident, details });
  },

  // Service down
  serviceDown: (serviceName, error) => {
    const message = `
      <strong>Service Unavailable</strong>
      <p><strong>Service:</strong> ${serviceName}</p>
      <p><strong>Error:</strong> ${error}</p>
      <p><strong>Action Required:</strong> Check service status and restart if necessary</p>
    `;
    
    return sendAlert('Service Down Alert', message, 'critical', { serviceName });
  },

  // Disk space warning
  diskSpaceWarning: (usage, threshold) => {
    const message = `
      <strong>Low Disk Space Warning</strong>
      <p><strong>Current Usage:</strong> ${usage}%</p>
      <p><strong>Threshold:</strong> ${threshold}%</p>
      <p><strong>Action Required:</strong> Clean up unnecessary files or expand storage</p>
    `;
    
    return sendAlert('Disk Space Warning', message, 'warning', { usage, threshold });
  }
};

/**
 * Error rate monitoring
 */
let errorCounts = [];
const ERROR_WINDOW_MS = 60000; // 1 minute

function trackError() {
  const now = Date.now();
  errorCounts.push(now);
  
  // Remove errors outside the time window
  errorCounts = errorCounts.filter(time => now - time < ERROR_WINDOW_MS);
  
  // Check if error rate exceeds threshold
  if (errorCounts.length >= ALERT_CONFIG.thresholds.errorRate) {
    alerts.highErrorRate(errorCounts.length, 1);
    // Reset counter after alert
    errorCounts = [];
  }
}

module.exports = {
  sendAlert,
  alerts,
  trackError,
  ALERT_CONFIG
};
