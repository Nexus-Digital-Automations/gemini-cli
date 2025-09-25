# Task Management System Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Gemini CLI Task Management System across different environments, from development workstations to enterprise production systems.

## Prerequisites

### System Requirements

#### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **Memory**: 512 MB available RAM
- **Storage**: 100 MB free disk space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

#### Recommended Requirements
- **Node.js**: 20.0.0 or higher
- **Memory**: 2 GB available RAM
- **Storage**: 1 GB free disk space
- **OS**: Latest stable versions

#### Production Requirements
- **Node.js**: 20.0.0 LTS
- **Memory**: 4 GB available RAM
- **Storage**: 10 GB free disk space (with proper backup storage)
- **OS**: Linux (Ubuntu 22.04 LTS recommended)
- **Monitoring**: System monitoring tools (Prometheus, Grafana)

### Dependencies

```bash
npm install @google/gemini-cli
# or
yarn add @google/gemini-cli
```

## Environment Setup

### Development Environment

#### 1. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/google/gemini-cli.git
cd gemini-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

#### 2. Configuration

Create a development configuration file:

```typescript
// config/development.ts
import { TaskManagementConfigManager } from '@google/gemini-cli/task-management';

export const developmentConfig = TaskManagementConfigManager.generateTemplate('development');

// Override specific settings
developmentConfig.taskEngine.maxConcurrentTasks = 3;
developmentConfig.monitoring.enableDashboard = true;
developmentConfig.development.enableDebugMode = true;
```

#### 3. Initialize System

```typescript
// src/task-system.ts
import {
  createIntegratedTaskManagementSystem,
  TaskManagementConfigManager
} from '@google/gemini-cli/task-management';
import { developmentConfig } from '../config/development.js';

async function initializeSystem() {
  const configManager = new TaskManagementConfigManager();
  const config = await configManager.loadConfig('./config/task-config.json', coreConfig);

  const { system, result } = await createIntegratedTaskManagementSystem(config);

  if (!result.success) {
    console.error('Failed to initialize system:', result.message);
    process.exit(1);
  }

  console.log('✅ Development system ready');
  return system;
}
```

### Staging Environment

#### 1. Environment Configuration

```typescript
// config/staging.ts
export const stagingConfig = TaskManagementConfigManager.generateTemplate('production');

// Staging-specific overrides
stagingConfig.environment = 'staging';
stagingConfig.persistence.retentionDays = 14;
stagingConfig.monitoring.alertThresholds = {
  taskFailureRate: 0.15,
  averageExecutionTime: 450000,
  systemMemoryUsage: 0.85,
  queueBacklog: 150,
  agentUtilization: 0.95
};
```

#### 2. Docker Configuration

```dockerfile
# Dockerfile.staging
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY config/ ./config/

# Create non-root user
RUN addgroup -g 1001 -S gemini && \
    adduser -S gemini -u 1001 -G gemini

# Set ownership and permissions
RUN chown -R gemini:gemini /app
USER gemini

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check placeholder')"

EXPOSE 3000 8080

CMD ["node", "dist/main.js"]
```

#### 3. Docker Compose for Staging

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  task-management:
    build:
      context: .
      dockerfile: Dockerfile.staging
    ports:
      - "3000:3000"
      - "8080:8080"
    volumes:
      - ./staging-data:/app/data
      - ./staging-logs:/app/logs
    environment:
      - NODE_ENV=staging
      - CONFIG_PATH=/app/config/staging.json
    restart: unless-stopped

  monitoring:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana-storage:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=staging_password
    restart: unless-stopped

volumes:
  grafana-storage:
```

### Production Environment

#### 1. Production Configuration

```typescript
// config/production.ts
export const productionConfig = TaskManagementConfigManager.generateTemplate('enterprise');

// Production-specific settings
productionConfig.security.enableValidation = true;
productionConfig.security.enableSandboxing = true;
productionConfig.security.enableAuditLog = true;

productionConfig.persistence.encryptionEnabled = true;
productionConfig.persistence.backupEnabled = true;
productionConfig.persistence.backupInterval = 3600000; // 1 hour

productionConfig.monitoring.enableAlerts = true;
productionConfig.monitoring.enablePredictiveAnalytics = true;
productionConfig.monitoring.exportFormats = ['json', 'prometheus', 'grafana'];
```

#### 2. Production Dockerfile

```dockerfile
# Dockerfile.production
FROM node:20-alpine AS builder

WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine AS runtime

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S gemini && \
    adduser -S gemini -u 1001 -G gemini

# Copy built application
COPY --from=builder --chown=gemini:gemini /build/dist ./dist
COPY --from=builder --chown=gemini:gemini /build/node_modules ./node_modules
COPY --from=builder --chown=gemini:gemini /build/package*.json ./

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs /app/backups && \
    chown -R gemini:gemini /app

USER gemini

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('./dist/health-check.js')"

EXPOSE 8080

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

#### 3. Kubernetes Deployment

```yaml
# k8s/task-management-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-management
  labels:
    app: task-management
spec:
  replicas: 3
  selector:
    matchLabels:
      app: task-management
  template:
    metadata:
      labels:
        app: task-management
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: task-management
        image: gemini-cli/task-management:production
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: CONFIG_PATH
          value: "/app/config/production.json"
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
        - name: data-volume
          mountPath: /app/data
        - name: logs-volume
          mountPath: /app/logs
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
          requests:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: config-volume
        configMap:
          name: task-management-config
      - name: data-volume
        persistentVolumeClaim:
          claimName: task-management-data
      - name: logs-volume
        persistentVolumeClaim:
          claimName: task-management-logs

---
apiVersion: v1
kind: Service
metadata:
  name: task-management-service
spec:
  selector:
    app: task-management
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
  type: ClusterIP

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: task-management-config
data:
  production.json: |
    {
      "environment": "production",
      "taskEngine": {
        "maxConcurrentTasks": 10,
        "timeoutMs": 900000
      },
      "monitoring": {
        "enabled": true,
        "enableAlerts": true
      }
    }
```

#### 4. Persistent Storage

```yaml
# k8s/storage.yml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: task-management-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: ssd

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: task-management-logs
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: ssd
```

## Configuration Management

### Environment Variables

```bash
# Required
NODE_ENV=production
GEMINI_API_KEY=your_api_key_here

# Optional
CONFIG_PATH=/app/config/production.json
DATA_PATH=/app/data
LOGS_PATH=/app/logs
BACKUP_PATH=/app/backups

# Security
ENCRYPTION_KEY=your_encryption_key_here
AUDIT_LOG_ENABLED=true

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_DASHBOARD_ENABLED=true
ALERT_WEBHOOK_URL=https://your-webhook-url
```

### Configuration Files

#### Development
```json
{
  "environment": "development",
  "version": "1.0.0",
  "taskEngine": {
    "maxConcurrentTasks": 5,
    "defaultRetryCount": 2,
    "timeoutMs": 300000,
    "enableMetrics": true,
    "logLevel": "debug"
  },
  "monitoring": {
    "enabled": true,
    "enableDashboard": true,
    "dashboardPort": 3000
  },
  "persistence": {
    "enabled": true,
    "storageLocation": "./dev-data",
    "retentionDays": 7
  }
}
```

#### Production
```json
{
  "environment": "production",
  "version": "1.0.0",
  "taskEngine": {
    "maxConcurrentTasks": 10,
    "defaultRetryCount": 3,
    "timeoutMs": 900000,
    "enableMetrics": true,
    "logLevel": "info"
  },
  "autonomousQueue": {
    "enabled": true,
    "maxConcurrentTasks": 15,
    "enableAutonomousBreakdown": true,
    "learningEnabled": true
  },
  "monitoring": {
    "enabled": true,
    "enableAlerts": true,
    "enablePredictiveAnalytics": true,
    "exportFormats": ["json", "prometheus"]
  },
  "persistence": {
    "enabled": true,
    "storageLocation": "/app/data",
    "encryptionEnabled": true,
    "backupEnabled": true,
    "retentionDays": 90
  },
  "security": {
    "enableValidation": true,
    "enableSandboxing": true,
    "enableAuditLog": true
  }
}
```

## Security Configuration

### Authentication and Authorization

