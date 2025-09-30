# Hooks System Documentation

## Overview

The Gemini CLI Hooks System provides a powerful way to customize and automate workflows through lifecycle event triggers. Inspired by similar systems in other AI coding tools, hooks allow you to execute custom shell commands at key points during tool execution and application lifecycle.

## Key Features

- **Lifecycle Events**: Execute custom logic at PreToolUse, PostToolUse, Notification, and Stop events
- **Tool Filtering**: Target specific tools using matcher patterns
- **Validation & Blocking**: Hooks can validate operations and prevent execution if needed
- **Input Modification**: PreToolUse hooks can modify tool parameters before execution
- **JSON Payload**: Rich context passed to hooks via stdin
- **Flexible Configuration**: User-level and project-level hook configurations

## Lifecycle Events

### PreToolUse

Triggered **before** a tool is executed. Use this for:

- **Validation**: Check if the tool call is safe or follows policies
- **Modification**: Alter tool parameters before execution
- **Blocking**: Prevent dangerous or unwanted operations
- **Logging**: Audit tool usage before execution

**Hook capabilities:**

- ✅ Can block tool execution
- ✅ Can modify tool input parameters
- ✅ Receives tool name and input parameters in payload

### PostToolUse

Triggered **after** a tool completes successfully. Use this for:

- **Auto-formatting**: Run formatters on edited files
- **Notifications**: Alert on specific operations
- **Follow-up Actions**: Trigger additional workflows
- **Logging**: Record successful operations

**Hook capabilities:**

- ❌ Cannot block (tool already executed)
- ❌ Cannot modify output (result already returned)
- ✅ Receives tool name, input, and output in payload

### Notification

Triggered when the application needs user attention. Use this for:

- **External Notifications**: Send messages to Slack, email, etc.
- **Custom UI**: Show notifications in custom interfaces
- **Alert Routing**: Direct different notification types appropriately

**Hook capabilities:**

- ❌ Cannot block notification
- ✅ Receives notification details in payload

### Stop

Triggered when the agent completes its task and is about to exit. Use this for:

- **Final Validation**: Run tests, linters, security scans
- **Cleanup**: Close connections, save state
- **Quality Gates**: Prevent exit if quality criteria aren't met
- **Reporting**: Generate summary reports

**Hook capabilities:**

- ✅ Can block application exit (agent will continue working)
- ✅ Receives session summary in payload

## Configuration

### Settings File Location

Hooks can be configured in:

- **User settings**: `~/.gemini/settings.json` (applies to all projects)
- **Project settings**: `.gemini/settings.json` (project-specific, only in trusted workspaces)

### Basic Configuration

```json
{
  "hooks": {
    "hooks": [
      {
        "event": "PreToolUse",
        "matcher": "Bash",
        "command": "./hooks/audit-logger.sh",
        "enabled": true,
        "description": "Log all bash commands for compliance"
      }
    ]
  }
}
```

### Configuration Properties

| Property      | Type    | Required | Description                                                           |
| ------------- | ------- | -------- | --------------------------------------------------------------------- |
| `event`       | string  | Yes      | Lifecycle event: `PreToolUse`, `PostToolUse`, `Notification`, `Stop`  |
| `matcher`     | string  | No       | Tool name pattern (e.g., `"Bash"`, `"Bash\|FileEdit"`, `"*"` for all) |
| `command`     | string  | Yes      | Shell command to execute                                              |
| `enabled`     | boolean | No       | Whether hook is active (default: `true`)                              |
| `description` | string  | No       | Human-readable description of hook's purpose                          |

### Matcher Patterns

The `matcher` property filters which tool calls trigger the hook:

- **Single tool**: `"Bash"` - matches only Bash tool
- **Multiple tools**: `"Bash|FileEdit|Write"` - matches any of these tools
- **All tools**: `"*"` or omit matcher - matches all tools
- **No matcher for non-tool events**: Stop and Notification events ignore matcher

## Hook Payload Structure

Hooks receive a JSON payload on stdin with the following structure:

```json
{
  "event": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test",
    "directory": "/workspace"
  },
  "tool_output": null,
  "session_id": "session-abc-123",
  "workspace_dir": "/workspace",
  "timestamp": "2025-09-30T17:00:00.000Z",
  "context": {
    "additional": "data"
  }
}
```

### Payload Fields

| Field           | Type   | Description                        |
| --------------- | ------ | ---------------------------------- |
| `event`         | string | Event type that triggered the hook |
| `tool_name`     | string | Name of the tool (for tool events) |
| `tool_input`    | object | Tool parameters (PreToolUse only)  |
| `tool_output`   | object | Tool result (PostToolUse only)     |
| `session_id`    | string | Unique session identifier          |
| `workspace_dir` | string | Current workspace directory        |
| `timestamp`     | string | ISO 8601 timestamp                 |
| `context`       | object | Additional event-specific data     |

