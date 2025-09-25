# Budget Management Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide helps you diagnose and resolve issues with the Gemini CLI Budget Management system. From basic configuration problems to advanced performance tuning, this guide provides step-by-step solutions for common challenges.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Configuration Problems](#configuration-problems)
- [Alert System Issues](#alert-system-issues)
- [Performance Problems](#performance-problems)
- [API Integration Issues](#api-integration-issues)
- [Data Corruption & Recovery](#data-corruption--recovery)
- [Advanced Debugging](#advanced-debugging)
- [Best Practices](#best-practices)

## Quick Diagnostics

### Diagnostic Commands

Run these commands to quickly identify common issues:

```bash
# Check budget system health
gemini budget get --json | jq '.'

# Test alert system
gemini budget test-alerts

# Validate configuration
gemini config validate

# Check file permissions and data integrity
ls -la .gemini/
cat .gemini/budget-usage.json

# Enable debug mode for detailed logging
DEBUG=budget gemini budget get

# Check for conflicting processes
ps aux | grep gemini
```

### Health Check Script

```bash
#!/bin/bash
# budget-health-check.sh

echo "🔍 Budget System Health Check"
echo "================================"

# Check if budget is enabled
BUDGET_STATUS=$(gemini budget get --json 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Budget system is accessible"

    ENABLED=$(echo "$BUDGET_STATUS" | jq -r '.enabled // false')
    if [ "$ENABLED" = "true" ]; then
        echo "✅ Budget tracking is enabled"

        LIMIT=$(echo "$BUDGET_STATUS" | jq -r '.dailyLimit // 0')
        USAGE=$(echo "$BUDGET_STATUS" | jq -r '.requestCount // 0')
        echo "📊 Usage: $USAGE/$LIMIT requests"
    else
        echo "⚠️  Budget tracking is disabled"
    fi
else
    echo "❌ Budget system is not accessible"
    exit 1
fi

# Check data directory
if [ -d ".gemini" ]; then
    echo "✅ Data directory exists"

    if [ -f ".gemini/budget-usage.json" ]; then
        echo "✅ Usage data file exists"

        # Validate JSON
        if jq empty .gemini/budget-usage.json 2>/dev/null; then
            echo "✅ Usage data is valid JSON"
        else
            echo "❌ Usage data is corrupted"
        fi
    else
        echo "⚠️  Usage data file missing (will be created)"
    fi

    if [ -f ".gemini/settings.json" ]; then
        echo "✅ Settings file exists"
    else
        echo "⚠️  Settings file missing"
    fi
else
    echo "❌ Data directory missing"
fi

# Check file permissions
GEMINI_DIR=".gemini"
if [ -d "$GEMINI_DIR" ]; then
    PERMS=$(stat -c "%a" "$GEMINI_DIR" 2>/dev/null || stat -f "%A" "$GEMINI_DIR" 2>/dev/null)
    if [ "$PERMS" = "755" ] || [ "$PERMS" = "drwxr-xr-x" ]; then
        echo "✅ Directory permissions are correct"
    else
        echo "⚠️  Directory permissions may be incorrect: $PERMS"
    fi
fi

echo "================================"
echo "Health check complete"
```

## Common Issues

### 1. Budget Not Working

**Symptoms:**

- Budget commands return errors
- Usage not being tracked
- Limits not being enforced

**Diagnosis:**

```bash
# Check if budget is enabled
gemini budget get

# Verify settings
gemini config list | grep budget

# Check for configuration errors
gemini config validate
```

**Solutions:**

#### Issue: Budget tracking is disabled

```bash
# Enable budget tracking with a daily limit
gemini budget set 200

# Or enable with custom settings
gemini budget enable --limit 250 --reset-time 08:00
```

#### Issue: Daily limit is 0 or not set

```bash
# Set a valid daily limit
gemini budget set 150

# Verify the change
gemini budget get
```

#### Issue: Configuration file corrupted

```bash
# Backup current config
cp .gemini/settings.json .gemini/settings.json.backup

# Reset budget configuration
gemini config reset budget

# Reconfigure budget
gemini budget set 200
```

### 2. Usage Count Incorrect

**Symptoms:**

- Usage count doesn't match actual requests
- Count resets unexpectedly
- Count doesn't increase

**Diagnosis:**

```bash
# Check usage data file
cat .gemini/budget-usage.json

# Verify file integrity
jq empty .gemini/budget-usage.json

# Check for multiple processes
ps aux | grep gemini
```

**Solutions:**

#### Issue: Multiple CLI instances running

```bash
# Kill all gemini processes
pkill -f gemini

# Restart with single instance
gemini budget get
```

#### Issue: Corrupted usage data

```bash
# Backup corrupted file
cp .gemini/budget-usage.json .gemini/budget-usage.json.corrupted

# Reset usage data
gemini budget reset --force

# Verify reset
gemini budget get
```

#### Issue: Time zone conflicts

```bash
# Check system time zone
date
timedatectl status  # Linux
systemsetup -gettimezone  # macOS

# Set explicit reset time
gemini budget set 200 --reset-time 00:00 --timezone UTC
```

### 3. Budget Not Resetting

**Symptoms:**

- Budget doesn't reset at specified time
- Old usage data persists
- Reset time seems wrong

**Diagnosis:**

```bash
# Check current settings
gemini budget get --json | jq '.settings.resetTime'

# Check system time
date

# Check usage data timestamp
cat .gemini/budget-usage.json | jq '.lastResetTime'
```

**Solutions:**

#### Issue: Wrong reset time format

```bash
# Use correct 24-hour format
gemini budget set 200 --reset-time 06:30

# Verify format
gemini budget get | grep "Reset Time"
```

#### Issue: System clock drift

```bash
# Sync system clock (Linux)
sudo ntpdate -s time.nist.gov

# Sync system clock (macOS)
sudo sntp -sS time.apple.com

# Force reset after sync
gemini budget reset
```

#### Issue: Process not running during reset time

```bash
# Check if reset mechanism works
gemini budget reset --test

# Set up cron job for automatic reset (optional)
echo "0 0 * * * /usr/local/bin/gemini budget reset" | crontab -
```

## Configuration Problems

### 1. Settings Not Persisting

**Symptoms:**

- Changes revert after restart
- Settings file not being updated
- Default values always used

**Diagnosis:**

```bash
# Check settings file permissions
ls -la .gemini/settings.json

# Verify write access
echo '{"test": true}' > .gemini/test-write.json && rm .gemini/test-write.json

# Check for read-only filesystem
touch .gemini/test-readonly && rm .gemini/test-readonly
```

**Solutions:**

#### Issue: Insufficient file permissions

```bash
# Fix permissions
chmod 644 .gemini/settings.json
chmod 755 .gemini/

# Verify fix
gemini config set budget.dailyLimit 200
gemini config get budget.dailyLimit
```

#### Issue: Read-only filesystem

```bash
# Check filesystem status
mount | grep "$(pwd)"

# Remount as read-write (if applicable)
sudo mount -o remount,rw /path/to/filesystem
```

#### Issue: Settings file locked by another process

```bash
# Check for file locks
lsof .gemini/settings.json

# Kill processes if necessary
kill -9 <process_id>
```

### 2. Invalid Configuration Values

**Symptoms:**

- Error messages about invalid settings
- Unexpected behavior with valid-looking settings
- Configuration validation failures

**Diagnosis:**

```bash
# Validate configuration
gemini config validate

# Check specific budget settings
gemini config get budget --json | jq '.'

# Test settings syntax
echo '{"dailyLimit": "invalid"}' | jq '.'
```

**Solutions:**

#### Issue: Wrong data types

```bash
# Correct data types:
gemini budget set 200                    # Number, not string
gemini config set budget.enabled true   # Boolean, not "true"

# Check current types
gemini config get budget --json | jq 'to_entries[]'
```

#### Issue: Out of range values

```bash
# Valid ranges:
gemini budget set 1      # Minimum 1
gemini budget set 10000  # Reasonable maximum

# Reset invalid values
gemini config reset budget.dailyLimit
```

#### Issue: Invalid time format

```bash
# Correct format: HH:MM (24-hour)
gemini budget set 200 --reset-time 23:59  # Valid
gemini budget set 200 --reset-time 08:30  # Valid

# Invalid formats:
# --reset-time 25:00  # Hour > 23
# --reset-time 8:30   # Missing leading zero
# --reset-time 8:30am # AM/PM not supported
```

### 3. Environment-Specific Issues

**Symptoms:**

- Works in development but not production
- Different behavior across environments
- Environment variables not being recognized

**Diagnosis:**

```bash
# Check environment variables
env | grep -i budget
env | grep -i gemini

# Verify environment-specific config
gemini config list --env production

# Check environment detection
echo $NODE_ENV
echo $ENVIRONMENT
```

**Solutions:**

#### Issue: Environment variables not set

```bash
# Set environment variables
export GEMINI_BUDGET_ENABLED=true
export GEMINI_BUDGET_LIMIT=500

# For production
export NODE_ENV=production
export GEMINI_BUDGET_LIMIT=1000

# Verify settings
gemini budget get
```

#### Issue: Config file precedence

```bash
# Check config file priority:
# 1. Command line arguments (highest)
# 2. Environment variables
# 3. Project config (.gemini/settings.json)
# 4. User config (~/.gemini/settings.json)
# 5. System config (/etc/gemini/settings.json)
# 6. Default values (lowest)

# Debug config resolution
DEBUG=config gemini budget get
```

## Alert System Issues

### 1. Alerts Not Triggering

**Symptoms:**

- No alerts despite reaching thresholds
- Alert settings appear correct
- No error messages

**Diagnosis:**

```bash
# Test alert system
gemini budget test-alerts

# Check alert configuration
gemini config get budget.alerts --json | jq '.'

# Manually trigger threshold
gemini budget set 100
# Use 75 requests to trigger 75% threshold
for i in {1..75}; do gemini budget record-test-request; done
```

**Solutions:**

#### Issue: Alert system disabled

```bash
# Enable alert system
gemini config set budget.alerts.enabled true

# Enable specific thresholds
gemini config set budget.alerts.thresholds[0].enabled true
```

#### Issue: Thresholds not properly configured

```bash
# Check current thresholds
gemini config get budget.alerts.thresholds

# Reset to defaults
gemini config reset budget.alerts.thresholds

# Or set manually
gemini budget set 200 --warnings 50,75,90
```

#### Issue: Alert aggregation preventing notifications

```bash
# Disable aggregation temporarily
gemini config set budget.alerts.aggregation.enabled false

# Or adjust aggregation settings
gemini config set budget.alerts.aggregation.windowMinutes 60
gemini config set budget.alerts.aggregation.maxAlertsPerWindow 10
```

### 2. Email Alerts Not Working

**Symptoms:**

- Console alerts work but emails don't send
- No error messages about email delivery
- Email configuration appears correct

**Diagnosis:**

```bash
# Test email configuration
gemini budget test-alerts --channels email

# Check SMTP settings
gemini config get budget.alerts.notifications.email

# Test SMTP connection manually
telnet smtp.example.com 587
```

**Solutions:**

#### Issue: Incorrect SMTP configuration

```bash
# Update SMTP settings
gemini config set budget.alerts.notifications.email.smtpConfig.host "smtp.gmail.com"
gemini config set budget.alerts.notifications.email.smtpConfig.port 587
gemini config set budget.alerts.notifications.email.smtpConfig.secure true

# Set authentication
gemini config set budget.alerts.notifications.email.smtpConfig.auth.user "your-email@gmail.com"
gemini config set budget.alerts.notifications.email.smtpConfig.auth.pass "your-app-password"
```

#### Issue: Firewall blocking SMTP

```bash
# Test connectivity
nc -zv smtp.gmail.com 587
nc -zv smtp.gmail.com 465

# Check firewall rules
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS/RHEL
```

#### Issue: Authentication failure

```bash
# For Gmail, use app passwords instead of main password
# For Office 365, ensure modern authentication is enabled
# For custom SMTP, verify username/password format

# Test authentication separately
gemini config test-smtp --debug
```

### 3. Webhook Alerts Not Delivered

**Symptoms:**

- Webhook URL configured but no notifications received
- Request timeouts or failures
- External service doesn't receive data

**Diagnosis:**

```bash
# Test webhook delivery
gemini budget test-alerts --channels webhook

# Check webhook configuration
gemini config get budget.alerts.notifications.webhook

# Test webhook URL manually
curl -X POST -H "Content-Type: application/json" \
  -d '{"test": "message"}' \
  "https://your-webhook-url.com"
```

**Solutions:**

#### Issue: Incorrect webhook URL

```bash
# Verify URL format
gemini config set budget.alerts.notifications.webhook.url "https://hooks.slack.com/services/..."

# Test URL accessibility
curl -I "https://your-webhook-url.com"
```

#### Issue: Wrong request format

```bash
# Check expected format for your service
# Slack expects different format than Teams or custom webhooks

# Configure headers if needed
gemini config set budget.alerts.notifications.webhook.headers.Authorization "Bearer token"
gemini config set budget.alerts.notifications.webhook.headers.Content-Type "application/json"
```

#### Issue: Network connectivity

```bash
# Test DNS resolution
nslookup hooks.slack.com

# Test HTTPS connectivity
openssl s_client -connect hooks.slack.com:443

# Check proxy settings
env | grep -i proxy
```

## Performance Problems

### 1. Slow Budget Operations

**Symptoms:**

- Budget commands take a long time to complete
- High CPU usage during budget operations
- Delays in request recording

**Diagnosis:**

```bash
# Time budget operations
time gemini budget get
time gemini budget record-request

# Monitor system resources
top -p $(pgrep gemini)
htop

# Check file I/O
iostat -x 1
```

**Solutions:**

#### Issue: Large usage data file

```bash
# Check file size
ls -lh .gemini/budget-usage.json

# Archive old data
gemini budget archive --days 90

# Optimize data structure
gemini budget optimize-data
```

#### Issue: Concurrent access conflicts

```bash
# Implement file locking
gemini config set budget.fileLocking true

# Use database backend for high concurrency
gemini config set budget.backend redis
# or
gemini config set budget.backend sqlite
```

#### Issue: Network latency for remote storage

```bash
# Use local caching
gemini config set budget.cache.enabled true
gemini config set budget.cache.ttl 300  # 5 minutes

# Switch to local storage
gemini config set budget.storage local
```

### 2. Memory Usage Issues

**Symptoms:**

- High memory consumption
- Memory leaks over time
- Out of memory errors

**Diagnosis:**

```bash
# Monitor memory usage
ps aux | grep gemini
valgrind --tool=memcheck gemini budget get

# Check for memory leaks
DEBUG=memory gemini budget get
```

**Solutions:**

#### Issue: Memory leaks in long-running processes

```bash
# Restart service periodically
crontab -e
# Add: 0 */6 * * * systemctl restart gemini-budget

# Enable garbage collection tuning
export NODE_OPTIONS="--max-old-space-size=512"
```

#### Issue: Large in-memory data structures

```bash
# Enable streaming mode
gemini config set budget.streaming true

# Reduce data retention
gemini config set budget.retention.days 30
```

### 3. High Latency Alerts

**Symptoms:**

- Long delays between threshold breach and alert
- Alert processing queue backlog
- Missed critical alerts

**Diagnosis:**

```bash
# Check alert queue
gemini budget alert-queue status

# Monitor alert processing time
DEBUG=alerts gemini budget get

# Check external service response times
curl -w "@curl-format.txt" -s -o /dev/null https://hooks.slack.com/services/...
```

**Solutions:**

#### Issue: Slow external notification services

```bash
# Implement async delivery
gemini config set budget.alerts.async true

# Set reasonable timeouts
gemini config set budget.alerts.notifications.webhook.timeoutMs 5000

# Add retry logic
gemini config set budget.alerts.notifications.webhook.retries 3
```

#### Issue: Alert processing bottleneck

```bash
# Increase processing concurrency
gemini config set budget.alerts.concurrency 5

# Implement alert batching
gemini config set budget.alerts.batching.enabled true
gemini config set budget.alerts.batching.maxSize 10
```

## API Integration Issues

### 1. Budget API Errors

**Symptoms:**

- API endpoints return errors
- Authentication failures
- Request timeouts

**Diagnosis:**

```bash
# Test API connectivity
curl -H "Authorization: Bearer your-token" \
  http://localhost:3000/api/v1/budget/status

# Check API logs
tail -f logs/budget-api.log

# Verify API server status
netstat -tlnp | grep :3000
```

**Solutions:**

#### Issue: API server not running

```bash
# Start API server
gemini budget start-api --port 3000

# Enable auto-start
systemctl enable gemini-budget-api
systemctl start gemini-budget-api
```

#### Issue: Authentication problems

```bash
# Generate new API key
gemini auth generate-api-key

# Update API key in requests
export GEMINI_API_KEY="your-new-key"

# Verify authentication
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  http://localhost:3000/api/v1/budget/status
```

#### Issue: API rate limiting

```bash
# Check rate limit headers
curl -I http://localhost:3000/api/v1/budget/status

# Implement proper backoff
gemini config set api.rateLimit.backoff exponential
```

### 2. SDK Integration Problems

**Symptoms:**

- SDK methods throwing errors
- Incorrect response formats
- Type mismatches

**Diagnosis:**

```bash
# Check SDK version compatibility
npm list @google/gemini-cli-budget

# Verify API compatibility
gemini --version
```

**Solutions:**

#### Issue: SDK version mismatch

```bash
# Update SDK to latest version
npm update @google/gemini-cli-budget

# Or install specific compatible version
npm install @google/gemini-cli-budget@^1.0.0
```

#### Issue: TypeScript type errors

```bash
# Update TypeScript definitions
npm install --save-dev @types/gemini-cli-budget

# Regenerate types
gemini generate-types
```

### 3. Webhook Integration Issues

**Symptoms:**

- Webhooks not being received
- Invalid webhook payloads
- Authentication failures

**Diagnosis:**

```bash
# Test webhook delivery
gemini budget test-webhook --url https://your-app.com/webhook

# Check webhook logs
tail -f logs/webhook-delivery.log

# Validate webhook signature
gemini budget verify-webhook --payload '{"test": true}' --signature "sha256=..."
```

**Solutions:**

#### Issue: Webhook signature validation

```bash
# Configure webhook secret
export WEBHOOK_SECRET="your-secret-key"

# Verify signature in your webhook handler
# See documentation for signature verification examples
```

#### Issue: Webhook payload format

```bash
# Check expected payload format
gemini budget webhook-schema

# Test with custom payload
gemini budget send-webhook --test-payload
```

## Data Corruption & Recovery

### 1. Corrupted Usage Data

**Symptoms:**

- Invalid JSON in usage data file
- Impossible usage values
- Missing required fields

**Diagnosis:**

```bash
# Validate JSON syntax
jq empty .gemini/budget-usage.json

# Check data structure
jq 'keys' .gemini/budget-usage.json

# Verify data integrity
gemini budget validate-data
```

**Recovery:**

```bash
# Backup corrupted data
cp .gemini/budget-usage.json .gemini/budget-usage.json.corrupted.$(date +%s)

# Attempt automatic repair
gemini budget repair-data

# If repair fails, restore from backup
cp .gemini/budget-usage.json.backup .gemini/budget-usage.json

# Or reset to clean state
gemini budget reset --force
```

### 2. Settings File Corruption

**Symptoms:**

- Configuration commands fail
- Settings revert to defaults
- JSON parse errors

**Diagnosis:**

```bash
# Check settings file integrity
jq empty .gemini/settings.json

# Validate settings structure
gemini config validate
```

**Recovery:**

```bash
# Backup corrupted settings
cp .gemini/settings.json .gemini/settings.json.corrupted.$(date +%s)

# Restore from backup
if [ -f .gemini/settings.json.backup ]; then
  cp .gemini/settings.json.backup .gemini/settings.json
fi

# Or recreate with defaults
rm .gemini/settings.json
gemini config init
gemini budget set 200  # Reconfigure budget
```

### 3. Complete Data Recovery

**Symptoms:**

- Entire .gemini directory missing or corrupted
- All configuration and usage data lost
- Clean slate required

**Recovery Process:**

```bash
# 1. Create fresh data directory
rm -rf .gemini
mkdir .gemini
chmod 755 .gemini

# 2. Initialize configuration
gemini config init

# 3. Reconfigure budget settings
gemini budget set 200 --reset-time 00:00 --warnings 50,75,90

# 4. Configure alerts (if needed)
gemini config set budget.alerts.enabled true

# 5. Test configuration
gemini budget get
gemini budget test-alerts

# 6. Set up backup system
gemini config set backup.enabled true
gemini config set backup.interval daily
```

## Advanced Debugging

### 1. Debug Mode Configuration

Enable detailed logging for troubleshooting:

```bash
# Enable debug mode globally
export DEBUG=budget*

# Enable specific debug categories
export DEBUG=budget:tracker,budget:alerts,budget:api

# Debug with verbose output
gemini budget get --verbose --debug

# Save debug output to file
DEBUG=budget* gemini budget get 2>&1 | tee debug.log
```

### 2. Tracing Request Flow

Track budget requests through the system:

```bash
# Enable request tracing
export DEBUG=budget:trace

# Trace a specific request
gemini budget record-request --trace

# View trace output
tail -f logs/budget-trace.log
```

### 3. Performance Profiling

Identify performance bottlenecks:

```bash
# Profile budget operations
node --prof $(which gemini) budget get

# Process profiling data
node --prof-process isolate-*.log > profile.txt

# Memory profiling
node --inspect-brk $(which gemini) budget get
# Then connect with Chrome DevTools
```

### 4. Database Query Analysis

For database-backed storage:

```bash
# Enable SQL query logging
export DEBUG=budget:sql

# Analyze slow queries
gemini budget analyze-queries

# Database optimization
gemini budget optimize-db
```

### 5. Network Debugging

Debug network-related issues:

```bash
# Capture network traffic
sudo tcpdump -i any -w budget-traffic.pcap port 3000

# Debug HTTP requests
export DEBUG=budget:http

# Test connectivity
gemini budget network-test
```

## Best Practices

### 1. Monitoring & Alerting

Set up comprehensive monitoring:

```bash
# Health check script (run via cron)
#!/bin/bash
if ! gemini budget get >/dev/null 2>&1; then
    echo "Budget system health check failed" | mail -s "Budget Alert" admin@example.com
fi

# Performance monitoring
gemini budget metrics --output prometheus > /var/lib/node_exporter/budget-metrics.prom
```

### 2. Backup Strategy

Implement regular backups:

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/gemini-budget"

mkdir -p "$BACKUP_DIR/$DATE"
cp -r .gemini/ "$BACKUP_DIR/$DATE/"

# Compress and cleanup old backups
tar -czf "$BACKUP_DIR/budget-backup-$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

### 3. Configuration Management

Version control your configuration:

```bash
# Initialize git for config management
cd .gemini
git init
echo "*.tmp" > .gitignore
echo "*.log" >> .gitignore

# Commit configuration
git add settings.json
git commit -m "Initial budget configuration"

# Track changes
git diff HEAD~1 settings.json
```

### 4. Security Hardening

Secure your budget system:

```bash
# Set proper file permissions
chmod 600 .gemini/settings.json  # Only owner can read/write
chmod 755 .gemini/              # Directory accessible but protected

# Use environment variables for secrets
export GEMINI_WEBHOOK_SECRET="$(openssl rand -hex 32)"
export GEMINI_API_KEY="$(openssl rand -hex 32)"

# Regular security audits
gemini budget security-audit
```

### 5. Testing Strategy

Implement comprehensive testing:

```bash
# Automated testing script
#!/bin/bash
echo "Running budget system tests..."

# Test basic functionality
gemini budget set 100
gemini budget get >/dev/null || exit 1

# Test alert system
gemini budget test-alerts || exit 1

# Test API endpoints
curl -f http://localhost:3000/api/v1/budget/status >/dev/null || exit 1

# Performance test
time gemini budget get >/dev/null

echo "All tests passed!"
```

### 6. Log Management

Set up proper logging:

```bash
# Configure log rotation
cat > /etc/logrotate.d/gemini-budget << EOF
/var/log/gemini-budget.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload gemini-budget || true
    endscript
}
EOF
```

### 7. Documentation Maintenance

Keep documentation current:

```bash
# Generate configuration documentation
gemini config document > docs/configuration.md

# Document API endpoints
gemini api document > docs/api-reference.md

# Export troubleshooting data
gemini budget export-diagnostics > docs/diagnostics.json
```

## Getting Help

### 1. Community Support

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share solutions
- **Wiki**: Community-maintained documentation
- **Discord/Slack**: Real-time community help

### 2. Professional Support

- **Enterprise Support**: Priority support for business users
- **Training**: On-site training and workshops
- **Consulting**: Custom implementation services
- **SLA**: Service level agreements for critical systems

### 3. Self-Help Resources

- **Debug Mode**: Use DEBUG environment variables
- **Health Checks**: Regular system diagnostics
- **Log Analysis**: Comprehensive logging system
- **Performance Monitoring**: Built-in metrics collection

### 4. Escalation Process

1. **Self-diagnosis**: Use this troubleshooting guide
2. **Community**: Post in discussions or Discord
3. **Issue Report**: Create detailed GitHub issue
4. **Support Ticket**: For enterprise customers
5. **Emergency**: Use emergency support channels

---

## Quick Reference

### Essential Commands

```bash
# System health
gemini budget get --json | jq '.'
gemini budget test-alerts
gemini config validate

# Data management
gemini budget reset --force
gemini budget archive --days 30
gemini budget optimize-data

# Debugging
DEBUG=budget* gemini budget get
gemini budget --verbose --trace get
gemini budget network-test

# Recovery
gemini budget repair-data
gemini budget restore-backup
gemini config reset budget
```

### Configuration Locations

- **Project Config**: `.gemini/settings.json`
- **User Config**: `~/.gemini/settings.json`
- **System Config**: `/etc/gemini/settings.json`
- **Usage Data**: `.gemini/budget-usage.json`
- **Logs**: `.gemini/logs/` or `/var/log/gemini/`

### Emergency Procedures

1. **System Down**: Restart with `gemini budget restart`
2. **Data Corruption**: Use `gemini budget repair-data`
3. **Config Issues**: Reset with `gemini config reset budget`
4. **Performance**: Enable `DEBUG=budget:performance`
5. **Security**: Rotate keys with `gemini auth rotate-keys`

---

_This troubleshooting guide is continuously updated based on user feedback and common issues. For the latest version, visit the documentation repository._

_Last updated: September 2024_
_Version: 2.0_
