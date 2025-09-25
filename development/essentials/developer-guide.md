# Developer Guide

## Overview

Welcome to the Gemini CLI development guide! This comprehensive document will help you get started with contributing to the Gemini CLI project, from initial setup to advanced development workflows.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building and Packaging](#building-and-packaging)
- [Debugging](#debugging)
- [Contributing Guidelines](#contributing-guidelines)
- [Advanced Topics](#advanced-topics)

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 9 or higher (comes with Node.js)
- **Git**: Latest version
- **Operating System**: macOS, Linux, or Windows

### 1. Clone the Repository

```bash
git clone https://github.com/google-gemini/gemini-cli.git
cd gemini-cli
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

### 4. Run the CLI

```bash
# Run from source
npm run start

# Or use the built version
./bundle/gemini.js
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Development Environment Setup

### Recommended IDE Setup

#### VS Code

The project includes VS Code configuration files:

```bash
# Open in VS Code
code .
```

**Recommended Extensions** (see `.vscode/extensions.json`):

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- GitLens
- Thunder Client (for API testing)

#### IntelliJ IDEA / WebStorm

Import the project as a Node.js project and install the following plugins:

- TypeScript
- ESLint
- Prettier
- Git integration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Authentication (choose one)
GEMINI_API_KEY=your_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CLOUD_PROJECT=your_project_id

# Development settings
DEBUG=1
NODE_ENV=development
LOG_LEVEL=debug

# Optional: Override default ports
A2A_SERVER_PORT=41242
```

### Authentication Setup for Development

#### Option 1: API Key (Recommended for Development)

```bash
# Get API key from https://aistudio.google.com/apikey
export GEMINI_API_KEY="your_api_key_here"
```

#### Option 2: Google Cloud Authentication

```bash
# Install gcloud CLI and authenticate
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

#### Option 3: OAuth (for testing user flows)

```bash
# Run the CLI and follow OAuth flow
npm run start
# Select "Login with Google" when prompted
```

## Project Structure

```
gemini-cli/
├── packages/                    # Monorepo packages
│   ├── cli/                    # CLI frontend package
│   ├── core/                   # Backend engine package
│   ├── a2a-server/            # Agent-to-Agent server
│   ├── autonomous-task-management/ # Task management system
│   ├── test-utils/            # Shared test utilities
│   └── vscode-ide-companion/  # VS Code extension
├── docs/                      # Documentation
├── development/               # Development resources
│   ├── essentials/           # Core development docs
│   ├── logs/                 # Development logs
│   └── reports/              # Analysis reports
├── scripts/                  # Build and utility scripts
├── integration-tests/        # Integration test suites
├── bundle/                   # Built CLI bundle
├── dist/                     # Build output
└── third_party/              # Third-party dependencies
```

### Key Directories

- **`packages/cli/src/`**: User interface, commands, configuration
- **`packages/core/src/`**: API client, tool system, core logic
- **`docs/`**: User and developer documentation
- **`scripts/`**: Build, release, and utility scripts
- **`integration-tests/`**: End-to-end test suites

## Development Workflow

### 1. Feature Development

#### Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

#### Follow Feature Workflow

The project uses an advanced feature management system:

```bash
# Suggest new feature (if not already in FEATURES.json)
node scripts/suggest-feature.js

# Check approved features
npm run features:list

# Work on approved features only
```

#### Development Process

1. **Plan**: Use TodoWrite for task breakdown
2. **Implement**: Write code following project standards
3. **Test**: Add comprehensive tests
4. **Document**: Update relevant documentation
5. **Validate**: Run all validation checks

### 2. Code Standards

#### TypeScript Configuration

The project uses strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true
  }
}
```

#### ESLint Configuration

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check linting in CI mode
npm run lint:ci
```

#### Prettier Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### 3. Code Review Process

#### Pre-commit Hooks

The project uses Husky for pre-commit validation:

```bash
# Hooks run automatically on commit
git commit -m "feat: add new feature"

# Manually run pre-commit checks
npm run pre-commit
```

#### Pull Request Guidelines

1. **Branch naming**: `feature/`, `bugfix/`, `docs/`, `refactor/`
2. **Commit messages**: Follow [Conventional Commits](https://conventionalcommits.org/)
3. **PR template**: Fill out the provided template completely
4. **Reviews**: Require at least one approval
5. **CI checks**: All checks must pass

## Testing

### Test Structure

```
packages/*/src/
├── __tests__/           # Unit tests
├── *.test.ts           # Co-located tests
└── test-utils/         # Test utilities

integration-tests/       # Integration tests
├── *.test.ts          # Test files
└── test-helper.ts     # Test helpers
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Writing Tests

#### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GeminiApiClient } from '../src/api/client';

describe('GeminiApiClient', () => {
  it('should send message successfully', async () => {
    const client = new GeminiApiClient({ apiKey: 'test' });
    const response = await client.sendMessage({
      content: 'Hello',
      role: 'user',
    });

    expect(response.content).toBeDefined();
    expect(response.role).toBe('assistant');
  });
});
```

#### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { createTestHelper } from './test-helper';

describe('CLI Integration', () => {
  it('should handle basic commands', async () => {
    const helper = await createTestHelper();
    const result = await helper.runCommand('/help');

    expect(result.success).toBe(true);
    expect(result.output).toContain('Available commands');
  });
});
```

### Test Utilities

The project provides comprehensive test utilities:

```typescript
import {
  mockGeminiApi,
  createTestExtension,
  mockFileSystem,
  createMockCommandContext,
} from '@google/gemini-cli-test-utils';
```

## Building and Packaging

### Build Commands

```bash
# Clean build
npm run clean

# Build all packages
npm run build

# Build specific package
npm run build --workspace packages/cli

# Build with watch mode
npm run build:watch

# Bundle for distribution
npm run bundle
```

### Build Process

1. **TypeScript Compilation**: Source code → JavaScript
2. **Asset Copying**: Static assets to output directory
3. **Bundling**: Single executable bundle creation
4. **Validation**: Build output testing

### Distribution

```bash
# Create distribution package
npm run prepare:package

# Test distribution
npm pack --dry-run

# Local install for testing
npm install -g .
```

## Debugging

### Debug Configurations

#### VS Code Debug Configuration

The project includes `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Gemini CLI",
  "program": "${workspaceFolder}/scripts/start.js",
  "env": {
    "DEBUG": "1"
  }
}
```

#### Command Line Debugging

```bash
# Debug mode
npm run debug

# With specific debug flags
DEBUG=gemini:* npm run start

# Node.js inspector
node --inspect-brk scripts/start.js
```

### Logging and Diagnostics

#### Debug Logging

```typescript
import { logger } from '../utils/logger';

logger.debug('Debug message', { context: 'additional data' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

#### Performance Monitoring

```typescript
import { performance } from '../utils/performance';

const timer = performance.startTimer('operation-name');
// ... perform operation
timer.end();
```

### Common Debugging Scenarios

#### API Communication Issues

```bash
# Enable API debugging
DEBUG=gemini:api npm run start

# Check network traffic
DEBUG=gemini:network npm run start
```

#### Tool Execution Problems

```bash
# Debug tool execution
DEBUG=gemini:tools npm run start

# Verbose tool output
VERBOSE_TOOLS=true npm run start
```

#### Configuration Issues

```bash
# Debug configuration loading
DEBUG=gemini:config npm run start

# Show effective configuration
npm run start -- --show-config
```

## Contributing Guidelines

### Code Style

#### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (with descriptive names)

#### Documentation Standards

```typescript
/**
 * Processes user input and generates appropriate response
 * @param input - User's input message
 * @param context - Current conversation context
 * @returns Promise resolving to processed response
 * @throws {ValidationError} When input validation fails
 */
async function processInput(
  input: string,
  context: ConversationContext,
): Promise<ProcessedResponse> {
  // Implementation
}
```

#### Error Handling

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  return {
    success: false,
    error: error.message,
    code: 'OPERATION_FAILED',
  };
}
```

### Git Workflow

#### Commit Message Format

```
type(scope): description

body (optional)

footer (optional)
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```
feat(cli): add new search command
fix(core): resolve authentication token refresh
docs(api): update tool development guide
```

#### Branch Management

- `main`: Production-ready code
- `develop`: Integration branch (if used)
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `docs/*`: Documentation updates
- `refactor/*`: Code refactoring

### Pull Request Process

1. **Create PR**: Use provided template
2. **CI Checks**: Ensure all checks pass
3. **Review**: Address feedback promptly
4. **Merge**: Squash commits for clean history

## Advanced Topics

### Extension Development

#### Creating Custom Extensions

```typescript
import { ExtensionBase, ExtensionContext } from '@google/gemini-cli-core';

export class MyExtension extends ExtensionBase {
  name = 'my-extension';
  version = '1.0.0';
  description = 'My custom extension';

  async initialize(context: ExtensionContext) {
    // Initialize extension
  }

  registerCommands() {
    return [
      {
        name: 'my-command',
        description: 'My custom command',
        handler: this.handleCommand.bind(this),
      },
    ];
  }

  private async handleCommand(args: string[], context: any) {
    return { success: true, content: 'Hello from my extension!' };
  }
}
```

#### Tool Development

```typescript
import { BaseTool, ToolResult } from '@google/gemini-cli-core';

export class MyCustomTool extends BaseTool {
  name = 'my-tool';
  description = 'My custom tool';

  parameters = {
    type: 'object' as const,
    properties: {
      input: { type: 'string', description: 'Input parameter' },
    },
    required: ['input'],
  };

  async execute(args: { input: string }): Promise<ToolResult> {
    // Tool implementation
    return {
      success: true,
      content: `Processed: ${args.input}`,
    };
  }
}
```

### Performance Optimization

#### Bundle Size Analysis

```bash
# Analyze bundle size
npm run analyze:bundle

# Check package dependencies
npm run analyze:deps
```

#### Memory Profiling

```bash
# Run with memory profiling
node --inspect --max-old-space-size=4096 scripts/start.js
```

### Security Considerations

#### Input Sanitization

```typescript
import { sanitizeInput } from '../utils/security';

const cleanInput = sanitizeInput(userInput, {
  allowHtml: false,
  maxLength: 1000,
});
```

#### Permission Checks

```typescript
if (!hasPermission(user, 'tool:execute', toolName)) {
  throw new PermissionError('Insufficient permissions');
}
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear node modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Test Failures

```bash
# Run tests in isolation
npm test -- --run
npm test -- --reporter=verbose
```

#### Authentication Problems

```bash
# Clear cached credentials
rm -rf ~/.gemini/credentials
npm run start -- --auth
```

### Getting Help

1. **Documentation**: Check `/docs/` directory
2. **Issues**: Search [GitHub Issues](https://github.com/google-gemini/gemini-cli/issues)
3. **Discussions**: Use GitHub Discussions
4. **Community**: Join community channels

## Resources

- **[Architecture Guide](./architecture.md)**: System architecture overview
- **[API Reference](./api-reference.md)**: Complete API documentation
- **[Best Practices](./best-practices.md)**: Development best practices
- **[Contributing Guide](./contributing.md)**: Detailed contribution guidelines
- **[Troubleshooting](./troubleshooting.md)**: Common issues and solutions

---

Happy developing! 🚀
