# Gemini CLI - Commands and Development Guide

This document provides comprehensive instructions for developing, building, testing, and using the Gemini CLI codebase.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Development Commands](#development-commands)
- [Building](#building)
- [Testing](#testing)
- [Using the CLI](#using-the-cli)
- [Sandbox Mode](#sandbox-mode)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. **Install dependencies**: `npm install`
2. **Build the project**: `npm run build`
3. **Start the CLI**: `npm start`

## Prerequisites

- Node.js >= 20.0.0
- npm (comes with Node.js)
- Git
- For sandbox mode: Docker or Podman (optional)

## Installation and Setup

### 1. Clone and Install

```bash
git clone https://github.com/google-gemini/gemini-cli.git
cd gemini-cli
npm install
```

### 2. Build the Project

```bash
# Build the main project
npm run build

# Build everything including VS Code extension
npm run build:all
```

### 3. Start the CLI

```bash
# Interactive mode
npm start

# With specific options
npm start -- --help
npm start -- --version
npm start -- --sandbox
```

## Development Commands

### Core Development

```bash
# Start development with auto-rebuild
npm run build-and-start

# Run in debug mode
npm run debug

# Format code
npm run format

# Lint code
npm run lint
npm run lint:fix

# Type checking
npm run typecheck
```

### Package Management

```bash
# Install dependencies
npm install

# Clean build artifacts
npm run clean

# Generate git commit info
npm run generate

# Bundle for distribution
npm run bundle
```

## Building

### Standard Build

```bash
# Build main project
npm run build

# Build all packages in workspace
npm run build:packages

# Build with VS Code extension
npm run build:all
```

### VS Code Extension

```bash
# Build VS Code companion extension
npm run build:vscode
```

### Distribution Bundle

```bash
# Create distribution bundle
npm run bundle
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests with CI settings
npm run test:ci

# Run script tests
npm run test:scripts
```

### Integration Tests

```bash
# Run end-to-end tests
npm run test:e2e

# Run integration tests without sandbox
npm run test:integration:sandbox:none

# Run integration tests with Podman
npm run test:integration:sandbox:podman

# Run all integration tests
npm run test:integration:all
```

### Verbose Testing

```bash
# Run tests with verbose output and keep artifacts
VERBOSE=true KEEP_OUTPUT=true npm run test:integration:sandbox:none
```

## Using the CLI

### Interactive Mode

```bash
# Start interactive CLI
npm start

# Or use the built binary
./bundle/gemini.js
```

### Non-Interactive Mode

```bash
# Show help
npm start -- --help

# Show version
npm start -- --version

# Run with a prompt
npm start -- -p "Your prompt here"

# Run with interactive prompt mode
npm start -- -i "Your prompt here"
```

### Common CLI Options

```bash
# Debug mode
npm start -- --debug

# YOLO mode (auto-approve all actions)
npm start -- --yolo

# Enable sandbox
npm start -- --sandbox

# Use specific model
npm start -- --model "gemini-pro"

# Include all files in context
npm start -- --all-files

# Show memory usage
npm start -- --show-memory-usage
```

### MCP Server Management

```bash
# Manage MCP servers
npm start -- mcp

# List MCP servers
npm start -- mcp list

# Authenticate with MCP server
npm start -- mcp auth
```

### Extensions Management

```bash
# List extensions
npm start -- extensions list

# Install extension
npm start -- extensions install <extension-name>

# Update extensions
npm start -- extensions update
```

### Budget Management

```bash
# Manage API budget
npm start -- budget

# Set budget limit
npm start -- --budget-limit 100

# Disable budget tracking
npm start -- --disable-budget
```

## Sandbox Mode

The Gemini CLI supports sandbox execution for security isolation.

### Prerequisites

For container-based sandboxing, install one of:

- Docker: `docker --version`
- Podman: `podman --version`

On macOS, Seatbelt is available by default.

### Enable Sandbox

```bash
# Enable sandbox (auto-detect docker/podman)
npm start -- --sandbox

# Force specific sandbox command
GEMINI_SANDBOX=docker npm start
GEMINI_SANDBOX=podman npm start

# Use macOS Seatbelt (on macOS)
GEMINI_SANDBOX=sandbox-exec npm start
```

### Sandbox Configuration

```bash
# Set sandbox environment variable
export GEMINI_SANDBOX=true

# Or in your .env file
echo "GEMINI_SANDBOX=true" >> .env

# Use custom sandbox image
export GEMINI_SANDBOX_IMAGE=your-custom-image:tag
```

### Known Sandbox Issue

**Current Issue**: The `--sandbox` flag may show "no sandbox (see /docs)" even when enabled.

**Root Cause**: The sandbox build script (`scripts/build_sandbox.js`) is missing from the codebase.

**Workaround**: Use local sandbox execution without container isolation:

```bash
# On macOS, use Seatbelt (if available)
npm start -- --sandbox

# Check sandbox status in footer
```

## Troubleshooting

### Common Issues

1. **"no sandbox" despite --sandbox flag**
   - This is a known issue due to missing sandbox build script
   - Sandbox container image needs to be built separately
   - Use `GEMINI_SANDBOX=sandbox-exec` on macOS for local sandboxing

2. **Build failures**

   ```bash
   npm run clean
   npm install
   npm run build
   ```

3. **Linting errors**

   ```bash
   npm run lint:fix
   ```

4. **Type checking errors**

   ```bash
   npm run typecheck
   ```

5. **punycode deprecation warnings**
   - This is a known warning and doesn't affect functionality
   - It's related to Node.js version compatibility

### Debug Mode

```bash
# Start in debug mode
npm run debug

# Or with environment variable
DEBUG=1 npm start

# Use Node.js inspector
node --inspect-brk scripts/start.js
```

### Development Workflow

```bash
# Full development cycle
npm run preflight

# This runs:
# - clean
# - install dependencies
# - format code
# - lint with zero warnings
# - build
# - type check
# - run CI tests
```

### Authentication

```bash
# Set up npm authentication (if needed)
npm run auth

# Or manually
npx google-artifactregistry-auth
```

## Advanced Usage

### A2A Server Mode

```bash
# Start agent-to-agent server
npm run start:a2a-server
```

### Custom Configuration

Create a `.gemini/settings.json` file in your project or home directory:

```json
{
  "tools": {
    "sandbox": true
  },
  "ui": {
    "showMemoryUsage": true
  },
  "telemetry": {
    "enabled": false
  }
}
```

### Environment Variables

```bash
# Sandbox configuration
GEMINI_SANDBOX=true
GEMINI_SANDBOX_IMAGE=custom-image:tag

# Debug mode
DEBUG=1

# Build configuration
BUILD_SANDBOX=1
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the preflight check: `npm run preflight`
5. Submit a pull request

For more detailed contributing guidelines, see `CONTRIBUTING.md`.

## Support

- GitHub Issues: https://github.com/google-gemini/gemini-cli/issues
- Documentation: Run `npm start -- /docs` or visit online docs
- Help command: `npm start -- --help`
