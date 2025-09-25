# Gemini CLI Budget Management

The Gemini CLI includes a comprehensive budget management system that helps you track and control your daily API usage to avoid unexpected costs and manage resource consumption effectively.

## Table of Contents

- [Quick Start](#quick-start)
- [Commands Reference](#commands-reference)
- [Configuration](#configuration)
- [Budget Display](#budget-display)
- [CLI Flags](#cli-flags)
- [Project vs User Settings](#project-vs-user-settings)
- [Use Cases](#use-cases)
- [Integration with Quota Systems](#integration-with-quota-systems)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Quick Start

### Enable Budget Tracking

1. **Set a daily limit** (automatically enables tracking):

   ```bash
   gemini budget set 100
   ```

2. **Check your current usage**:

   ```bash
   gemini budget get
   ```

3. **View budget status in the CLI footer** - budget information appears automatically in the footer when enabled.

### Basic Workflow

```bash
# Set daily budget limit
gemini budget set 200

# Check current usage
gemini budget get

# Use Gemini CLI normally - budget is enforced automatically
gemini "Help me write a function"

# If you exceed your budget, extend it temporarily
gemini budget extend 50

# Reset usage counter if needed
gemini budget reset
```

## Commands Reference

### `gemini budget set <limit>`

Set the daily API request budget limit.

```bash
# Set limit to 200 requests per day
gemini budget set 200

# Set limit with custom reset time (6 AM)
gemini budget set 150 --reset-time 06:00

# Set user-level limit (applies to all projects)
gemini budget set 500 --scope user
```

**Options:**

- `--reset-time <HH:MM>` - Time when budget resets daily (default: 00:00)
- `--scope <user|project>` - Set budget at user or project level (default: project)

### `gemini budget get`

Show current budget status and usage statistics.

```bash
# Show detailed budget status
gemini budget get

# Show status in JSON format
gemini budget get --json
```

**Output includes:**

- Daily limit and current usage
- Remaining requests
- Usage percentage with progress bar
- Time until next reset
- Warning thresholds

### `gemini budget reset`

Reset today's usage count to zero.

```bash
# Reset with confirmation prompt
gemini budget reset

# Reset without confirmation
gemini budget reset --confirm
```

⚠️ **Use carefully** - this resets your daily usage counter, giving you a fresh start.

### `gemini budget extend <amount>`

Temporarily extend today's budget limit.

```bash
# Add 50 requests to today's limit
gemini budget extend 50

# Extend without confirmation
gemini budget extend 25 --confirm
```

**Important:** Extensions only apply to the current day and reset tomorrow.

### `gemini budget enable`

Enable budget tracking with default settings.

```bash
# Enable for current project
gemini budget enable

# Enable globally for all projects
gemini budget enable --scope user
```

### `gemini budget disable`

Disable budget tracking and enforcement.

```bash
# Disable for current project
gemini budget disable

# Disable globally
gemini budget disable --scope user

# Disable without confirmation
gemini budget disable --confirm
```

## Configuration

### Settings Structure

Budget settings are stored in your `.gemini/settings.json` file:

```json
{
  "budget": {
    "enabled": true,
    "dailyLimit": 200,
    "resetTime": "00:00",
    "warningThresholds": [50, 75, 90]
  }
}
```

### Configuration Options

| Setting             | Type     | Default        | Description                     |
| ------------------- | -------- | -------------- | ------------------------------- |
| `enabled`           | boolean  | `false`        | Enable/disable budget tracking  |
| `dailyLimit`        | number   | `100`          | Maximum requests per day        |
| `resetTime`         | string   | `"00:00"`      | Daily reset time (HH:MM format) |
| `warningThresholds` | number[] | `[50, 75, 90]` | Warning percentages             |

### Reset Time Examples

```bash
# Reset at midnight (default)
gemini budget set 100 --reset-time 00:00

# Reset at 6 AM
gemini budget set 100 --reset-time 06:00

# Reset at 2:30 PM
gemini budget set 100 --reset-time 14:30
```

## Budget Display

### Footer Integration

When budget tracking is enabled, usage information automatically appears in the CLI footer:

```
~/project (main) | docker | budget: 45/200 [████░░░░] 155 left • 6h 23m | gemini-1.5-flash
```

**Display Elements:**

- Current usage / Daily limit
- Progress bar (visual indicator)
- Remaining requests
- Time until reset

### Display Colors

- **Green**: Normal usage (< 75%)
- **Yellow**: Warning level (75-90%)
- **Red**: Critical level (> 90%) or exceeded

### Compact Mode

On narrow terminals, the display automatically switches to compact mode:

```
45/200 (23%)
```

## CLI Flags

### Global Flags

Use these flags with any Gemini CLI command:

```bash
# Temporarily set budget limit for this command
gemini --budget-limit 300 "Help me debug this code"

# Temporarily disable budget checking
gemini --disable-budget "Emergency fix needed"
```

**Available Flags:**

- `--budget-limit <number>` - Override daily limit for this session
- `--disable-budget` - Skip budget enforcement for this command

## Project vs User Settings

### Project-Level Settings

Stored in `<project>/.gemini/settings.json` - applies only to the current project.

```bash
# Set project-specific budget
gemini budget set 150 --scope project
```

**Use when:**

- Different projects have different budget needs
- Working on multiple client projects
- Project-specific cost management

### User-Level Settings

Stored in `~/.gemini/settings.json` - applies to all projects unless overridden.

```bash
# Set global user budget
gemini budget set 400 --scope user
```

**Use when:**

- Consistent budget across all work
- Personal daily limit preference
- Default fallback setting

### Priority Order

1. Project-specific settings (highest priority)
2. User-level settings (fallback)
3. System defaults (100 requests, midnight reset)

## Use Cases

### Individual Developer

```bash
# Set a conservative daily limit
gemini budget set 150

# Check usage periodically
gemini budget get

# Extend if working on urgent tasks
gemini budget extend 50
```

### Team Projects

```bash
# Set project-specific budget
cd /path/to/team-project
gemini budget set 500 --scope project

# Different budget for personal projects
cd /path/to/personal-project
gemini budget set 100 --scope project
```

### CI/CD Integration

```bash
# Disable budget in CI environments
export CI=true
gemini --disable-budget "Automated code review"

# Or set higher limits for CI
gemini budget set 1000 --scope project
```

### Cost Management

```bash
# Conservative limit with morning reset
gemini budget set 100 --reset-time 09:00

# Monitor usage closely
gemini budget get --json | jq '.usagePercentage'

# Set up warnings at 50% and 80%
# (Edit settings.json: "warningThresholds": [50, 80])
```

## Integration with Quota Systems

### Gemini API Quotas

The budget system works alongside official API quotas:

- **Free Tier**: 250 requests/day → Set budget to 200 for safety margin
- **Paid Tier**: Higher limits → Set budget based on cost comfort
- **Code Assist**: 1000 requests/day → Set budget to 800-900

### Rate Limiting

Budget tracking is separate from rate limiting:

- Budget: Daily request count
- Rate limits: Requests per minute
- Both work together for complete control

### Cost Estimation

```bash
# Example cost calculations (approximate)
# Free tier: $0/request up to limit
# Paid tier: $0.01-0.05 per request (varies by model)

# Set budget based on monthly budget
# $30/month ÷ $0.02/request ÷ 30 days = 50 requests/day
gemini budget set 50
```

## Troubleshooting

### Common Issues

#### Budget Not Enforcing

```bash
# Check if enabled
gemini budget get

# Enable if disabled
gemini budget enable

# Verify settings
cat .gemini/settings.json | grep -A 5 budget
```

#### Usage Count Incorrect

```bash
# Reset if counter is stuck
gemini budget reset --confirm

# Check for timezone issues
gemini budget set 100 --reset-time 00:00
```

#### Commands Not Found

```bash
# Ensure you're using latest version
gemini --version

# Budget commands available in v0.7.0+
npm update -g @google/gemini-cli
```

### Error Messages

**"Daily budget exceeded"**

```bash
# Options:
gemini budget extend 25    # Temporary increase
gemini budget reset        # Reset counter
gemini budget disable     # Disable tracking
```

**"Budget tracking is not enabled"**

```bash
gemini budget set 100     # Enable with limit
# or
gemini budget enable      # Enable with defaults
```

### Debug Mode

```bash
# Run with debug info
DEBUG=1 gemini budget get

# Check budget files
ls -la .gemini/budget-*
cat .gemini/budget-usage.json
```

## Best Practices

### Setting Limits

1. **Start Conservative**: Begin with 50-100 requests/day
2. **Monitor Usage**: Check `gemini budget get` regularly
3. **Adjust Gradually**: Increase limits based on actual needs
4. **Consider Peak Days**: Set limits for your busiest work days

### Daily Workflow

```bash
# Morning routine
gemini budget get                    # Check remaining budget

# During work
# (Budget displayed in footer automatically)

# End of day
gemini budget get --json           # Log usage for tracking
```

### Team Coordination

1. **Shared Projects**: Use project-level settings
2. **Documentation**: Include budget setup in project README
3. **Monitoring**: Regular budget reviews in team meetings
4. **Alerts**: Set warning thresholds at 60% and 80%

### Cost Optimization

1. **Efficient Prompts**: Write clear, specific prompts to reduce back-and-forth
2. **Batch Operations**: Group related questions together
3. **Local Processing**: Use local tools when possible
4. **Model Selection**: Choose appropriate models for the task

### Emergency Procedures

```bash
# If you hit budget during critical work:
gemini budget extend 50             # Quick temporary fix
gemini budget set 300 --scope user  # Increase limit
gemini --disable-budget "urgent fix" # One-time bypass
```

### Automation

```bash
# Shell function for daily budget check
budget_check() {
  local usage=$(gemini budget get --json | jq -r '.usagePercentage')
  if (( $(echo "$usage > 80" | bc -l) )); then
    echo "⚠️ Budget usage: ${usage}%"
  fi
}

# Add to .bashrc/.zshrc
alias gbudget="gemini budget get"
```

---

## Advanced Topics

### Custom Scripts

```bash
#!/bin/bash
# daily-budget-report.sh

USAGE=$(gemini budget get --json)
PERCENT=$(echo "$USAGE" | jq -r '.usagePercentage')
REMAINING=$(echo "$USAGE" | jq -r '.remainingRequests')

echo "Daily Budget Report"
echo "Usage: ${PERCENT}%"
echo "Remaining: ${REMAINING} requests"

if (( $(echo "$PERCENT > 90" | bc -l) )); then
  echo "🔴 Consider extending budget or optimizing usage"
elif (( $(echo "$PERCENT > 75" | bc -l) )); then
  echo "🟡 Approaching daily limit"
else
  echo "✅ Budget usage normal"
fi
```

### Integration with External Tools

```bash
# Prometheus metrics export
gemini budget get --json | jq '{
  daily_limit: .dailyLimit,
  usage_count: .requestCount,
  usage_percent: .usagePercentage
}' > /tmp/gemini-budget-metrics.json

# Slack notifications
if (( $(gemini budget get --json | jq -r '.usagePercentage') > 90 )); then
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 Gemini CLI budget 90% used"}' \
    "$SLACK_WEBHOOK_URL"
fi
```

This comprehensive budget system helps you maintain control over your API usage while providing the flexibility to adjust limits as needed. Start with conservative settings and adjust based on your actual usage patterns.
