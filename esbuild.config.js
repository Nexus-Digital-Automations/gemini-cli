/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

let esbuild;
try {
  esbuild = (await import('esbuild')).default;
} catch (_error) {
  console.warn('esbuild not available, skipping bundle step');
  process.exit(0);
}

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);
const require = createRequire(import.meta.url);
const pkg = require(path.resolve(DIRNAME, 'package.json'));

const external = [
  '@lydell/node-pty',
  'node-pty',
  '@lydell/node-pty-darwin-arm64',
  '@lydell/node-pty-darwin-x64',
  '@lydell/node-pty-linux-x64',
  '@lydell/node-pty-win32-arm64',
  '@lydell/node-pty-win32-x64',
];

esbuild
  .build({
    entryPoints: ['packages/cli/index.ts'],
    bundle: true,
    outfile: 'bundle/gemini.js',
    platform: 'node',
    format: 'esm',
    external,
    alias: {
      'is-in-ci': path.resolve(DIRNAME, 'packages/cli/src/patches/is-in-ci.ts'),
    },
    define: {
      'process.env.CLI_VERSION': JSON.stringify(pkg.version),
    },
    banner: {
      js: `import { createRequire as _createRequire } from 'module'; const require = _createRequire(import.meta.url); globalThis.FILENAME = require('url').fileURLToPath(import.meta.url); globalThis.DIRNAME = require('path').dirname(globalThis.FILENAME);`,
    },
    loader: { '.node': 'file' },
    metafile: true,
    write: true,
  })
  .then(({ metafile }) => {
    if (process.env.DEV === 'true') {
      writeFileSync('./bundle/esbuild.json', JSON.stringify(metafile, null, 2));
    }
  })
  .catch(() => process.exit(1));
