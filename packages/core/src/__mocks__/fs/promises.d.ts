/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as actualFsPromises from 'node:fs/promises';
export declare const mockControl: {
  mockReadFile: import('vitest').Mock<(...args: unknown[]) => unknown>;
};
export declare const access: typeof actualFsPromises.access;
export const appendFile: typeof actualFsPromises.appendFile;
export const chmod: typeof actualFsPromises.chmod;
export const chown: typeof actualFsPromises.chown;
export const copyFile: typeof actualFsPromises.copyFile;
export const cp: typeof actualFsPromises.cp;
export const lchmod: typeof actualFsPromises.lchmod;
export const lchown: typeof actualFsPromises.lchown;
export const link: typeof actualFsPromises.link;
export const lstat: typeof actualFsPromises.lstat;
export const mkdir: typeof actualFsPromises.mkdir;
export const open: typeof actualFsPromises.open;
export const opendir: typeof actualFsPromises.opendir;
export const readdir: typeof actualFsPromises.readdir;
export const readlink: typeof actualFsPromises.readlink;
export const realpath: typeof actualFsPromises.realpath;
export const rename: typeof actualFsPromises.rename;
export const rmdir: typeof actualFsPromises.rmdir;
export const rm: typeof actualFsPromises.rm;
export const stat: typeof actualFsPromises.stat;
export const symlink: typeof actualFsPromises.symlink;
export const truncate: typeof actualFsPromises.truncate;
export const unlink: typeof actualFsPromises.unlink;
export const utimes: typeof actualFsPromises.utimes;
export const watch: typeof actualFsPromises.watch;
export const writeFile: typeof actualFsPromises.writeFile;
export declare const readFile: import('vitest').Mock<
  (...args: unknown[]) => unknown
>;
