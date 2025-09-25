#!/usr/bin/env node

/**
 * Script to fix all no-const-assign errors by converting
 * export const EnumName = {} patterns to export let EnumName = {}
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findFilesWithPattern(dir) {
  const files = [];

  function scanDir(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }

        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Look for the specific pattern: export const SomeName = {}; followed by IIFE
            if (content.includes('export const ') && content.includes('(function (') && content.includes('|| (') && content.includes('= {})')) {
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

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Pattern to match: export const EnumName = {};
    // followed by (function (EnumName) { ... })(EnumName || (EnumName = {}));
    const pattern = /export const ([A-Za-z_$][A-Za-z0-9_$]*) = \{\};/g;

    let modified = false;
    const newContent = content.replace(pattern, (match, enumName) => {
      // Check if this const is actually used in an IIFE pattern
      const iifePattern = new RegExp(`\\(function \\(${enumName}\\)[\\s\\S]*?\\)\\(${enumName} \\|\\| \\(${enumName} = \\{\\}\\)\\);`);
      if (iifePattern.test(content)) {
        modified = true;
        return `export let ${enumName} = {};`;
      }
      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
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
console.log('Scanning for files with no-const-assign patterns...');

const filesToFix = findFilesWithPattern(rootDir);
console.log(`Found ${filesToFix.length} files to examine`);

let fixedCount = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} files`);

// Check remaining errors
try {
  console.log('Checking remaining no-const-assign errors...');
  const result = execSync('npm run lint 2>&1 | grep "no-const-assign" | wc -l', { encoding: 'utf8', timeout: 60000 });
  const errorCount = parseInt(result.trim());
  console.log(`Remaining no-const-assign errors: ${errorCount}`);
} catch (_err) {
  console.log('Could not check remaining errors (this is normal)');
}