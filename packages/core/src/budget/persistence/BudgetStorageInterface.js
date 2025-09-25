/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Storage event types for monitoring
 */
export var StorageEventType;
(function (StorageEventType) {
  /** Storage initialized successfully */
  StorageEventType['INITIALIZED'] = 'initialized';
  /** Storage initialization failed */
  StorageEventType['INIT_FAILED'] = 'init_failed';
  /** Data read operation */
  StorageEventType['DATA_READ'] = 'data_read';
  /** Data write operation */
  StorageEventType['DATA_WRITE'] = 'data_write';
  /** Storage error occurred */
  StorageEventType['ERROR'] = 'error';
  /** Backup created */
  StorageEventType['BACKUP_CREATED'] = 'backup_created';
  /** Data restored from backup */
  StorageEventType['BACKUP_RESTORED'] = 'backup_restored';
  /** Storage health check */
  StorageEventType['HEALTH_CHECK'] = 'health_check';
  /** Storage connection closed */
  StorageEventType['CLOSED'] = 'closed';
})(StorageEventType || (StorageEventType = {}));
//# sourceMappingURL=BudgetStorageInterface.js.map
