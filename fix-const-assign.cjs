#!/usr/bin/env node

/**
 * Script to fix malformed switch statements with default cases outside switch blocks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findFilesWithSwitchIssues(dir) {
  const files = [];

  function scanDir(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist'
        ) {
          continue;
        }

        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.js') ||
            entry.name.endsWith('.ts') ||
            entry.name.endsWith('.tsx'))
        ) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Look for malformed switch statements with default outside
            if (
              content.includes('default:') &&
              content.includes('// Handle unexpected values')
            ) {
              files.push(fullPath);
            }
          } catch (_err) {
            // Skip files we can't read
          }
        }
      }
    } catch (_err) {
      // Skip directories we can't read
    }
  }

  scanDir(dir);
  return files;
}

function fixSwitchStatements(content) {
  let fixed = content;

  // Pattern 1: Fix cases where default is right after a closing brace of a switch outside the function
  const pattern1 =
    /(\s*)(}\s*(?:\/\/[^\n]*\n\s*)*)(default:\s*(?:\/\/[^\n]*\n\s*)*\/\/\s*Handle[^\n]*\n\s*break;\s*)(})/g;
  fixed = fixed.replace(
    pattern1,
    (match, indent1, closingBrace1, defaultCase, closingBrace2) => {
      // Move the default case inside the previous closing brace
      return indent1 + defaultCase + '\n' + indent1 + closingBrace2;
    },
  );

  // Pattern 2: Fix cases where default is after a switch's closing brace but before function closing
  const pattern2 =
    /(switch\s*\([^)]+\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*)(}\s*)(default:\s*\/\/[^\n]*\n\s*break;\s*)/gs;
  fixed = fixed.replace(
    pattern2,
    (match, switchContent, closingBrace, defaultCase) => {
      return switchContent.replace(
        /}\s*$/,
        '        ' + defaultCase.trim() + '\n      }',
      );
    },
  );

  // Pattern 3: Handle more complex nested cases
  const pattern3 = /(}\s*)(}\s*)(default:\s*\/\/[^\n]*\n\s*break;\s*)(}\s*)/g;
  fixed = fixed.replace(
    pattern3,
    (match, close1, close2, defaultCase, close3) => {
      return close1 + defaultCase + '\n    ' + close2 + close3;
    },
  );

  return fixed;
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixSwitchStatements(content);

    if (fixed !== content) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
  return false;
}

// Main execution
const rootDir = process.cwd();
console.log('Scanning for files with malformed switch statements...');

const filesToFix = findFilesWithSwitchIssues(rootDir);
console.log(`Found ${filesToFix.length} files to examine`);

let fixedCount = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`Fixed switch statements in ${fixedCount} files`);

// Check remaining syntax errors
try {
  console.log('Checking remaining syntax errors...');
  const result = execSync(
    'npm run lint 2>&1 | grep -i "unexpected token\\|declaration or statement expected" | wc -l',
    { encoding: 'utf8', timeout: 60000 },
  );
  const errorCount = parseInt(result.trim());
  console.log(`Remaining syntax errors: ${errorCount}`);
} catch (_err) {
  console.log('Could not check remaining errors (lint may take time)');
}
