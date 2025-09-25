# Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide helps developers and users resolve common issues encountered with Gemini CLI development, deployment, and usage.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Authentication Problems](#authentication-problems)
- [API and Network Issues](#api-and-network-issues)
- [Build and Installation Problems](#build-and-installation-problems)
- [Tool Execution Issues](#tool-execution-issues)
- [Performance Problems](#performance-problems)
- [Extension and MCP Issues](#extension-and-mcp-issues)
- [Testing Problems](#testing-problems)
- [Development Environment Issues](#development-environment-issues)
- [Debugging Techniques](#debugging-techniques)
- [Getting Help](#getting-help)

## Quick Diagnostics

### Health Check Commands

Run these commands to quickly identify common issues:

```bash
# Check system requirements
node --version              # Should be 20+
npm --version              # Should be 9+

# Check project status
npm run build              # Verify build works
npm test                   # Run test suite
npm run lint              # Check code quality

# Check configuration
gemini --version          # Verify CLI works
gemini --show-config      # Display current config
```

### Environment Verification

```bash
# Check environment variables
echo $GEMINI_API_KEY
echo $GOOGLE_CLOUD_PROJECT
echo $NODE_ENV

# Check file permissions
ls -la ~/.gemini/
ls -la ./.gemini/

# Check network connectivity
ping -c 3 generativelanguage.googleapis.com
```

## Common Issues

### Issue: "Command not found: gemini"

**Symptoms:**
- `gemini: command not found` error
- CLI installed but not accessible

**Solutions:**

1. **Global Installation Check**
   ```bash
   # Check if globally installed
   npm list -g @google/gemini-cli

   # Install globally if missing
   npm install -g @google/gemini-cli

   # Check PATH
   echo $PATH | grep $(npm config get prefix)
   ```

2. **PATH Configuration**
   ```bash
   # Add npm global bin to PATH (bash/zsh)
   echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc

   # For Fish shell
   set -gx PATH (npm config get prefix)/bin $PATH
   ```

3. **Use npx as Alternative**
   ```bash
   # Run without global installation
   npx @google/gemini-cli
   npx https://github.com/google-gemini/gemini-cli
   ```

## Authentication Problems

### Issue: OAuth Login Failures

**Solutions:**

1. **Clear cached credentials**
   ```bash
   rm -rf ~/.gemini/credentials/
   gemini --auth --force-reauth
   ```

2. **Configure proxy if needed**
   ```bash
   export HTTP_PROXY=http://proxy:8080
   export HTTPS_PROXY=http://proxy:8080
   ```

### Issue: API Key Authentication Failures

**Solutions:**

1. **API Key Validation**
   ```bash
   # Verify API key format
   echo $GEMINI_API_KEY | wc -c  # Should be 40+ characters

   # Test API key directly
   curl -H "Authorization: Bearer $GEMINI_API_KEY" \
        "https://generativelanguage.googleapis.com/v1/models"
   ```

## Build and Installation Problems

### Issue: Build Failures

**Solutions:**

1. **Clean Build Process**
   ```bash
   # Clean everything
   npm run clean
   rm -rf node_modules package-lock.json

   # Fresh install
   npm install

   # Rebuild
   npm run build
   ```

## Tool Execution Issues

### Issue: File System Tool Failures

**Solutions:**

1. **Permission Fixes**
   ```bash
   # Check file permissions
   ls -la path/to/file

   # Fix permissions
   chmod 644 path/to/file
   chmod 755 path/to/directory
   ```

## Getting Help

### Self-Help Resources

1. **Check Documentation**
   - [Architecture Guide](./architecture.md)
   - [Developer Guide](./developer-guide.md)
   - [API Reference](./api-reference.md)

2. **Use Built-in Help**
   ```bash
   gemini /help
   gemini /about
   gemini /bug  # Report issues directly
   ```

### Community Support

1. **GitHub Issues**
   - Search existing issues: [GitHub Issues](https://github.com/google-gemini/gemini-cli/issues)
   - Create new issue with debug info

2. **Discussions**
   - General questions: [GitHub Discussions](https://github.com/google-gemini/gemini-cli/discussions)

---

This troubleshooting guide is continuously updated based on user feedback and new issues.