## Hook Response Format

Hooks can return a JSON response on stdout to control behavior:

```json
{
  "block": false,
  "modify": {
    "tool_input": {
      "command": "modified command"
    }
  },
  "message": "Hook executed successfully",
  "exit_code": 0
}
```

### Response Fields

| Field               | Type    | Description                                 |
| ------------------- | ------- | ------------------------------------------- |
| `block`             | boolean | Block the operation (PreToolUse, Stop only) |
| `modify`            | object  | Modifications to apply                      |
| `modify.tool_input` | object  | Modified tool parameters (PreToolUse only)  |
| `message`           | string  | Message to display or log                   |
| `exit_code`         | number  | Exit code (non-zero indicates error)        |

## Example Use Cases

### 1. Auto-Format on File Edit

Automatically run Prettier on edited files:

```json
{
  "event": "PostToolUse",
  "matcher": "FileEdit",
  "command": "./hooks/auto-format.sh",
  "description": "Auto-format edited files with Prettier"
}
```

```bash
#!/usr/bin/env bash
# auto-format.sh
payload=$(cat)
file_path=$(echo "$payload" | jq -r '.tool_output.file_path')

if [ -f "$file_path" ]; then
  npx prettier --write "$file_path"
  echo '{"message": "File formatted"}'
fi
exit 0
```

### 2. Security Guardrails

Block editing of sensitive files:

```json
{
  "event": "PreToolUse",
  "matcher": "FileEdit",
  "command": "./hooks/security-guard.sh",
  "description": "Prevent editing sensitive files"
}
```

```bash
#!/usr/bin/env bash
# security-guard.sh
payload=$(cat)
file_path=$(echo "$payload" | jq -r '.tool_input.file_path')

if [[ "$file_path" == *"credentials"* ]]; then
  echo '{
    "block": true,
    "message": "Blocked: Cannot edit credentials file"
  }'
else
  echo '{"message": "Security check passed"}'
fi
exit 0
```

### 3. Command Audit Logging

Log all bash commands:

```json
{
  "event": "PreToolUse",
  "matcher": "Bash",
  "command": "./hooks/audit-logger.sh",
  "description": "Audit log all commands"
}
```

```bash
#!/usr/bin/env bash
# audit-logger.sh
payload=$(cat)
command=$(echo "$payload" | jq -r '.tool_input.command')
timestamp=$(echo "$payload" | jq -r '.timestamp')

echo "[$timestamp] $command" >> ~/.gemini/audit.log
echo '{"message": "Command logged"}'
exit 0
```

### 4. Test Validation Before Exit

Ensure tests pass before agent stops:

```json
{
  "event": "Stop",
  "command": "./hooks/test-validation.sh",
  "description": "Run tests before stopping"
}
```

```bash
#!/usr/bin/env bash
# test-validation.sh
if npm test; then
  echo '{"message": "Tests passed"}'
  exit 0
else
  echo '{
    "block": true,
    "message": "Tests failing - fix before stopping"
  }'
  exit 0
fi
```

### 5. Suggest Better Commands

Provide helpful suggestions:

```json
{
  "event": "PreToolUse",
  "matcher": "Bash",
  "command": "./hooks/suggest-better.sh",
  "description": "Suggest command improvements"
}
```

```bash
#!/usr/bin/env bash
# suggest-better.sh
payload=$(cat)
command=$(echo "$payload" | jq -r '.tool_input.command')

if [[ "$command" == *"grep -r"* ]]; then
  echo '{
    "message": "💡 Tip: Consider using ripgrep (rg) for faster searches"
  }'
fi
exit 0
```

## Best Practices

### Hook Script Guidelines

1. **Always read from stdin**: Hooks receive payload via stdin

   ```bash
   payload=$(cat)
   ```

2. **Parse JSON safely**: Use `jq` for robust JSON parsing

   ```bash
   value=$(echo "$payload" | jq -r '.field // "default"')
   ```

3. **Exit with code 0**: Always exit 0 for success, even when blocking

   ```bash
   echo '{"block": true, "message": "Blocked"}'
   exit 0
   ```

4. **Handle errors gracefully**: Don't let hook failures crash the application

   ```bash
   if some_command; then
     echo '{"message": "Success"}'
   else
     echo '{"message": "Warning: command failed"}'
   fi
   exit 0
   ```

5. **Use stderr for debugging**: Stderr output is visible but doesn't affect response

   ```bash
   echo "Debug: processing file $file_path" >&2
   ```

6. **Set executable permissions**: Make hook scripts executable

   ```bash
   chmod +x ./hooks/*.sh
   ```

