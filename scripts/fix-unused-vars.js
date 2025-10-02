#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Automated script to fix @typescript-eslint/no-unused-vars errors
 * Reads ESLint JSON output and applies fixes to source files
 */

import fs from 'node:fs';

const eslintOutputPath = '/tmp/eslint-unused-vars-filtered.json';
const eslintOutput = JSON.parse(fs.readFileSync(eslintOutputPath, 'utf8'));

console.log(`Found ${eslintOutput.length} files with unused variable errors`);

let totalFixed = 0;

for (const fileData of eslintOutput) {
  const filePath = fileData.filePath;
  console.log(`\nProcessing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Sort errors by line number in descending order to avoid offset issues
  const sortedErrors = fileData.messages.sort((a, b) => b.line - a.line);

  for (const error of sortedErrors) {
    const lineNum = error.line - 1; // Convert to 0-based index
    const line = lines[lineNum];
    const message = error.message;

    console.log(`  Line ${error.line}: ${message}`);

    // Extract variable name from message
    const match = message.match(
      /'([^']+)' is (defined but never used|assigned a value but never used)/,
    );
    if (!match) continue;

    const varName = match[1];

    // Skip if already prefixed with underscore
    if (varName.startsWith('_')) continue;

    // Determine the fix based on the context
    let newLine = line;

    // Case 1: Catch block errors
    if (line.includes('catch') && line.includes(varName)) {
      newLine = line.replace(
        new RegExp(`catch\\s*\\(\\s*${varName}\\s*\\)`, 'g'),
        `catch (_${varName})`,
      );
    }
    // Case 2: Unused imports - prefix with underscore
    else if (line.includes('import') && line.includes(varName)) {
      // For destructured imports
      if (line.includes('{') && line.includes('}')) {
        newLine = line.replace(
          new RegExp(`\\b${varName}\\b`, 'g'),
          `_${varName}`,
        );
      } else {
        newLine = line.replace(
          new RegExp(`\\b${varName}\\b`, 'g'),
          `_${varName}`,
        );
      }
    }
    // Case 3: Function parameters
    else if (
      line.includes(varName) &&
      (line.includes('function') ||
        line.includes('=>') ||
        line.includes('async'))
    ) {
      // Replace parameter name with underscore prefix
      newLine = line.replace(
        new RegExp(`\\b${varName}\\b`, 'g'),
        `_${varName}`,
      );
    }
    // Case 4: Variable declarations (const, let, var)
    else if (line.match(/\b(const|let|var)\b/) && line.includes(varName)) {
      // For destructured variables
      if (line.includes('{') || line.includes('[')) {
        newLine = line.replace(
          new RegExp(`\\b${varName}\\b`, 'g'),
          `_${varName}`,
        );
      } else {
        newLine = line.replace(
          new RegExp(`\\b${varName}\\b`, 'g'),
          `_${varName}`,
        );
      }
    }

    if (newLine !== line) {
      lines[lineNum] = newLine;
      totalFixed++;
      console.log(`    Fixed: ${varName} -> _${varName}`);
    }
  }

  // Write back the modified content
  const newContent = lines.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✓ File updated`);
  }
}

console.log(`\n✓ Total fixes applied: ${totalFixed}`);
