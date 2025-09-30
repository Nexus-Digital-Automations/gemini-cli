#!/usr/bin/env bash
#
# Audit logger hook for PreToolUse on Bash
# Logs all shell commands to an audit file for compliance and debugging
#
# Usage in settings.json:
# {
#   "hooks": {
#     "hooks": [
#       {
#         "event": "PreToolUse",
#         "matcher": "Bash",
#         "command": "./examples/hooks/audit-logger.sh",
#         "description": "Log all bash commands to audit file"
#       }
#     ]
#   }
# }

# Configuration
AUDIT_LOG_FILE="${AUDIT_LOG_FILE:-$HOME/.gemini/audit.log}"
AUDIT_LOG_DIR=$(dirname "$AUDIT_LOG_FILE")

# Ensure audit log directory exists
mkdir -p "$AUDIT_LOG_DIR"

# Read JSON payload from stdin
payload=$(cat)

# Extract relevant information
timestamp=$(echo "$payload" | jq -r '.timestamp')
session_id=$(echo "$payload" | jq -r '.session_id')
workspace=$(echo "$payload" | jq -r '.workspace_dir')
command=$(echo "$payload" | jq -r '.tool_input.command // empty')

# Create audit log entry
cat >> "$AUDIT_LOG_FILE" << EOF
---
Timestamp: $timestamp
Session: $session_id
Workspace: $workspace
Command: $command
---
EOF

# Echo to stderr for visibility (won't affect hook response)
echo "📝 Command logged to $AUDIT_LOG_FILE" >&2

# Return success without blocking
echo '{"message": "Command logged to audit file"}'
exit 0
