# Troubleshooting and Diagnostic Guide

## Overview

This guide provides comprehensive troubleshooting procedures, diagnostic tools, and resolution strategies for the Autonomous Task Management System. It enables rapid identification and resolution of system issues to maintain optimal performance and reliability.

## Quick Diagnostic Tools

### System Health Check
```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Autonomous Task Management System Health Check"
echo "================================================"

# 1. Basic System Health
echo "1. Checking basic system health..."
node --version || echo "❌ Node.js not available"
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide >/dev/null 2>&1 && echo "✅ TaskManager API accessible" || echo "❌ TaskManager API not accessible"

# 2. File System Health
echo "2. Checking file system health..."
if [ -f "FEATURES.json" ]; then
    echo "✅ FEATURES.json exists"
    if [ -r "FEATURES.json" ]; then
        echo "✅ FEATURES.json readable"
    else
        echo "❌ FEATURES.json not readable"
    fi
    if [ -w "FEATURES.json" ]; then
        echo "✅ FEATURES.json writable"
    else
        echo "❌ FEATURES.json not writable"
    fi
else
    echo "⚠️ FEATURES.json does not exist (will be created on first use)"
fi

# 3. Lock File Check
if [ -f "FEATURES.json.lock" ]; then
    echo "⚠️ Lock file exists - may indicate stuck operation"
    echo "   Lock file: $(ls -la FEATURES.json.lock)"
else
    echo "✅ No lock file present"
fi

# 4. API Functionality Test
echo "3. Testing API functionality..."
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" methods >/dev/null 2>&1 && echo "✅ API methods accessible" || echo "❌ API methods test failed"
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats >/dev/null 2>&1 && echo "✅ Feature stats accessible" || echo "❌ Feature stats test failed"

# 5. Performance Check
echo "4. Basic performance check..."
start_time=$(date +%s%N)
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-initialization-stats >/dev/null 2>&1
end_time=$(date +%s%N)
duration=$((($end_time - $start_time) / 1000000))

if [ $duration -lt 2000 ]; then
    echo "✅ API response time: ${duration}ms (Good)"
elif [ $duration -lt 5000 ]; then
    echo "⚠️ API response time: ${duration}ms (Slow)"
else
    echo "❌ API response time: ${duration}ms (Very Slow)"
fi

echo "================================================"
echo "Health check completed. Review any ❌ or ⚠️ items above."
```

### Data Integrity Check
```bash
#!/bin/bash
# scripts/data-integrity-check.sh

echo "🔍 Data Integrity Check"
echo "======================"

if [ ! -f "FEATURES.json" ]; then
    echo "❌ FEATURES.json not found"
    exit 1
fi

echo "1. Checking JSON syntax..."
if jq . FEATURES.json >/dev/null 2>&1; then
    echo "✅ JSON syntax valid"
else
    echo "❌ JSON syntax invalid"
    echo "Attempting to show JSON errors:"
    jq . FEATURES.json
    exit 1
fi

echo "2. Checking required structure..."
REQUIRED_KEYS=("project" "features" "metadata" "workflow_config" "agents")

for key in "${REQUIRED_KEYS[@]}"; do
    if jq -e ".${key}" FEATURES.json >/dev/null 2>&1; then
        echo "✅ ${key} exists"
    else
        echo "❌ Missing required key: ${key}"
    fi
done

echo "3. Checking feature data integrity..."
FEATURE_COUNT=$(jq '.features | length' FEATURES.json)
echo "   Total features: ${FEATURE_COUNT}"

INVALID_FEATURES=$(jq '[.features[] | select(.id == null or .title == null or .description == null or .business_value == null or .category == null)] | length' FEATURES.json)
if [ "$INVALID_FEATURES" -eq "0" ]; then
    echo "✅ All features have required fields"
else
    echo "❌ ${INVALID_FEATURES} features missing required fields"
fi

echo "4. Checking agent data integrity..."
AGENT_COUNT=$(jq '.agents | keys | length' FEATURES.json)
echo "   Total agents: ${AGENT_COUNT}"

echo "5. Checking metadata consistency..."
METADATA_TOTAL=$(jq '.metadata.total_features' FEATURES.json)
ACTUAL_TOTAL=$(jq '.features | length' FEATURES.json)

if [ "$METADATA_TOTAL" -eq "$ACTUAL_TOTAL" ]; then
    echo "✅ Feature count metadata consistent"
else
    echo "⚠️ Feature count mismatch: metadata=${METADATA_TOTAL}, actual=${ACTUAL_TOTAL}"
fi

echo "======================"
echo "Data integrity check completed."
```

