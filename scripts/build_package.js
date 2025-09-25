/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { execSync } from 'node:child_process';
import { writeFileSync, chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';

if (!process.cwd().includes('packages')) {
  console.error('must be invoked from a package directory');
  process.exit(1);
}

// build typescript files
execSync('tsc --build', { stdio: 'inherit' });

// copy .{md,json} files
execSync('node ../../scripts/copy_files.js', { stdio: 'inherit' });

// touch dist/.last_build
writeFileSync(join(process.cwd(), 'dist', '.last_build'), '');

// Set execute permissions for CLI binary (if it exists)
const indexJsPath = join(process.cwd(), 'dist', 'index.js');
if (existsSync(indexJsPath)) {
  chmodSync(indexJsPath, 0o755);
  console.log('Set execute permissions for dist/index.js');
}

process.exit(0);
