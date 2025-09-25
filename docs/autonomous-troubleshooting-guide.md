# Autonomous Task Management - Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting information for the Autonomous Task Management system in Gemini CLI. It covers common issues, diagnostic procedures, and resolution strategies to help maintain optimal system performance.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Agent-Related Problems](#agent-related-problems)
4. [Task Execution Issues](#task-execution-issues)
5. [Performance Problems](#performance-problems)
6. [Configuration Issues](#configuration-issues)
7. [System Health Monitoring](#system-health-monitoring)
8. [Recovery Procedures](#recovery-procedures)
9. [Debug Information Collection](#debug-information-collection)
10. [Advanced Troubleshooting](#advanced-troubleshooting)

## Quick Diagnostics

### System Health Check

Run these commands to quickly assess system status:

```bash
# Check system status
gemini status --autonomous

# Verify agent availability
gemini agents --health-check

# Check task queue status
gemini tasks --queue-status

# Resource utilization
gemini system --resources
```

### Basic Troubleshooting Checklist

- [ ] Autonomous mode enabled: `gemini config get autonomous.enabled`
- [ ] Sufficient system resources (RAM > 2GB free, CPU < 80%)
- [ ] Network connectivity for model API calls
- [ ] Valid API keys and authentication
- [ ] No conflicting processes or file locks
- [ ] Latest Gemini CLI version installed

## Common Issues

### Issue 1: Autonomous Mode Not Starting

**Symptoms:**

- Commands hang without autonomous agent deployment
- "Autonomous mode unavailable" errors
- Agents fail to initialize

**Diagnosis:**

```bash
# Check autonomous configuration
gemini config list | grep autonomous

# Verify agent system
gemini agents --diagnose

# Check system requirements
gemini system --check-requirements
```

**Solutions:**

1. **Enable Autonomous Mode:**

```bash
gemini config set autonomous.enabled true
gemini restart
```

2. **Verify Installation:**

```bash
# Reinstall autonomous components
gemini install --autonomous --force

# Update to latest version
gemini update --include-autonomous
```

3. **Reset Configuration:**

```bash
# Backup current config
cp ~/.gemini/config.yaml ~/.gemini/config.backup

# Reset autonomous settings
gemini config reset autonomous
gemini config set autonomous.enabled true
```

### Issue 2: Tasks Failing to Execute

**Symptoms:**

- Tasks stuck in "pending" status
- "No available agents" errors
- Task timeouts

**Diagnosis:**

```bash
# Check task status
gemini tasks list --detailed

# Agent availability
gemini agents list --status

# Resource constraints
gemini system --memory --cpu
```

**Solutions:**

1. **Increase Agent Pool:**

```bash
gemini config set autonomous.agents.max_concurrent 8
gemini config set autonomous.agents.pool_size 10
```

2. **Adjust Timeouts:**

```bash
gemini config set autonomous.tasks.default_timeout 1800  # 30 minutes
gemini config set autonomous.tasks.max_timeout 3600     # 1 hour
```

3. **Free System Resources:**

```bash
# Kill hung agents
gemini agents --kill-hung

# Clear completed tasks
gemini tasks --cleanup --completed --older-than 1h

# Restart agent pool
gemini agents --restart-pool
```

### Issue 3: Poor Task Quality

**Symptoms:**

- Tasks complete but produce incorrect results
- Inconsistent output quality
- Missing validation checks

**Diagnosis:**

```bash
# Check agent performance metrics
gemini agents --performance-stats

# Review task validation settings
gemini config get autonomous.validation

# Analyze recent task results
gemini tasks --analyze-quality --last 10
```

**Solutions:**

1. **Increase Validation Requirements:**

```bash
gemini config set autonomous.validation.level strict
gemini config set autonomous.validation.require_tests true
gemini config set autonomous.validation.require_documentation true
```

2. **Use Specialized Agents:**

```bash
# Enable specialist agent routing
gemini config set autonomous.agents.use_specialists true
gemini config set autonomous.agents.auto_select_best true
```

3. **Add Quality Gates:**

```bash
gemini config set autonomous.quality.min_test_coverage 80
gemini config set autonomous.quality.require_linting true
gemini config set autonomous.quality.security_scan true
```

## Agent-Related Problems

### Hung or Unresponsive Agents

**Symptoms:**

- Agents not responding to commands
- Tasks stuck in "executing" state
- High CPU usage from agent processes

**Diagnosis:**

```bash
# List all agents with detailed status
gemini agents list --detailed --include-hung

# Check agent resource usage
gemini agents --resource-usage

# Review agent logs
gemini logs --agent [AGENT_ID] --tail 100
```

**Solutions:**

1. **Force Kill Hung Agents:**

```bash
# Kill specific agent
gemini agents kill [AGENT_ID] --force

# Kill all hung agents
gemini agents --kill-hung --force

# Emergency stop all agents
gemini agents --emergency-stop
```

2. **Restart Agent Pool:**

```bash
# Graceful restart
gemini agents --restart-pool --graceful

# Force restart
gemini agents --restart-pool --force

# Reset entire agent system
gemini agents --reset --confirm
```

### Agent Communication Issues

**Symptoms:**

- Agents can't coordinate tasks
- Duplicate work being performed
- Conflicting changes from multiple agents

**Diagnosis:**

```bash
# Check inter-agent communication
gemini agents --check-communication

# Review coordination logs
gemini logs --coordination --last 1h

# Verify agent registry
gemini agents --verify-registry
```

**Solutions:**

1. **Reset Agent Coordination:**

```bash
# Clear coordination state
gemini agents --clear-coordination-state

# Restart coordination service
gemini coordination --restart

# Rebuild agent registry
gemini agents --rebuild-registry
```

2. **Adjust Coordination Settings:**

```bash
gemini config set autonomous.coordination.conflict_resolution strict
gemini config set autonomous.coordination.heartbeat_interval 5
gemini config set autonomous.coordination.timeout 30
```

## Task Execution Issues

### Tasks Timing Out

**Symptoms:**

- Frequent timeout errors
- Tasks taking longer than expected
- Incomplete results due to timeouts

**Analysis:**

```bash
# Review task performance metrics
gemini tasks --performance-analysis

# Check timeout patterns
gemini tasks --timeout-analysis --last-week

# Resource usage during task execution
gemini system --monitor-during-tasks
```

**Solutions:**

1. **Optimize Task Timeouts:**

```bash
# Increase default timeouts
gemini config set autonomous.tasks.default_timeout 2400  # 40 minutes
gemini config set autonomous.tasks.complex_timeout 3600  # 60 minutes

# Enable dynamic timeout adjustment
gemini config set autonomous.tasks.adaptive_timeout true
```

2. **Break Down Complex Tasks:**

```bash
# Enable automatic task decomposition
gemini config set autonomous.tasks.auto_decompose true
gemini config set autonomous.tasks.max_subtasks 8

# Set complexity thresholds
gemini config set autonomous.tasks.complexity_threshold medium
```

### Inconsistent Task Results

**Symptoms:**

- Same task produces different results
- Quality varies between executions
- Non-deterministic behavior

**Investigation:**

```bash
# Compare task execution logs
gemini tasks compare-executions [TASK_ID_1] [TASK_ID_2]

# Analyze result variations
gemini tasks --analyze-consistency --task-type [TYPE]

# Check for non-deterministic factors
gemini system --check-determinism
```

**Solutions:**

1. **Improve Result Consistency:**

```bash
# Enable deterministic mode
gemini config set autonomous.execution.deterministic true

# Use fixed random seeds
gemini config set autonomous.execution.random_seed 12345

# Enable result validation
gemini config set autonomous.validation.cross_validate true
```

2. **Add Result Verification:**

```bash
# Enable multi-agent verification
gemini config set autonomous.validation.multi_agent_check true

# Set consistency requirements
gemini config set autonomous.validation.consistency_threshold 0.9
```

## Performance Problems

### High Resource Usage

**Symptoms:**

- System slowdown during autonomous tasks
- Excessive memory consumption
- High CPU utilization

**Monitoring:**

```bash
# Real-time resource monitoring
gemini system --monitor-resources --real-time

# Agent resource usage breakdown
gemini agents --resource-breakdown

# Task resource profiling
gemini tasks --profile-resources --active
```

**Optimization:**

1. **Reduce Resource Consumption:**

```bash
# Limit concurrent agents
gemini config set autonomous.agents.max_concurrent 4

# Reduce memory per agent
gemini config set autonomous.agents.memory_limit 1GB

# Enable resource cleanup
gemini config set autonomous.cleanup.aggressive true
```

2. **Optimize Task Scheduling:**

```bash
# Enable intelligent scheduling
gemini config set autonomous.scheduler.intelligent true

# Prioritize by resource usage
gemini config set autonomous.scheduler.resource_aware true

# Enable task queuing
gemini config set autonomous.scheduler.enable_queue true
```

### Slow Task Execution

**Symptoms:**

- Tasks take much longer than expected
- Agents appear to be working inefficiently
- Delayed responses from the system

**Analysis:**

```bash
# Performance profiling
gemini tasks --profile-performance --detailed

# Bottleneck analysis
gemini system --find-bottlenecks

# Execution trace analysis
gemini tasks --trace-execution [TASK_ID]
```

**Optimization:**

1. **Improve Execution Speed:**

```bash
# Enable parallel execution
gemini config set autonomous.execution.parallel true

# Increase worker threads
gemini config set autonomous.execution.worker_threads 6

# Use cached results
gemini config set autonomous.cache.enabled true
```

2. **Optimize Agent Performance:**

```bash
# Enable agent warm-up
gemini config set autonomous.agents.warm_up true

# Use agent specialization
gemini config set autonomous.agents.specialize true

# Enable performance monitoring
gemini config set autonomous.monitoring.performance true
```

## Configuration Issues

### Invalid Configuration Settings

**Symptoms:**

- Configuration errors on startup
- Settings not taking effect
- Validation failures

**Validation:**

```bash
# Validate current configuration
gemini config validate --autonomous

# Check configuration syntax
gemini config check-syntax

# Verify setting compatibility
gemini config --check-compatibility
```

**Resolution:**

1. **Fix Configuration Errors:**

```bash
# Reset to default settings
gemini config reset autonomous --confirm

# Restore from backup
gemini config restore ~/.gemini/config.backup

# Interactive configuration wizard
gemini config setup --autonomous --interactive
```

2. **Verify Settings:**

```bash
# List all autonomous settings
gemini config list autonomous

# Check setting sources
gemini config --show-sources autonomous

# Validate environment variables
gemini config --check-env-vars
```

### Environment-Specific Issues

**Symptoms:**

- Works in one environment but not another
- Inconsistent behavior across deployments
- Environment variable conflicts

**Diagnosis:**

```bash
# Compare environment configurations
gemini config compare-environments

# Check environment variables
gemini system --check-env-vars

# Validate environment compatibility
gemini system --validate-environment
```

**Solutions:**

1. **Standardize Environments:**

```bash
# Export configuration
gemini config export --autonomous > autonomous-config.yaml

# Import in other environments
gemini config import autonomous-config.yaml

# Validate consistency
gemini config --validate-consistency
```

## System Health Monitoring

### Health Check Commands

```bash
# Comprehensive system health check
gemini health-check --autonomous --detailed

# Agent pool health
gemini agents --health-summary

# Task system health
gemini tasks --health-check

# Resource utilization health
gemini system --health-resources
```

### Monitoring Metrics

**Key Metrics to Track:**

1. **Agent Metrics:**
   - Active agents vs. configured maximum
   - Agent response times
   - Task completion rates
   - Error rates per agent

2. **Task Metrics:**
   - Task queue length
   - Average execution time
   - Success/failure rates
   - Timeout frequency

3. **System Metrics:**
   - Memory usage trends
   - CPU utilization patterns
   - Network latency
   - Disk I/O performance

**Automated Monitoring Setup:**

```bash
# Enable monitoring
gemini config set monitoring.enabled true
gemini config set monitoring.interval 60  # seconds

# Configure alerts
gemini config set alerts.enabled true
gemini config set alerts.email "admin@example.com"

# Set thresholds
gemini config set alerts.agent_failure_threshold 0.1
gemini config set alerts.memory_threshold 0.8
gemini config set alerts.task_timeout_threshold 0.2
```

## Recovery Procedures

### Emergency Recovery

**When System is Completely Unresponsive:**

1. **Emergency Stop:**

```bash
# Force stop all autonomous operations
gemini emergency-stop --autonomous --force

# Kill all agent processes
pkill -f "gemini-agent"

# Clear locks and temporary files
gemini cleanup --emergency --all
```

2. **System Reset:**

```bash
# Reset autonomous system
gemini reset --autonomous --confirm

# Reinitialize agent pool
gemini agents --init-pool --force

# Restart with minimal configuration
gemini start --autonomous --minimal
```

### Gradual Recovery

**For Less Severe Issues:**

1. **Graceful Shutdown:**

```bash
# Stop accepting new tasks
gemini tasks --stop-intake

# Complete running tasks
gemini tasks --wait-completion --timeout 300

# Shutdown agents gracefully
gemini agents --shutdown --graceful
```

2. **Selective Restart:**

```bash
# Restart specific components
gemini coordination --restart
gemini task-queue --restart
gemini agents --restart-pool

# Verify functionality
gemini health-check --autonomous
```

### Data Recovery

**Recovering Lost Task Data:**

```bash
# Restore from backups
gemini tasks --restore-from-backup --latest

# Recover from logs
gemini tasks --recover-from-logs --date today

# Rebuild task index
gemini tasks --rebuild-index
```

## Debug Information Collection

### Comprehensive Debug Collection

```bash
# Collect all debug information
gemini debug collect --autonomous --output debug-bundle.zip

# This includes:
# - Configuration files
# - Log files (last 24 hours)
# - Agent status and metrics
# - Task execution history
# - System resource usage
# - Error reports
```

### Specific Debug Commands

```bash
# Agent debugging
gemini debug agents --include-internal-state
gemini debug agents --trace-communications

# Task debugging
gemini debug tasks --execution-trace [TASK_ID]
gemini debug tasks --state-dump [TASK_ID]

# System debugging
gemini debug system --resource-trace
gemini debug system --performance-profile
```

### Log Analysis

```bash
# View logs by component
gemini logs --component agents --level error --last 1h
gemini logs --component tasks --grep "timeout" --last 6h
gemini logs --component coordination --detailed --last 30m

# Export logs for analysis
gemini logs export --autonomous --format json --output logs.json

# Log rotation and cleanup
gemini logs --rotate --keep 7  # Keep 7 days
gemini logs --cleanup --older-than 30d
```

## Advanced Troubleshooting

### Performance Profiling

**Detailed Performance Analysis:**

```bash
# CPU profiling
gemini profile --cpu --duration 60s --output cpu-profile.json

# Memory profiling
gemini profile --memory --interval 5s --duration 300s

# Task execution profiling
gemini profile --tasks --trace-all --output task-traces/
```

**Bottleneck Identification:**

```bash
# Find system bottlenecks
gemini analyze --bottlenecks --detailed

# Agent performance analysis
gemini analyze --agents --efficiency --output agent-analysis.json

# Task pattern analysis
gemini analyze --tasks --patterns --last-week
```

### Network Issues

**Diagnosing Network Problems:**

```bash
# Test API connectivity
gemini network test --api --timeout 10

# Check network latency
gemini network latency --endpoints

# Verify firewall settings
gemini network check-firewall --autonomous-ports
```

**Network Optimization:**

```bash
# Configure connection pooling
gemini config set network.connection_pool_size 10
gemini config set network.keep_alive true

# Adjust timeouts
gemini config set network.connect_timeout 10
gemini config set network.read_timeout 30

# Enable retry logic
gemini config set network.retry_attempts 3
gemini config set network.retry_backoff exponential
```

### Model Integration Issues

**API-Related Problems:**

```bash
# Test model API connectivity
gemini model test-connection --all-providers

# Check API key validity
gemini auth verify --all-providers

# Monitor API usage
gemini usage --api-calls --last 24h
```

**Model Performance Optimization:**

```bash
# Configure model selection strategy
gemini config set models.selection_strategy optimal

# Set model-specific timeouts
gemini config set models.timeout.claude 120
gemini config set models.timeout.gpt4 180

# Enable model fallback
gemini config set models.fallback_enabled true
```

### Database and State Issues

**State Corruption:**

```bash
# Check state consistency
gemini state verify --autonomous

# Repair corrupted state
gemini state repair --autonomous --backup-first

# Reset state (last resort)
gemini state reset --autonomous --confirm
```

**Database Issues:**

```bash
# Check database integrity
gemini db check --repair-if-needed

# Optimize database performance
gemini db optimize --vacuum --reindex

# Backup database
gemini db backup --output autonomous-db-backup.sql
```

## Preventive Measures

### Regular Maintenance

**Daily Tasks:**

- [ ] Check system health: `gemini health-check --autonomous`
- [ ] Monitor resource usage: `gemini system --resources`
- [ ] Review error logs: `gemini logs --errors --last 24h`
- [ ] Cleanup completed tasks: `gemini tasks --cleanup --completed`

**Weekly Tasks:**

- [ ] Analyze performance metrics: `gemini analyze --performance --last-week`
- [ ] Update configuration if needed: `gemini config validate --autonomous`
- [ ] Backup configuration: `gemini config backup`
- [ ] Review and archive logs: `gemini logs --archive --older-than 7d`

**Monthly Tasks:**

- [ ] Full system analysis: `gemini analyze --comprehensive --last-month`
- [ ] Update Gemini CLI: `gemini update`
- [ ] Review and optimize configuration: `gemini config optimize`
- [ ] Database maintenance: `gemini db optimize --full`

### Monitoring Setup

**Automated Monitoring Configuration:**

```yaml
# ~/.gemini/monitoring.yaml
monitoring:
  enabled: true
  interval: 60 # seconds
  metrics:
    agents:
      - active_count
      - response_time
      - error_rate
      - memory_usage
    tasks:
      - queue_length
      - completion_rate
      - average_duration
      - timeout_rate
    system:
      - cpu_usage
      - memory_usage
      - disk_usage
      - network_latency

alerts:
  enabled: true
  channels:
    - email: admin@example.com
    - slack: '#autonomous-alerts'
  thresholds:
    agent_failure_rate: 0.1
    memory_usage: 0.8
    task_timeout_rate: 0.2
    queue_length: 50
```

### Best Practices for Issue Prevention

1. **Resource Management:**
   - Monitor resource usage regularly
   - Set appropriate limits for agents and tasks
   - Use resource cleanup policies

2. **Configuration Management:**
   - Version control configuration files
   - Test changes in staging environments
   - Maintain configuration documentation

3. **Monitoring and Alerting:**
   - Set up comprehensive monitoring
   - Configure appropriate alert thresholds
   - Regularly review and update monitoring rules

4. **Documentation:**
   - Keep troubleshooting procedures updated
   - Document known issues and solutions
   - Maintain runbooks for common scenarios

5. **Regular Maintenance:**
   - Follow maintenance schedules
   - Keep system components updated
   - Perform regular backups

## Getting Help

### Support Channels

- **Documentation**: Check the comprehensive guides in `/docs/`
- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Ask questions and share solutions
- **Professional Support**: Available for enterprise users

### When to Escalate

Escalate issues when:

- System-wide failures persist after following recovery procedures
- Data corruption or loss occurs
- Security vulnerabilities are discovered
- Performance degradation affects critical operations
- Multiple troubleshooting attempts fail to resolve the issue

### Information to Include When Reporting Issues

1. **System Information:**
   - Gemini CLI version: `gemini --version`
   - Operating system and version
   - System specifications (RAM, CPU)

2. **Debug Bundle:**
   - `gemini debug collect --autonomous --output debug-bundle.zip`

3. **Issue Description:**
   - Detailed symptoms and error messages
   - Steps to reproduce
   - When the issue started
   - Impact on operations

4. **Configuration:**
   - Relevant configuration settings
   - Recent changes made to the system

5. **Logs:**
   - Error logs with timestamps
   - Debug information if available
   - Performance metrics if relevant

---

This troubleshooting guide provides comprehensive coverage of common issues and solutions for the Autonomous Task Management system. For additional help or complex issues not covered here, refer to the technical documentation or contact support.