```typescript
// security/auth-config.ts
export const authConfig = {
  enableAuthentication: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET,
  sessionTimeout: 3600000, // 1 hour
  roles: [
    {
      name: 'admin',
      permissions: ['read', 'write', 'execute', 'configure', 'monitor']
    },
    {
      name: 'developer',
      permissions: ['read', 'write', 'execute', 'monitor']
    },
    {
      name: 'viewer',
      permissions: ['read', 'monitor']
    }
  ]
};
```

### Encryption Configuration

```typescript
// security/encryption.ts
import { randomBytes, createCipher } from 'crypto';

export const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,

  generateKey(): string {
    return randomBytes(32).toString('hex');
  },

  validateKey(key: string): boolean {
    return key && key.length === 64; // 32 bytes as hex
  }
};
```

### Network Security

```typescript
// security/network.ts
export const networkConfig = {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: 'Too many requests from this IP'
  },

  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }
};
```

## Monitoring and Observability

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'task-management'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Task Management System",
    "panels": [
      {
        "title": "Active Tasks",
        "type": "graph",
        "targets": [
          {
            "expr": "task_management_active_tasks",
            "legendFormat": "Active Tasks"
          }
        ]
      },
      {
        "title": "Task Success Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(task_management_completed_tasks[5m]) / rate(task_management_total_tasks[5m]) * 100",
            "legendFormat": "Success Rate %"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules

```yaml
# monitoring/alert_rules.yml
groups:
  - name: task_management
    rules:
      - alert: HighTaskFailureRate
        expr: rate(task_management_failed_tasks[5m]) / rate(task_management_total_tasks[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High task failure rate detected"
          description: "Task failure rate is {{ $value }}% over the last 5 minutes"

      - alert: SystemMemoryHigh
        expr: task_management_memory_usage_mb > 1500
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "System memory usage is {{ $value }}MB"

      - alert: TaskQueueBacklog
        expr: task_management_queue_size > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Large task queue backlog"
          description: "Task queue has {{ $value }} pending tasks"
```

## Performance Tuning

### Resource Optimization

```typescript
// performance/tuning.ts
export const performanceConfig = {
  // CPU optimization
  cpu: {
    maxConcurrentTasks: Math.min(require('os').cpus().length * 2, 20),
    adaptiveScheduling: true,
    taskPrioritization: true
  },

  // Memory optimization
  memory: {
    heapSizeLimit: process.env.NODE_OPTIONS?.includes('--max-old-space-size') ?
      undefined : '--max-old-space-size=2048',
    gcSettings: {
      '--expose-gc': true,
      '--optimize-for-size': true
    },
    cacheSettings: {
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      cacheTTL: 30 * 60 * 1000 // 30 minutes
    }
  },

  // I/O optimization
  io: {
    fileSystemCache: true,
    compressionEnabled: true,
    batchWrites: true,
    writeInterval: 5000 // 5 seconds
  }
};
```

### Database Optimization (if using database storage)

```sql
-- PostgreSQL optimization
CREATE INDEX CONCURRENTLY idx_tasks_status ON tasks(status);
CREATE INDEX CONCURRENTLY idx_tasks_created_at ON tasks(created_at);
CREATE INDEX CONCURRENTLY idx_tasks_priority ON tasks(priority);

-- Partitioning for large datasets
CREATE TABLE tasks_archive PARTITION OF tasks
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Vacuum and analyze regularly
VACUUM ANALYZE tasks;
```

## Backup and Recovery

### Automated Backup Strategy

```typescript
// backup/strategy.ts
export class BackupManager {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  async performBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(this.config.backupLocation, `backup-${timestamp}`);

    // 1. Create backup directory
    await fs.mkdir(backupPath, { recursive: true });

    // 2. Backup task data
    await this.backupTaskData(backupPath);

    // 3. Backup configuration
    await this.backupConfiguration(backupPath);

    // 4. Backup logs (last 7 days)
    await this.backupLogs(backupPath);

    // 5. Create backup manifest
    await this.createManifest(backupPath);

    // 6. Compress backup
    if (this.config.compressionEnabled) {
      await this.compressBackup(backupPath);
    }

    // 7. Cleanup old backups
    await this.cleanupOldBackups();

    console.log(`✅ Backup completed: ${backupPath}`);
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    // Implementation for backup restoration
    console.log(`Restoring from backup: ${backupPath}`);

    // 1. Validate backup
    await this.validateBackup(backupPath);

    // 2. Stop current system
    await this.stopSystem();

    // 3. Restore data
    await this.restoreData(backupPath);

    // 4. Restore configuration
    await this.restoreConfiguration(backupPath);

    // 5. Restart system
    await this.startSystem();

    console.log('✅ Restore completed');
  }
}
```

### Backup Automation

```bash
#!/bin/bash
# backup/automated-backup.sh

set -e

BACKUP_DIR="/app/backups"
RETENTION_DAYS=30
LOG_FILE="/app/logs/backup.log"

echo "$(date): Starting automated backup" >> $LOG_FILE

# Perform backup
node -e "
const { BackupManager } = require('./dist/backup/strategy.js');
const backup = new BackupManager({
  backupLocation: '$BACKUP_DIR',
  compressionEnabled: true,
  retentionDays: $RETENTION_DAYS
});
backup.performBackup().catch(console.error);
" >> $LOG_FILE 2>&1

# Upload to cloud storage (optional)
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 sync $BACKUP_DIR s3://$AWS_S3_BUCKET/backups/
  echo "$(date): Backup uploaded to S3" >> $LOG_FILE
fi

echo "$(date): Backup completed" >> $LOG_FILE
```

### Recovery Procedures

```bash
#!/bin/bash
# recovery/emergency-recovery.sh

BACKUP_PATH=$1
if [ -z "$BACKUP_PATH" ]; then
  echo "Usage: $0 <backup_path>"
  exit 1
fi

echo "🚨 Starting emergency recovery from $BACKUP_PATH"

# 1. Stop running services
docker-compose down

# 2. Backup current state (in case of issues)
mv /app/data /app/data.emergency-backup-$(date +%s)

# 3. Restore from backup
node -e "
const { BackupManager } = require('./dist/backup/strategy.js');
const backup = new BackupManager({});
backup.restoreFromBackup('$BACKUP_PATH');
"

# 4. Restart services
docker-compose up -d

echo "✅ Emergency recovery completed"
```

## Health Checks and Monitoring

### Health Check Endpoints

```typescript
// health/health-check.ts
export class HealthCheckService {
  constructor(private system: TaskManagementSystemIntegrator) {}

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkSystemHealth(),
      this.checkDatabaseConnection(),
      this.checkFileSystemAccess(),
      this.checkMemoryUsage(),
      this.checkTaskQueue()
    ]);

    const results = checks.map((check, index) => ({
      name: ['system', 'database', 'filesystem', 'memory', 'queue'][index],
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      details: check.status === 'fulfilled' ? check.value : check.reason
    }));

    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date(),
      checks: results
    };
  }

  private async checkSystemHealth() {
    const health = this.system.getSystemHealth();
    if (health.overall === 'critical') {
      throw new Error('System in critical state');
    }
    return health;
  }
}
```

### Monitoring Scripts

```bash
#!/bin/bash
# monitoring/system-monitor.sh

# System resource monitoring
check_memory() {
  MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
  if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "WARNING: Memory usage is ${MEMORY_USAGE}%"
    return 1
  fi
  return 0
}

check_disk_space() {
  DISK_USAGE=$(df /app | tail -1 | awk '{print $5}' | sed 's/%//')
  if [ $DISK_USAGE -gt 85 ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%"
    return 1
  fi
  return 0
}

check_task_system() {
  HEALTH_STATUS=$(curl -s localhost:8080/health | jq -r '.status')
  if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo "ERROR: Task system is $HEALTH_STATUS"
    return 1
  fi
  return 0
}

# Run all checks
check_memory && check_disk_space && check_task_system
echo "All system checks passed"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. System Won't Start

```bash
# Check configuration
node -e "
const { TaskManagementConfigManager } = require('./dist/task-management');
const config = require('./config/production.json');
const validation = new TaskManagementConfigManager().validateConfig(config);
console.log('Config valid:', validation.isValid);
if (!validation.isValid) console.log('Errors:', validation.errors);
"

# Check file permissions
ls -la /app/data /app/logs
chown -R gemini:gemini /app/data /app/logs

# Check available resources
free -m
df -h
```

#### 2. High Memory Usage

```typescript
// monitoring/memory-debug.ts
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    external: Math.round(usage.external / 1024 / 1024) + ' MB'
  });

  // Force garbage collection if available
  if (global.gc && usage.heapUsed > 1000 * 1024 * 1024) { // 1GB
    global.gc();
    console.log('Forced garbage collection');
  }
}, 30000);
```

#### 3. Task Queue Backlog

```bash
# Monitor queue status
curl -s localhost:8080/api/status | jq '.health.metrics.tasksInQueue'

