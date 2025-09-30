#!/usr/bin/env bash
#
# Auto-formatter hook for PostToolUse on FileEdit
# Automatically runs prettier on edited files to ensure consistent code style
#
# Usage in settings.json:
# {
#   "hooks": {
#     "hooks": [
#       {
#         "event": "PostToolUse",
#         "matcher": "FileEdit",
#         "command": "./examples/hooks/auto-format.sh",
#         "description": "Auto-format edited files with Prettier"
#       }
#     ]
#   }
# }

# Read JSON payload from stdin
payload=$(cat)

# Extract file path from tool output (if available)
# This is a simple example - adjust based on your tool output structure
file_path=$(echo "$payload" | jq -r '.tool_output.file_path // empty')

if [ -n "$file_path" ] && [ -f "$file_path" ]; then
  # Check if file extension is supported by prettier
  if [[ "$file_path" =~ \.(js|ts|jsx|tsx|json|css|scss|html|md)$ ]]; then
    echo "Running prettier on $file_path..." >&2

    # Run prettier
    if npx prettier --write "$file_path" 2>&1 >/dev/null; then
      # Return success response
      echo '{"message": "File formatted successfully with Prettier"}'
    else
      # Return error but don't block
      echo '{"message": "Prettier formatting failed, continuing anyway"}'
    fi
  fi
fi

# Exit successfully (don't block)
exit 0