## Common Issues and Solutions

### Issue 1: API Timeout Errors

#### Symptoms
- Commands hang and timeout after 10 seconds
- "Operation timed out" error messages
- Slow system response

#### Diagnosis
```bash
# Check system load
top -l 1 | head -n 10

# Check disk space
df -h

# Check memory usage
free -h

# Check if file is locked
ls -la FEATURES.json.lock

# Test API responsiveness
time timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide
```

#### Solutions

**Solution 1: Clear Stale Lock Files**
```bash
# Remove stale lock files
rm -f FEATURES.json.lock

# Verify removal
ls -la *.lock
```

**Solution 2: Check File Permissions**
```bash
# Fix file permissions
chmod 644 FEATURES.json

# Verify permissions
ls -la FEATURES.json
```

**Solution 3: Restart Processes**
```bash
# Kill any stuck Node.js processes
pkill -f taskmanager-api.js

# Wait and retry
sleep 2
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide
```

**Solution 4: System Resource Issues**
```bash
# Free up disk space if needed
# Check large files
find . -type f -size +100M -ls

# Clear temporary files
rm -rf /tmp/taskmanager-*

# Restart if memory issues
# (In production, consider increasing memory limits)
```

### Issue 2: JSON Corruption

#### Symptoms
- "Failed to load features" errors
- "Invalid JSON" errors
- Syntax error messages

#### Diagnosis
```bash
# Check JSON syntax
jq . FEATURES.json

# Look for backup files
ls -la FEATURES.json.backup.*

# Check file size
ls -lh FEATURES.json

# Check recent file modifications
ls -la --time-style=full-iso FEATURES.json
```

#### Solutions

**Solution 1: Restore from Backup**
```bash
# List available backups
ls -la FEATURES.json.backup.*

# Restore from most recent backup
LATEST_BACKUP=$(ls -t FEATURES.json.backup.* | head -n1)
cp "$LATEST_BACKUP" FEATURES.json

# Verify restoration
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats
```

**Solution 2: Repair JSON Structure**
```bash
# Create minimal valid structure
cat > FEATURES.json << 'EOF'
{
  "project": "restored-project",
  "features": [],
  "metadata": {
    "version": "1.0.0",
    "created": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "updated": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "total_features": 0,
    "approval_history": []
  },
  "workflow_config": {
    "require_approval": true,
    "auto_reject_timeout_hours": 168,
    "allowed_statuses": ["suggested", "approved", "rejected", "implemented"],
    "required_fields": ["title", "description", "business_value", "category"]
  },
  "agents": {},
  "tasks": [],
  "completed_tasks": []
}
EOF

# Test the repair
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide
```

### Issue 3: Agent Initialization Failures

#### Symptoms
- "Failed to initialize agent" errors
- Agent not appearing in system
- Session ID generation issues

#### Diagnosis
```bash
# Test agent initialization directly
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize TEST_AGENT

# Check current agents
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" get-initialization-stats

# Verify agent in FEATURES.json
jq '.agents' FEATURES.json
```

#### Solutions

**Solution 1: Agent ID Validation Issues**
```bash
# Ensure agent ID follows rules:
# - 3-50 characters
# - Uppercase letters, numbers, underscores only
# - Not a reserved ID (SYSTEM, ROOT, ADMIN, etc.)

# Valid agent ID examples:
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize VALID_AGENT_001
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize DEV_TEAM_AGENT
```

**Solution 2: Clean Up Corrupted Agent Data**
```bash
# Remove corrupted agent entries
jq 'del(.agents.CORRUPTED_AGENT_ID)' FEATURES.json > FEATURES_temp.json
mv FEATURES_temp.json FEATURES.json

# Reinitialize agent
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize CLEAN_AGENT
```

### Issue 4: Feature Creation Failures

#### Symptoms
- "Validation failed" errors
- Required field errors
- Feature not being created

#### Diagnosis
```bash
# Test with minimal valid feature
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" suggest-feature '{
  "title": "Test Feature Diagnostic",
  "description": "This is a test feature to diagnose feature creation issues",
  "business_value": "Helps identify problems with feature creation functionality",
  "category": "enhancement"
}'

# Check validation rules
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide | grep -A 20 "required_fields"
```

#### Solutions

