#!/usr/bin/env bash
#
# Security guardrails hook for PreToolUse
# Prevents editing of sensitive files and blocks dangerous commands
#
# Usage in settings.json:
# {
#   "hooks": {
#     "hooks": [
#       {
#         "event": "PreToolUse",
#         "matcher": "FileEdit|Bash",
#         "command": "./examples/hooks/security-guard.sh",
#         "description": "Security guardrails to prevent dangerous operations"
#       }
#     ]
#   }
# }

# Read JSON payload from stdin
payload=$(cat)

# Extract tool name and input
tool_name=$(echo "$payload" | jq -r '.tool_name')
tool_input=$(echo "$payload" | jq -r '.tool_input')

# Security check for FileEdit
if [ "$tool_name" = "FileEdit" ]; then
  file_path=$(echo "$tool_input" | jq -r '.file_path // .path // empty')

  # List of sensitive file patterns to block
  sensitive_patterns=(
    "terraform.tfvars"
    "production.yml"
    "production.yaml"
    ".env.production"
    "id_rsa"
    "id_ed25519"
    "credentials.json"
    "serviceAccount.json"
    ".aws/credentials"
  )

  for pattern in "${sensitive_patterns[@]}"; do
    if [[ "$file_path" == *"$pattern"* ]]; then
      echo "{
        \"block\": true,
        \"message\": \"🔒 Security: Editing sensitive file '$file_path' is not allowed. This file contains credentials or sensitive configuration.\"
      }"
      exit 0
    fi
  done
fi

# Security check for Bash commands
if [ "$tool_name" = "Bash" ]; then
  command=$(echo "$tool_input" | jq -r '.command // empty')

  # List of dangerous command patterns
  dangerous_patterns=(
    "rm -rf /"
    "rm -rf *"
    "mkfs"
    "dd if="
    "> /dev/sd"
    ":(){ :|:& };:"
    "chmod -R 777"
  )

  for pattern in "${dangerous_patterns[@]}"; do
    if [[ "$command" == *"$pattern"* ]]; then
      echo "{
        \"block\": true,
        \"message\": \"🛑 Security: Command contains dangerous pattern '$pattern'. Please verify this is intentional.\"
      }"
      exit 0
    fi
  done

  # Check for force push to main/master
  if [[ "$command" == *"git push"*"--force"* ]] && \
     ([[ "$command" == *"main"* ]] || [[ "$command" == *"master"* ]]); then
    echo "{
      \"block\": true,
      \"message\": \"⚠️  Warning: Force pushing to main/master branch is blocked. Use a feature branch instead.\"
    }"
    exit 0
  fi
fi

# All checks passed - allow the operation
echo '{"message": "✓ Security checks passed"}'
exit 0
