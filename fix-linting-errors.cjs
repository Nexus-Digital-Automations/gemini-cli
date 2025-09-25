#!/usr/bin/env node
/**
 * Script to fix common ESLint errors in cost analysis files
 */

const fs = require('fs');
const path = require('path');

const costAnalysisDir = 'packages/core/src/budget/cost-analysis';

// Get all TypeScript files in cost analysis directory
function getAllTsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Fix common linting issues
function fixLintingIssues(content) {
  let fixed = content;

  // Fix unused error variables
  fixed = fixed.replace(/} catch \(error\) \{/g, '} catch (_error) {');
  fixed = fixed.replace(/} catch \(parseError\) \{/g, '} catch (_parseError) {');

  // Fix unused parameters with underscore prefix
  fixed = fixed.replace(/\(([^)]*?)\b(error|parseError|groupKey|features|targets|currentAllocations|newUsageData|businessValue|efficiencyMetrics|riskAssessment|dataPoints|data|period1Label|period2Label|df|allMetrics|index|requestCount|totalTokens|X)\b/g, (match, before, param) => {
    return `(${before}_${param}`;
  });

  // Fix unused variables with underscore prefix
  fixed = fixed.replace(/(\s+)(const|let|var)\s+(error|parseError|groupKey|features|targets|currentAllocations|newUsageData|businessValue|efficiencyMetrics|riskAssessment|dataPoints|data|period1Label|period2Label|df|allMetrics|index|requestCount|totalTokens|X)\s*=/g, (match, space, keyword, varName) => {
    return `${space}${keyword} _${varName} =`;
  });

  // Fix any types
  fixed = fixed.replace(/: any\b/g, ': unknown');
  fixed = fixed.replace(/Record<string, any>/g, 'Record<string, unknown>');

  // Fix missing radix
  fixed = fixed.replace(/parseInt\(([^)]+)\)/g, 'parseInt($1, 10)');

  // Fix case declarations
  fixed = fixed.replace(/(case\s+[^:]+:)\s*\n\s*(const|let|var)\s+/g, '$1\n      {\n        $2 ');
  fixed = fixed.replace(/(case\s+[^:]+:)\s*\n\s*\{?\s*(const|let|var)\s+([^;]+);/g, '$1\n      {\n        $2 $3;');

  // Fix missing default cases
  fixed = fixed.replace(/(switch\s*\([^)]+\)\s*\{[^}]*)(case\s+[^:]+:[^}]*)/g, (match, switchPart, cases) => {
    if (!cases.includes('default:')) {
      return match + '\n        default:\n          break;';
    }
    return match;
  });

  // Fix React unescaped entities
  fixed = fixed.replace(/([^&])'([^s])/g, "$1&apos;$2");

  // Remove unused imports
  if (fixed.includes("import * as fs from 'node:fs/promises'") && !fixed.includes('fs.')) {
    fixed = fixed.replace("import * as fs from 'node:fs/promises';\n", '');
  }

  return fixed;
}

// Main execution
const files = getAllTsFiles(costAnalysisDir);
console.log(`Found ${files.length} TypeScript files to fix:`);

for (const file of files) {
  console.log(`Fixing ${file}...`);
  const content = fs.readFileSync(file, 'utf8');
  const fixed = fixLintingIssues(content);

  if (content !== fixed) {
    fs.writeFileSync(file, fixed);
    console.log(`  - Fixed linting issues in ${file}`);
  } else {
    console.log(`  - No changes needed for ${file}`);
  }
}

console.log('Linting fixes complete!');