**Solution 1: Field Validation Issues**
```bash
# Ensure all required fields are present and valid:
# - title: 10-200 characters
# - description: 20-2000 characters
# - business_value: 10-1000 characters
# - category: one of enhancement|bug-fix|new-feature|performance|security|documentation

# Example valid feature:
cat > test_feature.json << 'EOF'
{
  "title": "Valid Test Feature for Debugging",
  "description": "This is a comprehensive test feature with sufficient description length to meet the minimum requirements for testing purposes",
  "business_value": "Provides value by validating that the feature creation system is working correctly and can handle properly formatted requests",
  "category": "enhancement"
}
EOF

timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" suggest-feature "$(cat test_feature.json)"
```

**Solution 2: Character Encoding Issues**
```bash
# Check for invalid characters
file FEATURES.json

# Convert to UTF-8 if needed
iconv -f ISO-8859-1 -t UTF-8 FEATURES.json > FEATURES_utf8.json
mv FEATURES_utf8.json FEATURES.json
```

### Issue 5: Performance Degradation

#### Symptoms
- Slow API responses
- Increasing response times
- System becoming unresponsive

#### Diagnosis
```bash
# Monitor API performance
for i in {1..10}; do
    echo "Test $i:"
    time timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats
    sleep 1
done

# Check file size growth
ls -lh FEATURES.json

# Count features
jq '.features | length' FEATURES.json

# Check system resources
top -l 1 | head -n 20
```

#### Solutions

**Solution 1: Data Cleanup**
```bash
# Archive old completed features
CURRENT_DATE=$(date +%Y%m%d)
jq '{
  project: .project,
  features: [.features[] | select(.status != "implemented" or (now - (.updated_at | fromdateiso8601) < 7776000))],
  metadata: .metadata,
  workflow_config: .workflow_config,
  agents: .agents,
  tasks: .tasks,
  completed_tasks: .completed_tasks
}' FEATURES.json > FEATURES_cleaned.json

# Backup original
cp FEATURES.json "FEATURES.backup.${CURRENT_DATE}"

# Replace with cleaned version
mv FEATURES_cleaned.json FEATURES.json

echo "Cleaned old implemented features. Check backup: FEATURES.backup.${CURRENT_DATE}"
```

**Solution 2: Agent Session Cleanup**
```bash
# Remove inactive agent sessions (older than 24 hours)
jq --argjson cutoff $(date -d '24 hours ago' +%s) '
  .agents |= with_entries(
    select(
      .value.lastHeartbeat and
      (.value.lastHeartbeat | fromdateiso8601) > $cutoff
    )
  )
' FEATURES.json > FEATURES_temp.json

mv FEATURES_temp.json FEATURES.json

echo "Cleaned up inactive agent sessions"
```

### Issue 6: File Locking Problems

#### Symptoms
- "Could not acquire lock" errors
- Operations hanging indefinitely
- Multiple processes accessing file

#### Diagnosis
```bash
# Check for lock files
ls -la *.lock

# Check processes using the file
lsof FEATURES.json

# Check for Node.js processes
ps aux | grep taskmanager-api
```

#### Solutions

**Solution 1: Clear Lock Files**
```bash
# Remove all lock files
rm -f FEATURES.json.lock

# Kill stuck processes
pkill -f taskmanager-api.js

# Wait and test
sleep 2
timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide
```

**Solution 2: Process Investigation**
```bash
# Find processes holding locks
lsof FEATURES.json

# If processes are stuck, kill them by PID
kill -9 <PID>

# Verify cleanup
ls -la *.lock
lsof FEATURES.json
```

## Advanced Diagnostics

