#!/usr/bin/env bash
#
# Suggest better commands hook for PreToolUse on Bash
# Provides helpful suggestions to use more efficient or safer alternatives
#
# Usage in settings.json:
# {
#   "hooks": {
#     "hooks": [
#       {
#         "event": "PreToolUse",
#         "matcher": "Bash",
#         "command": "./examples/hooks/suggest-better-command.sh",
#         "description": "Suggest better command alternatives"
#       }
#     ]
#   }
# }

# Read JSON payload from stdin
payload=$(cat)

# Extract command
command=$(echo "$payload" | jq -r '.tool_input.command // empty')

suggestions=""

# Check for grep and suggest ripgrep
if [[ "$command" == *"grep -r"* ]] && ! [[ "$command" == *"rg"* ]]; then
  suggestions="$suggestions\n💡 Tip: Consider using 'rg' (ripgrep) instead of 'grep -r' for much faster searches."
fi

# Check for find and suggest fd
if [[ "$command" == *"find ."* ]] && ! [[ "$command" == *"fd"* ]]; then
  suggestions="$suggestions\n💡 Tip: Consider using 'fd' instead of 'find' for faster and more user-friendly file searching."
fi

# Check for cat with pipe and suggest direct usage
if [[ "$command" == *"cat"*"|"* ]]; then
  suggestions="$suggestions\n💡 Tip: Many commands can read files directly without 'cat'. Example: grep 'pattern' file.txt"
fi

# Check for unnecessary sudo
if [[ "$command" == "sudo npm"* ]]; then
  suggestions="$suggestions\n⚠️  Warning: Running npm with sudo can cause permission issues. Consider using nvm or fixing npm permissions."
fi

# Check for long-running commands without nohup/screen
if [[ "$command" == *"npm start"* ]] || [[ "$command" == *"python -m http.server"* ]]; then
  if ! [[ "$command" == *"nohup"* ]] && ! [[ "$command" == *"screen"* ]] && ! [[ "$command" == *"&"* ]]; then
    suggestions="$suggestions\n💡 Tip: For long-running processes, consider using 'nohup $command &' or running in a screen/tmux session."
  fi
fi

# If we have suggestions, return them but don't block
if [ -n "$suggestions" ]; then
  # Escape newlines for JSON
  suggestions_json=$(echo -e "$suggestions" | jq -Rs .)
  echo "{
    \"message\": $suggestions_json
  }"
else
  echo '{"message": "Command looks good"}'
fi

exit 0
