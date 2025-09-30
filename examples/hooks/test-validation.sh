#!/usr/bin/env bash
#
# Test validation hook for Stop event
# Ensures all tests pass before the agent exits
#
# Usage in settings.json:
# {
#   "hooks": {
#     "hooks": [
#       {
#         "event": "Stop",
#         "command": "./examples/hooks/test-validation.sh",
#         "description": "Run tests before agent stops to catch regressions"
#       }
#     ]
#   }
# }

# Read JSON payload from stdin
payload=$(cat)

# Extract workspace directory
workspace=$(echo "$payload" | jq -r '.workspace_dir')

# Change to workspace directory
cd "$workspace" || exit 0

# Check if package.json exists and has a test script
if [ -f "package.json" ] && grep -q '"test"' package.json; then
  echo "🧪 Running tests before stopping..." >&2

  # Run tests
  if npm test 2>&1 | tee /dev/stderr; then
    echo '{"message": "✅ All tests passed! Agent can stop safely."}'
    exit 0
  else
    # Tests failed - block the stop
    echo "{
      \"block\": true,
      \"message\": \"❌ Tests are failing! The agent should fix these failures before stopping. Run 'npm test' to see details.\"
    }"
    exit 0
  fi
fi

# No tests configured - allow stop
echo '{"message": "No test script found, allowing stop"}'
exit 0