### Memory Leak Detection
```javascript
// scripts/memory-diagnostic.js
const AutonomousTaskManagerAPI = require('/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js');

async function memoryLeakTest() {
  console.log('🔍 Memory Leak Diagnostic Test');

  const initialMemory = process.memoryUsage();
  console.log('Initial memory:', initialMemory);

  // Perform many operations
  const api = new AutonomousTaskManagerAPI();

  for (let i = 0; i < 1000; i++) {
    await api.getFeatureStats();

    if (i % 100 === 0) {
      const currentMemory = process.memoryUsage();
      console.log(`After ${i} operations:`, {
        heapUsed: `${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(currentMemory.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(currentMemory.external / 1024 / 1024)}MB`
      });
    }
  }

  const finalMemory = process.memoryUsage();
  console.log('Final memory:', finalMemory);

  const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  console.log(`Heap growth: ${Math.round(heapGrowth / 1024 / 1024)}MB`);

  if (heapGrowth > 50 * 1024 * 1024) { // 50MB threshold
    console.log('⚠️ Potential memory leak detected');
  } else {
    console.log('✅ Memory usage appears normal');
  }
}

memoryLeakTest().catch(console.error);
```

### Performance Profiling
```javascript
// scripts/performance-profile.js
const AutonomousTaskManagerAPI = require('/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js');

async function performanceProfile() {
  console.log('🔍 Performance Profile Analysis');

  const api = new AutonomousTaskManagerAPI();
  const operations = [
    { name: 'getFeatureStats', fn: () => api.getFeatureStats() },
    { name: 'getInitializationStats', fn: () => api.getInitializationStats() },
    { name: 'listFeatures', fn: () => api.listFeatures() },
    { name: 'getComprehensiveGuide', fn: () => api.getComprehensiveGuide() }
  ];

  for (const operation of operations) {
    const times = [];

    // Warm up
    await operation.fn();

    // Measure performance
    for (let i = 0; i < 20; i++) {
      const start = process.hrtime.bigint();
      await operation.fn();
      const end = process.hrtime.bigint();

      times.push(Number(end - start) / 1000000); // Convert to milliseconds
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`${operation.name}:`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);

    if (avg > 1000) {
      console.log(`  ⚠️ Slow operation detected`);
    } else if (avg > 500) {
      console.log(`  ⚠️ Operation slower than expected`);
    } else {
      console.log(`  ✅ Performance normal`);
    }
  }
}

performanceProfile().catch(console.error);
```

### Data Consistency Check
```javascript
// scripts/data-consistency-check.js
const fs = require('fs').promises;
const path = require('path');

async function dataConsistencyCheck() {
  console.log('🔍 Data Consistency Check');

  try {
    const featuresPath = path.join(process.cwd(), 'FEATURES.json');
    const data = JSON.parse(await fs.readFile(featuresPath, 'utf8'));

    const issues = [];

    // Check feature references
    const featureIds = new Set(data.features.map(f => f.id));

    // Check task feature references
    if (data.tasks) {
      for (const task of data.tasks) {
        if (task.feature_id && !featureIds.has(task.feature_id)) {
          issues.push(`Task ${task.id} references non-existent feature ${task.feature_id}`);
        }
      }
    }

    // Check agent references
    const agentIds = new Set(Object.keys(data.agents || {}));

    for (const feature of data.features) {
      if (feature.suggested_by && feature.suggested_by !== 'system' && !agentIds.has(feature.suggested_by)) {
        issues.push(`Feature ${feature.id} suggested by non-existent agent ${feature.suggested_by}`);
      }

      if (feature.approved_by && feature.approved_by !== 'system' && !agentIds.has(feature.approved_by)) {
        issues.push(`Feature ${feature.id} approved by non-existent agent ${feature.approved_by}`);
      }
    }

    // Check metadata consistency
    const actualFeatureCount = data.features.length;
    const metadataCount = data.metadata.total_features;

    if (actualFeatureCount !== metadataCount) {
      issues.push(`Feature count mismatch: actual=${actualFeatureCount}, metadata=${metadataCount}`);
    }

    // Check required fields
    for (const feature of data.features) {
      const requiredFields = ['id', 'title', 'description', 'business_value', 'category', 'status'];
      for (const field of requiredFields) {
        if (!feature[field]) {
          issues.push(`Feature ${feature.id} missing required field: ${field}`);
        }
      }
    }

    // Report results
    if (issues.length === 0) {
      console.log('✅ No data consistency issues found');
    } else {
      console.log(`❌ Found ${issues.length} data consistency issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Summary statistics
    console.log('\n📊 Data Summary:');
    console.log(`   Features: ${data.features.length}`);
    console.log(`   Agents: ${Object.keys(data.agents || {}).length}`);
    console.log(`   Tasks: ${(data.tasks || []).length}`);
    console.log(`   Completed Tasks: ${(data.completed_tasks || []).length}`);

  } catch (error) {
    console.error('❌ Data consistency check failed:', error.message);
  }
}

dataConsistencyCheck();
```

## Monitoring and Alerting

### Real-Time Monitoring Script
```bash
#!/bin/bash
# scripts/monitor.sh

echo "🔍 Starting Autonomous Task Management System Monitor"
echo "Press Ctrl+C to stop monitoring"

ALERT_THRESHOLD_MS=2000
ERROR_COUNT=0
MAX_ERRORS=5

