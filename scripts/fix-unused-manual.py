#!/usr/bin/env python3
"""
Script to fix @typescript-eslint/no-unused-vars errors by prefixing with underscore
"""

import json
import re
from pathlib import Path

# Read the ESLint JSON output
with open('/tmp/eslint-unused-vars-filtered.json', 'r') as f:
    eslint_output = json.load(f)

total_fixed = 0

for file_data in eslint_output:
    file_path = file_data['filePath']
    print(f"\nProcessing: {file_path}")

    with open(file_path, 'r') as f:
        lines = f.readlines()

    # Sort errors by line number in descending order to avoid offset issues
    errors = sorted(file_data['messages'], key=lambda x: x['line'], reverse=True)

    for error in errors:
        line_num = error['line'] - 1  # Convert to 0-based index
        message = error['message']

        # Extract variable name from message
        match = re.search(r"'([^']+)' is (defined but never used|assigned a value but never used)", message)
        if not match:
            continue

        var_name = match.group(1)

        # Skip if already prefixed
        if var_name.startswith('_'):
            continue

        line = lines[line_num]
        new_var_name = f"_{var_name}"

        # Different replacement strategies based on context
        if 'catch' in line and 'Allowed unused caught errors' in message:
            # catch (error) => catch (_error)
            new_line = re.sub(rf'\bcatch\s*\(\s*{re.escape(var_name)}\s*\)', f'catch ({new_var_name})', line)
        elif 'import' in line and ('{' in line or 'import *' in line):
            # import { var } => import { _var }
            # import * as var => import * as _var
            new_line = re.sub(rf'\b{re.escape(var_name)}\b', new_var_name, line)
        elif re.search(r'\b(async\s+)?function\s+\w+\s*\(', line) or '=>' in line or line.strip().startswith('async '):
            # Function parameters
            new_line = re.sub(rf'\b{re.escape(var_name)}\b', new_var_name, line)
        elif re.search(r'\b(const|let|var)\b', line):
            # Variable declarations
            new_line = re.sub(rf'\b{re.escape(var_name)}\b', new_var_name, line)
        else:
            # Fallback: simple word boundary replacement
            new_line = re.sub(rf'\b{re.escape(var_name)}\b', new_var_name, line)

        if new_line != line:
            lines[line_num] = new_line
            total_fixed += 1
            print(f"  Line {error['line']}: {var_name} -> {new_var_name}")

    # Write back
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print(f"  ✓ File updated")

print(f"\n✓ Total fixes applied: {total_fixed}")