7. **Timeout considerations**: Hooks have a 30-second timeout - keep them fast

### Performance Tips

- **Keep hooks lightweight**: Hooks run synchronously and block tool execution
- **Use background processes for heavy work**: For long operations, spawn background processes
  ```bash
  heavy_operation &
  echo '{"message": "Operation started in background"}'
  ```
- **Cache when possible**: Cache expensive lookups between hook invocations
- **Fail fast**: Check conditions quickly and exit early when possible

### Security Considerations

- **Validate inputs**: Always validate data from payloads
- **Use absolute paths**: Prefer absolute paths for commands and files
- **Sanitize for shell**: Be careful with data used in shell commands
- **Restrict permissions**: Run hooks with minimal necessary permissions
- **Log security events**: Log blocked operations for audit trails

## Troubleshooting

### Hook Not Executing

1. Check hook is enabled: `"enabled": true`
2. Verify matcher pattern matches tool name
3. Ensure command path is correct (use absolute paths)
4. Check file permissions (`chmod +x script.sh`)
5. Test hook manually:
   ```bash
   echo '{"event":"PreToolUse","tool_name":"Bash"}' | ./hook.sh
   ```

### Hook Timing Out

1. Reduce hook complexity
2. Move heavy operations to background processes
3. Check for infinite loops or blocking operations
4. Test hook execution time:
   ```bash
   time echo '{}' | ./hook.sh
   ```

### Hook Not Blocking

1. Verify event supports blocking (PreToolUse or Stop only)
2. Check JSON response format: `{"block": true}`
3. Ensure hook exits with code 0
4. Check for JSON parsing errors in hook script

### Debugging Hooks

Enable debug logging:

```bash
# Add to your hook script
set -x  # Enable bash debugging
exec 2>> /tmp/hook-debug.log  # Redirect stderr to log file
```

## Advanced Patterns

### Conditional Hook Execution

```bash
#!/usr/bin/env bash
payload=$(cat)
workspace=$(echo "$payload" | jq -r '.workspace_dir')

# Only run in production workspace
if [[ "$workspace" == *"/production/"* ]]; then
  # Run strict validation
  echo '{"message": "Production workspace detected"}'
else
  echo '{"message": "Development workspace - skipping strict checks"}'
fi
```

### Hook Chaining

Multiple hooks for the same event run sequentially:

```json
{
  "hooks": {
    "hooks": [
      { "event": "PreToolUse", "matcher": "Bash", "command": "./validate.sh" },
      { "event": "PreToolUse", "matcher": "Bash", "command": "./audit.sh" },
      { "event": "PreToolUse", "matcher": "Bash", "command": "./suggest.sh" }
    ]
  }
}
```

### Dynamic Hook Configuration

```bash
#!/usr/bin/env bash
# Load configuration from environment or config file
CONFIG_FILE="${HOOK_CONFIG:-$HOME/.gemini/hook-config.json}"

if [ -f "$CONFIG_FILE" ]; then
  BLOCK_PATTERNS=$(jq -r '.block_patterns[]' "$CONFIG_FILE")
  # Use patterns for validation
fi
```

## Migration from Other Systems

### From Claude Code Hooks

If you're familiar with Claude Code's hooks system, the Gemini CLI implementation is very similar:

**Similarities:**

- Same lifecycle events (PreToolUse, PostToolUse, Notification, Stop)
- JSON payload on stdin
- JSON response on stdout
- Block and modify capabilities

**Differences:**

- Configuration in `settings.json` instead of separate hooks config
- Matcher patterns use pipe-separated format: `"Bash|FileEdit"`
- 30-second timeout (may differ from Claude Code)

**Migration example:**

Claude Code config:

```json
{
  "hooks": [
    {
      "event": "pre_tool_use",
      "tools": ["bash", "file_edit"],
      "command": "./hook.sh"
    }
  ]
}
```

Gemini CLI config:

```json
{
  "hooks": {
    "hooks": [
      {
        "event": "PreToolUse",
        "matcher": "Bash|FileEdit",
        "command": "./hook.sh"
      }
    ]
  }
}
```

## Contributing

Found a bug or have a feature request? Please file an issue on GitHub.

Want to share your hooks? Check out our [community hooks repository](https://github.com/google-gemini/gemini-cli-hooks).

## Additional Resources

- [Example Hooks](./examples/hooks/) - Collection of useful hook scripts
- [API Reference](./docs/API.md) - Detailed API documentation
- [Settings Schema](./docs/SETTINGS.md) - Complete settings reference

## Support

For questions and support:

- GitHub Issues: https://github.com/google-gemini/gemini-cli/issues
- Documentation: https://docs.gemini-cli.dev
- Community: https://discord.gg/gemini-cli