while true; do
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Checking system health..."

    # Test API response time
    start_time=$(date +%s%N)
    if timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" feature-stats >/dev/null 2>&1; then
        end_time=$(date +%s%N)
        response_time=$((($end_time - $start_time) / 1000000))

        if [ $response_time -lt $ALERT_THRESHOLD_MS ]; then
            echo "✅ API healthy (${response_time}ms)"
            ERROR_COUNT=0
        else
            echo "⚠️ API slow (${response_time}ms)"
        fi
    else
        echo "❌ API not responding"
        ERROR_COUNT=$((ERROR_COUNT + 1))

        if [ $ERROR_COUNT -ge $MAX_ERRORS ]; then
            echo "🚨 ALERT: API has failed $ERROR_COUNT consecutive times"
            # In production, send alert to monitoring system
        fi
    fi

    # Check for lock files
    if [ -f "FEATURES.json.lock" ]; then
        LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "FEATURES.json.lock") ))
        if [ $LOCK_AGE -gt 30 ]; then
            echo "⚠️ Stale lock file detected (${LOCK_AGE}s old)"
        fi
    fi

    # Check disk space
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 90 ]; then
        echo "⚠️ Disk usage high: ${DISK_USAGE}%"
    fi

    sleep 30
done
```

### Log Analysis Tools
```bash
#!/bin/bash
# scripts/analyze-logs.sh

echo "🔍 Log Analysis Report"
echo "====================="

# Check for error patterns in logs
if [ -f "logs/taskmanager.log" ]; then
    echo "Recent Errors (last 24 hours):"
    grep -i "error" logs/taskmanager.log | tail -20

    echo -e "\nError Summary:"
    grep -i "error" logs/taskmanager.log | awk '{print $4}' | sort | uniq -c | sort -nr

    echo -e "\nPerformance Issues:"
    grep -i "timeout\|slow\|performance" logs/taskmanager.log | tail -10

else
    echo "No log files found"
fi

# Check security logs if they exist
if [ -f "logs/security.log" ]; then
    echo -e "\nSecurity Events:"
    tail -20 logs/security.log
fi
```

## Emergency Procedures

### System Recovery Checklist

#### Complete System Failure
1. **Immediate Actions**
   ```bash
   # Stop all running processes
   pkill -f taskmanager-api.js

   # Remove lock files
   rm -f *.lock

   # Check system resources
   df -h && free -h
   ```

2. **Data Recovery**
   ```bash
   # List available backups
   ls -la FEATURES.json.backup.*

   # Restore from most recent backup
   LATEST_BACKUP=$(ls -t FEATURES.json.backup.* | head -n1)
   cp "$LATEST_BACKUP" FEATURES.json

   # Verify restoration
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" guide
   ```

3. **System Validation**
   ```bash
   # Run comprehensive health check
   ./scripts/health-check.sh

   # Run data integrity check
   ./scripts/data-integrity-check.sh

   # Test critical operations
   timeout 10s node "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js" initialize RECOVERY_TEST_AGENT
   ```

### Disaster Recovery Plan

#### Data Loss Scenarios
1. **FEATURES.json Corruption**
   - Restore from backup
   - Reconstruct from audit logs if needed
   - Validate data integrity
   - Resume normal operations

2. **Complete Data Loss**
   - Initialize minimal system structure
   - Import from external backups
   - Re-initialize agents as needed
   - Document loss and prevention measures

#### Service Interruption Procedures
1. **Planned Maintenance**
   - Notify all users
   - Create fresh backup
   - Perform maintenance
   - Validate system post-maintenance

2. **Emergency Maintenance**
   - Isolate affected components
   - Implement temporary workarounds
   - Perform emergency fixes
   - Monitor system stability

## Contact and Escalation

### Internal Escalation Path
1. **Level 1**: Development Team Lead
2. **Level 2**: System Administrator
3. **Level 3**: Chief Technology Officer

### External Support
- **Documentation**: `/docs/autonomous-task-management/`
- **Issue Tracking**: Project repository issues
- **Emergency Contact**: System administrator on-call

### Issue Reporting Template
```
**System**: Autonomous Task Management System
**Version**: 4.0.0
**Environment**: [Production/Staging/Development]
**Issue Type**: [Performance/Functionality/Security/Data]
**Severity**: [Critical/High/Medium/Low]

**Description**:
[Detailed description of the issue]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Error Messages**:
[Any error messages or logs]

**Environment Details**:
- Node.js version: [version]
- Operating System: [OS]
- File permissions: [permissions]
- Available disk space: [space]
- Memory usage: [memory]

**Diagnostic Information**:
[Output from health-check.sh and other diagnostic tools]

**Attempted Solutions**:
[What has been tried so far]
```

This comprehensive troubleshooting guide provides systematic approaches to identify, diagnose, and resolve issues with the Autonomous Task Management System. It should be the first resource consulted when system problems occur.

---

*This troubleshooting guide should be kept current with system changes and updated based on new issues encountered in production environments.*