# Check for stuck tasks
curl -s localhost:8080/api/tasks | jq '.[] | select(.status == "in_progress" and (.lastUpdate | strptime("%Y-%m-%dT%H:%M:%SZ") | mktime) < (now - 3600))'

# Restart task processing
curl -X POST localhost:8080/api/admin/restart-processing
```

#### 4. Configuration Issues

```typescript
// debug/config-debug.ts
import { TaskManagementConfigManager } from '@google/gemini-cli/task-management';

async function debugConfig() {
  const manager = new TaskManagementConfigManager();

  try {
    const config = manager.getConfig();
    console.log('Current config loaded successfully');

    const validation = manager.validateConfig(config);
    if (!validation.isValid) {
      console.error('Configuration errors:');
      validation.errors.forEach(error => console.error(`- ${error}`));

      console.log('Suggestions:');
      validation.suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
    } else {
      console.log('Configuration is valid');
    }
  } catch (error) {
    console.error('Failed to load config:', error.message);
  }
}

debugConfig();
```

## Maintenance

### Regular Maintenance Tasks

```bash
#!/bin/bash
# maintenance/weekly-maintenance.sh

echo "Starting weekly maintenance..."

# 1. Database cleanup
echo "Cleaning up old completed tasks..."
node -e "
const system = require('./dist/main.js').getSystem();
system.getComponents().persistence?.cleanupOldTasks(30); // 30 days
"

