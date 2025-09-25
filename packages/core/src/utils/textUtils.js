/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Safely replaces text with literal strings, avoiding ECMAScript GetSubstitution issues.
 *
 * JavaScript's `replaceAll` method treats `$` characters in the replacement string as special
 * substitution patterns (like `$&` for the matched string). This function escapes those patterns
 * to ensure the replacement string is treated literally.
 *
 * @param str - The source string to perform replacements on
 * @param oldString - The substring to find and replace
 * @param newString - The literal replacement string (will be escaped if it contains $)
 * @returns The string with all occurrences of oldString replaced with newString
 *
 * @example
 * ```typescript
 * // Regular replaceAll would interpret $& as the matched string
 * 'hello world'.replaceAll('world', '$& again'); // 'hello world again'
 *
 * // safeLiteralReplace treats it as literal text
 * safeLiteralReplace('hello world', 'world', '$& again'); // 'hello $& again'
 * ```
 */
export function safeLiteralReplace(str, oldString, newString) {
  if (oldString === '' || !str.includes(oldString)) {
    return str;
  }
  if (!newString.includes('$')) {
    return str.replaceAll(oldString, newString);
  }
  const escapedNewString = newString.replaceAll('$', '$$$$');
  return str.replaceAll(oldString, escapedNewString);
}
/**
 * Checks if a Buffer contains binary data by testing for the presence of NULL bytes.
 *
 * This is a heuristic approach where the presence of a NULL byte (0x00) is considered
 * a strong indicator that the data is binary rather than plain text. Text files should
 * not contain NULL bytes under normal circumstances.
 *
 * @param data - The Buffer to analyze for binary content (null/undefined returns false)
 * @param sampleSize - Number of bytes from the start to test (default: 512)
 * @returns True if a NULL byte is found in the sample, false otherwise
 *
 * @example
 * ```typescript
 * const textBuffer = Buffer.from('Hello, world!', 'utf8');
 * console.log(isBinary(textBuffer)); // false
 *
 * const binaryBuffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x77]);
 * console.log(isBinary(binaryBuffer)); // true (contains NULL byte)
 *
 * // Test only first 100 bytes of a large buffer
 * console.log(isBinary(largeBuffer, 100));
 * ```
 */
export function isBinary(data, sampleSize = 512) {
  if (!data) {
    return false;
  }
  const sample = data.length > sampleSize ? data.subarray(0, sampleSize) : data;
  for (const byte of sample) {
    // The presence of a NULL byte (0x00) is one of the most reliable
    // indicators of a binary file. Text files should not contain them.
    if (byte === 0) {
      return true;
    }
  }
  // If no NULL bytes were found in the sample, we assume it's text.
  return false;
}
//# sourceMappingURL=textUtils.js.map
