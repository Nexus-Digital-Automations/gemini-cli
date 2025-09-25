# Contributing Guide

## Overview

Thank you for your interest in contributing to Gemini CLI! This guide provides detailed information on how to contribute effectively to the project, from setting up your development environment to submitting pull requests.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contribution Types](#contribution-types)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community Guidelines](#community-guidelines)
- [Recognition](#recognition)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 20+ and npm 9+
- **Git** with proper configuration
- **GitHub account** with SSH or HTTPS access
- **Code editor** (VS Code recommended)

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub UI, then clone your fork
   git clone git@github.com:YOUR_USERNAME/gemini-cli.git
   cd gemini-cli

   # Add upstream remote
   git remote add upstream git@github.com:google-gemini/gemini-cli.git
   ```

2. **Install Dependencies**
   ```bash
   npm install
   npm run build
   ```

3. **Verify Setup**
   ```bash
   npm test
   npm run lint
   ./bundle/gemini.js --version
   ```

### Development Environment

1. **Environment Variables**
   ```bash
   # Create .env file
   cp .env.example .env

   # Add your API key
   echo "GEMINI_API_KEY=your_api_key_here" >> .env
   ```

2. **IDE Configuration**
   ```bash
   # Open in VS Code with recommended settings
   code .

   # Install recommended extensions (see .vscode/extensions.json)
   ```

## Development Workflow

### Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Follow Feature Workflow**

   The project uses an autonomous task management system. Check approved features:

   ```bash
   # View approved features
   cat FEATURES.json | jq '.features[] | select(.status=="approved")'

   # Work only on approved features
   ```

3. **Development Process**
   ```bash
   # Make changes
   npm run dev           # Development mode
   npm test -- --watch  # Watch mode testing
   npm run lint:fix      # Fix linting issues
   ```

4. **Commit Changes**
   ```bash
   # Stage changes
   git add .

   # Commit with conventional format
   git commit -m "feat(cli): add new search command functionality"

   # Push to your fork
   git push origin feature/your-feature-name
   ```

### Commit Message Format

Follow [Conventional Commits](https://conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or modifying tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**
```
feat(tools): add web search functionality
fix(auth): resolve OAuth token refresh issue
docs(api): update tool development guide
test(core): add comprehensive API client tests
refactor(cli): improve command parsing logic
```

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `bugfix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

Examples:
```
feature/autonomous-task-management
bugfix/oauth-token-refresh
docs/update-api-reference
refactor/improve-error-handling
test/add-integration-tests
```

## Contribution Types

### 1. Code Contributions

#### New Features
- Check FEATURES.json for approved features
- Follow architecture principles
- Include comprehensive tests
- Update documentation

#### Bug Fixes
- Reference GitHub issue in PR
- Include regression test
- Provide clear description of fix

#### Performance Improvements
- Include benchmarks
- Document performance gains
- Consider backward compatibility

### 2. Documentation Contributions

#### Types of Documentation
- API documentation
- User guides and tutorials
- Architecture documentation
- Troubleshooting guides
- Code comments and inline docs

#### Documentation Standards
- Clear, concise writing
- Code examples for technical content
- Screenshots for UI changes
- Consistent formatting

### 3. Testing Contributions

#### Test Types Needed
- Unit tests for new functionality
- Integration tests for workflows
- E2E tests for user scenarios
- Performance tests for optimizations

#### Testing Guidelines
```typescript
// Example test structure
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle normal case', () => {
    // Arrange, Act, Assert
  });

  it('should handle edge cases', () => {
    // Test edge cases
  });

  it('should handle errors gracefully', () => {
    // Test error scenarios
  });
});
```

### 4. Community Contributions

- Answer questions in GitHub Discussions
- Help with issue triage
- Improve developer experience
- Create examples and tutorials

## Code Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types for public APIs
export interface CreateUserRequest {
  name: string;
  email: string;
  preferences?: UserPreferences;
}

export async function createUser(
  request: CreateUserRequest
): Promise<Result<User, ValidationError>> {
  // Implementation
}

// ✅ Good: Error handling
try {
  const user = await userService.createUser(request);
  return { success: true, data: user };
} catch (error) {
  logger.error('User creation failed', { error });
  return {
    success: false,
    error: new ValidationError('Failed to create user', error)
  };
}
```

### Code Quality Requirements

1. **Linting**: All code must pass ESLint
   ```bash
   npm run lint
   ```

2. **Type Safety**: No TypeScript errors
   ```bash
   npm run typecheck
   ```

3. **Testing**: Maintain >80% coverage
   ```bash
   npm test -- --coverage
   ```

4. **Documentation**: Public APIs must be documented
   ```typescript
   /**
    * Processes user authentication request
    * @param credentials - User login credentials
    * @returns Promise resolving to auth result
    * @throws {AuthError} When authentication fails
    */
   ```

### Security Requirements

1. **Input Validation**
   ```typescript
   // Validate all inputs
   const validation = validateInput(userInput);
   if (!validation.isValid) {
     throw new ValidationError('Invalid input', validation.errors);
   }
   ```

2. **Secure Defaults**
   ```typescript
   // Use secure defaults
   const config = {
     timeout: 5000,
     retries: 3,
     validateSSL: true, // Always default to secure
     ...userConfig
   };
   ```

3. **Secret Handling**
   ```typescript
   // Never log secrets
   logger.info('API request', {
     url,
     method,
     // Don't log: headers, body with sensitive data
   });

   // Mask sensitive data in errors
   const maskedKey = apiKey.slice(0, 4) + '***';
   ```

## Pull Request Process

### Before Creating PR

1. **Update from upstream**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run full validation**
   ```bash
   npm run preflight
   # This runs: clean, install, format, lint, build, typecheck, test
   ```

3. **Write/update tests**
   - Unit tests for new functions
   - Integration tests for new features
   - Update existing tests if behavior changes

### Creating the PR

1. **Use PR Template**

   The repository includes a PR template. Fill out all sections:

   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed

   ## Documentation
   - [ ] Code comments updated
   - [ ] README updated
   - [ ] API documentation updated

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] No new warnings/errors
   - [ ] Tests pass locally
   ```

2. **Provide Context**
   - Link related issues
   - Explain design decisions
   - Include screenshots for UI changes
   - Add performance benchmarks if relevant

### PR Review Process

1. **Automated Checks**
   - CI/CD pipeline must pass
   - All tests must pass
   - Code coverage maintained
   - Linting and type checking clean

2. **Code Review**
   - At least one maintainer approval required
   - Address all feedback before merge
   - Maintain constructive discussion

3. **Final Steps**
   - Squash commits for clean history
   - Update changelog if significant
   - Merge when approved

## Issue Guidelines

### Before Creating Issues

1. **Search Existing Issues**
   - Check open issues
   - Check closed issues for solutions
   - Check GitHub Discussions

2. **Use Built-in Bug Report**
   ```bash
   gemini /bug
   # This creates issues with diagnostic info
   ```

### Issue Templates

#### Bug Reports
```markdown
**Environment:**
- OS: [e.g. macOS 13.0]
- Node.js: [e.g. 20.5.0]
- CLI Version: [e.g. 0.7.0]

**Steps to Reproduce:**
1. Run command X
2. Enter input Y
3. See error Z

**Expected Behavior:**
What should have happened

**Actual Behavior:**
What actually happened

**Logs/Screenshots:**
Include relevant error messages
```

#### Feature Requests
```markdown
**Use Case:**
Describe the problem you're trying to solve

**Proposed Solution:**
Your idea for solving it

**Alternatives Considered:**
Other approaches you've thought about

**Additional Context:**
Any other relevant information
```

### Issue Triage

Community members can help with issue triage:

1. **Reproduce Issues**
   - Test reported bugs
   - Add reproduction steps
   - Confirm on different platforms

2. **Categorize Issues**
   - Add appropriate labels
   - Set priority levels
   - Link related issues

3. **Provide Solutions**
   - Answer questions
   - Suggest workarounds
   - Create small fixes

## Community Guidelines

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Key points:

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Focus on the project** and technical discussions
- **Help newcomers** and share knowledge

### Communication Channels

1. **GitHub Issues**: Bug reports, feature requests
2. **GitHub Discussions**: Questions, general discussion
3. **Pull Requests**: Code review, technical discussion
4. **Documentation**: Clarifications and improvements

### Best Practices

1. **Be Patient**: Maintainers are volunteers
2. **Be Specific**: Provide detailed information
3. **Be Collaborative**: Work together on solutions
4. **Be Respectful**: Appreciate different perspectives

## Recognition

### Contributors

All contributors are recognized in:

- `CONTRIBUTORS.md` file
- GitHub contributors page
- Release notes for significant contributions
- Community highlights

### Types of Recognition

1. **Code Contributors**: Features, fixes, improvements
2. **Documentation Contributors**: Guides, tutorials, examples
3. **Community Contributors**: Support, triage, testing
4. **Design Contributors**: UI/UX improvements, assets

### Hall of Fame

Outstanding contributors may be:

- Invited to maintainer team
- Given repository permissions
- Featured in project communications
- Offered collaboration opportunities

## Getting Help

### Development Questions

1. **Check Documentation**
   - [Developer Guide](./developer-guide.md)
   - [Architecture Guide](./architecture.md)
   - [API Reference](./api-reference.md)

2. **Ask the Community**
   - GitHub Discussions for general questions
   - GitHub Issues for specific problems
   - Code review comments for implementation details

### Mentorship

New contributors can get help from:

- Maintainer team guidance
- Community member support
- Pair programming sessions
- Code review feedback

### Resources

- [Good First Issues](https://github.com/google-gemini/gemini-cli/labels/good%20first%20issue)
- [Help Wanted](https://github.com/google-gemini/gemini-cli/labels/help%20wanted)
- [Documentation](https://github.com/google-gemini/gemini-cli/tree/main/docs)

## Next Steps

After reading this guide:

1. **Set up your development environment**
2. **Look for a [good first issue](https://github.com/google-gemini/gemini-cli/labels/good%20first%20issue)**
3. **Join the community discussions**
4. **Start contributing!**

Thank you for contributing to Gemini CLI! Your efforts help make AI assistance more accessible and powerful for developers worldwide.

---

**Questions?** Check our [GitHub Discussions](https://github.com/google-gemini/gemini-cli/discussions) or create an issue.

**Ready to contribute?** Start with a [good first issue](https://github.com/google-gemini/gemini-cli/labels/good%20first%20issue)!