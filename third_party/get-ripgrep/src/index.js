/* eslint-disable */
/**
 * @license
 * Copyright 2023 Lvce Editor
 * SPDX-License-Identifier: MIT
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIRNAME = dirname(fileURLToPath(import.meta.url))

export const rgPath = join(
  DIRNAME,
  '..',
  'bin',
  `rg${process.platform === 'win32' ? '.exe' : ''}`,
)
