/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ajValidator = new (Ajv as any)({
  allowUnionTypes: true,
  strict: false,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(addFormats as any)(ajValidator);

/**
 * Simple utility to validate objects against JSON Schemas
 */
export class SchemaValidator {
  /**
   * Returns null if the data confroms to the schema described by schema (or if schema
   *  is null). Otherwise, returns a string describing the error.
   */
  static validate(schema: unknown | undefined, data: unknown): string | null {
    if (!schema) {
      return null;
    }
    if (typeof data !== 'object' || data === null) {
      return 'Value of params must be an object';
    }
    const validate = ajValidator.compile(schema);
    const valid = validate(data);
    if (!valid && validate.errors) {
      return ajValidator.errorsText(validate.errors, { dataVar: 'params' });
    }
    return null;
  }
}
