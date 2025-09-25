/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
export interface EncryptionKey {
  readonly id: string;
  readonly algorithm: string;
  readonly keyLength: number;
  readonly createdAt: Date;
  readonly expiresAt?: Date;
  readonly metadata: Record<string, unknown>;
}
export interface EncryptedData {
  readonly encryptedContent: string;
  readonly iv: string;
  readonly authTag: string;
  readonly keyId: string;
  readonly algorithm: string;
  readonly timestamp: Date;
}
export interface DataClassification {
  readonly level:
    | 'public'
    | 'internal'
    | 'confidential'
    | 'restricted'
    | 'top-secret';
  readonly categories: string[];
  readonly retentionPeriod?: number;
  readonly requiresEncryption: boolean;
  readonly accessControls: string[];
}
export interface PIIDetectionResult {
  readonly hasPII: boolean;
  readonly piiTypes: PIIType[];
  readonly confidence: number;
  readonly redactedContent?: string;
  readonly violations: PIIViolation[];
}
export interface PIIViolation {
  readonly type: PIIType;
  readonly location: {
    start: number;
    end: number;
  };
  readonly content: string;
  readonly confidence: number;
}
export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'passport'
  | 'driver_license'
  | 'medical_id'
  | 'bank_account'
  | 'crypto_address'
  | 'api_key'
  | 'password';
export interface DataRetentionPolicy {
  readonly id: string;
  readonly name: string;
  readonly classification: DataClassification['level'];
  readonly retentionDays: number;
  readonly archiveAfterDays?: number;
  readonly secureDeleteRequired: boolean;
  readonly complianceFrameworks: string[];
}
export interface SecureStorageOptions {
  readonly classification: DataClassification;
  readonly encryptionRequired?: boolean;
  readonly keyRotationInterval?: number;
  readonly backupRequired?: boolean;
  readonly auditRequired?: boolean;
}
/**
 * Comprehensive data protection and privacy management system.
 *
 * Features:
 * - Advanced encryption with multiple algorithms (AES-256-GCM, ChaCha20-Poly1305)
 * - Automated key management with rotation and escrow
 * - PII detection and redaction with ML-based classification
 * - Data classification and labeling system
 * - GDPR, CCPA, HIPAA compliance controls
 * - Secure data lifecycle management
 * - Privacy-preserving analytics and processing
 * - Data loss prevention (DLP) controls
 * - Quantum-resistant encryption preparation
 */
export declare class DataProtectionManager extends EventEmitter {
  private keys;
  private masterKey;
  private readonly storageDirectory;
  private retentionPolicies;
  private readonly piiDetector;
  private readonly auditLogger;
  constructor(storageDirectory?: string);
  /**
   * Initialize the data protection system.
   */
  initialize(): Promise<void>;
  /**
   * Encrypt sensitive data with specified classification.
   */
  encryptData(
    data: string | Buffer,
    classification: DataClassification,
    options?: {
      keyId?: string;
      algorithm?: string;
    },
  ): Promise<EncryptedData>;
  /**
   * Decrypt encrypted data.
   */
  decryptData(encryptedData: EncryptedData): Promise<Buffer>;
  /**
   * Detect and classify personally identifiable information (PII).
   */
  detectPII(content: string): Promise<PIIDetectionResult>;
  /**
   * Redact PII from content for safe processing.
   */
  redactPII(
    content: string,
    options?: {
      preserveFormat?: boolean;
      placeholder?: string;
    },
  ): Promise<string>;
  /**
   * Classify data based on content analysis and business rules.
   */
  classifyData(
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<DataClassification>;
  /**
   * Store data securely with automatic classification and encryption.
   */
  storeSecurely(
    identifier: string,
    data: string | Buffer,
    options: SecureStorageOptions,
  ): Promise<string>;
  /**
   * Retrieve securely stored data.
   */
  retrieveSecurely(identifier: string): Promise<{
    data: Buffer;
    classification: DataClassification;
  }>;
  /**
   * Securely delete data with cryptographic erasure.
   */
  secureDelete(identifier: string): Promise<void>;
  /**
   * Rotate encryption keys for enhanced security.
   */
  rotateKey(keyId: string): Promise<EncryptionKey>;
  /**
   * Get data protection compliance report.
   */
  getComplianceReport(): DataProtectionComplianceReport;
  /**
   * Private implementation methods
   */
  private performEncryption;
  private performDecryption;
  private deriveMasterKey;
  private getKeyMaterial;
  private getOrCreateKey;
  private generateEncryptionKey;
  private containsSecrets;
  private getAccessControlsForLevel;
  private cryptographicErasure;
  private scheduleDataExpiration;
  private initializeDefaultPolicies;
  private loadKeys;
  private saveKeys;
  private loadRetentionPolicies;
  private startPeriodicTasks;
  private assessGDPRCompliance;
  private assessCCPACompliance;
  private assessHIPAACompliance;
}
interface DataProtectionComplianceReport {
  timestamp: Date;
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  retentionPolicies: number;
  gdprCompliance: ComplianceAssessment;
  ccpaCompliance: ComplianceAssessment;
  hipaaCompliance: ComplianceAssessment;
}
interface ComplianceAssessment {
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  findings: string[];
  recommendations: string[];
}
export {};