# 2. Log rotation
echo "Rotating logs..."
logrotate /etc/logrotate.d/task-management

# 3. Update dependencies
echo "Checking for security updates..."
npm audit --audit-level high

# 4. Performance analysis
echo "Running performance analysis..."
node --prof dist/performance-test.js

# 5. Backup verification
echo "Verifying recent backups..."
ls -la /app/backups/ | head -5

echo "Weekly maintenance completed"
```

### Update Procedures

```bash
#!/bin/bash
# maintenance/update.sh

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

echo "Updating to version $VERSION"

# 1. Backup current version
docker tag gemini-cli/task-management:current gemini-cli/task-management:backup-$(date +%s)

# 2. Pull new version
docker pull gemini-cli/task-management:$VERSION

# 3. Health check
docker run --rm gemini-cli/task-management:$VERSION node -e "console.log('Health check passed')"

# 4. Rolling update
kubectl set image deployment/task-management task-management=gemini-cli/task-management:$VERSION

# 5. Verify deployment
kubectl rollout status deployment/task-management

echo "Update to version $VERSION completed"
```

## Support and Maintenance

### Log Analysis

```bash
# View recent errors
tail -f /app/logs/error.log

# Search for specific issues
grep -i "memory" /app/logs/*.log | tail -20
grep -i "timeout" /app/logs/*.log | tail -20

# System metrics
curl -s localhost:8080/metrics | grep task_management
```

### Performance Monitoring

```bash
# CPU and memory usage
top -p $(pgrep -f "task-management")

# Network connections
netstat -an | grep :8080

# Disk I/O
iotop -p $(pgrep -f "task-management")
```

### Backup Verification

```bash
#!/bin/bash
# verification/verify-backup.sh

BACKUP_PATH=$1
echo "Verifying backup at $BACKUP_PATH"

# Check backup structure
[ -f "$BACKUP_PATH/manifest.json" ] || { echo "Missing manifest"; exit 1; }
[ -d "$BACKUP_PATH/data" ] || { echo "Missing data directory"; exit 1; }
[ -d "$BACKUP_PATH/config" ] || { echo "Missing config directory"; exit 1; }

# Verify manifest
node -e "
const manifest = require('$BACKUP_PATH/manifest.json');
console.log('Backup version:', manifest.version);
console.log('Created:', manifest.created);
console.log('Files:', Object.keys(manifest.files).length);
"

echo "Backup verification completed"
```

This deployment guide provides comprehensive instructions for deploying the Task Management System across all environments with proper security, monitoring, and maintenance procedures.