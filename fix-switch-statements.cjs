#!/usr/bin/env node

/**
 * Script to fix malformed switch statements with default cases outside switch blocks
 */

const fs = require('fs');
const path = require('path');

function fixSwitchStatements(content) {
  let fixed = content;

  // Pattern to find switch statements and misplaced default cases
  // Look for switch blocks followed by code and then a misplaced default
  const switchPattern =
    /(switch\s*\([^)]+\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*?)(}\s*)([^{}]*?)(default:\s*\/\/[^\n]*\n\s*break;\s*)/gs;

  fixed = fixed.replace(
    switchPattern,
    (match, switchContent, switchEnd, codeInBetween, defaultCase) => {
      // Move the default case inside the switch before the closing brace
      return (
        switchContent.replace(
          /}\s*$/,
          '        ' + defaultCase.trim() + '\n      }',
        ) +
        '\n    ' +
        codeInBetween.trim()
      );
    },
  );

  // Handle cases where default is after a function's closing brace but should be inside a switch
  const functionPattern = /(}\s*)(default:\s*\/\/[^\n]*\n\s*break;\s*)(}\s*)/g;
  fixed = fixed.replace(
    functionPattern,
    (match, firstClose, defaultCase, lastClose) => {
      return defaultCase + '\n    ' + firstClose + lastClose;
    },
  );

  return fixed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if this file has syntax errors we need to fix
    if (
      content.includes('default:') &&
      content.includes('// Handle unexpected values')
    ) {
      const fixed = fixSwitchStatements(content);

      if (fixed !== content) {
        fs.writeFileSync(filePath, fixed);
        console.log(`Fixed: ${filePath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let fixedCount = 0;

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !file.startsWith('.') &&
      file !== 'node_modules'
    ) {
      fixedCount += processDirectory(fullPath);
    } else if (file.match(/\.(js|ts|jsx|tsx)$/)) {
      if (processFile(fullPath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Main execution
const rootDir = process.cwd();
console.log('Fixing malformed switch statements...');

const fixedCount = processDirectory(rootDir);
console.log(`Fixed switch statements in ${fixedCount} files`);
