/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentId } from './Agent';
import type { TaskId } from './Task';
/**
 * Unique identifier for features
 */
export type FeatureId = string;
/**
 * Feature status enumeration
 */
export declare enum FeatureStatus {
    SUGGESTED = "suggested",
    APPROVED = "approved",
    REJECTED = "rejected",
    IMPLEMENTED = "implemented",
    ARCHIVED = "archived"
}
/**
 * Feature category enumeration
 */
export declare enum FeatureCategory {
    ENHANCEMENT = "enhancement",
    BUG_FIX = "bug-fix",
    NEW_FEATURE = "new-feature",
    PERFORMANCE = "performance",
    SECURITY = "security",
    DOCUMENTATION = "documentation",
    REFACTORING = "refactoring",
    TESTING = "testing"
}
/**
 * Core feature interface
 */
export interface Feature {
    /** Unique feature identifier */
    id: FeatureId;
    /** Feature title */
    title: string;
    /** Detailed feature description */
    description: string;
    /** Business value justification */
    business_value: string;
    /** Feature category */
    category: FeatureCategory;
    /** Current feature status */
    status: FeatureStatus;
    /** Feature creation timestamp */
    created_at: Date;
    /** Feature last update timestamp */
    updated_at: Date;
    /** Feature suggester */
    suggested_by: string;
    /** Feature metadata */
    metadata: FeatureMetadata;
    /** Feature approval information */
    approval?: FeatureApproval;
    /** Feature rejection information */
    rejection?: FeatureRejection;
    /** Feature implementation information */
    implementation?: FeatureImplementation;
}
/**
 * Feature metadata interface
 */
export interface FeatureMetadata {
    /** Custom properties */
    properties?: Record<string, any>;
    /** Feature tags */
    tags?: string[];
    /** Priority level */
    priority?: 'low' | 'medium' | 'high' | 'critical';
    /** Estimated effort in story points */
    estimatedEffort?: number;
    /** Complexity assessment */
    complexity?: 'simple' | 'moderate' | 'complex' | 'critical';
    /** Dependencies on other features */
    dependencies?: FeatureId[];
    /** Related issue numbers */
    relatedIssues?: string[];
    /** Affected components */
    affectedComponents?: string[];
}
/**
 * Feature approval information
 */
export interface FeatureApproval {
    /** Who approved the feature */
    approved_by: string;
    /** Approval timestamp */
    approval_date: Date;
    /** Approval notes */
    approval_notes?: string;
    /** Approval data */
    approval_data?: Record<string, any>;
}
/**
 * Feature rejection information
 */
export interface FeatureRejection {
    /** Who rejected the feature */
    rejected_by: string;
    /** Rejection timestamp */
    rejection_date: Date;
    /** Rejection reason */
    rejection_reason: string;
    /** Rejection notes */
    rejection_notes?: string;
    /** Rejection data */
    rejection_data?: Record<string, any>;
}
/**
 * Feature implementation information
 */
export interface FeatureImplementation {
    /** Implementation timestamp */
    implemented_date: Date;
    /** Implementation notes */
    implementation_notes?: string;
    /** Implementing agent */
    implemented_by?: AgentId;
    /** Related tasks */
    related_tasks?: TaskId[];
    /** Implementation artifacts */
    artifacts?: ImplementationArtifact[];
    /** Validation results */
    validation_results?: ValidationResult[];
}
/**
 * Implementation artifact
 */
export interface ImplementationArtifact {
    /** Artifact name */
    name: string;
    /** Artifact type */
    type: string;
    /** File path */
    path: string;
    /** Creation timestamp */
    created_at: Date;
    /** Artifact metadata */
    metadata?: Record<string, any>;
}
/**
 * Validation result for feature implementation
 */
export interface ValidationResult {
    /** Validation type */
    type: string;
    /** Validation passed */
    passed: boolean;
    /** Validation message */
    message: string;
    /** Validation timestamp */
    timestamp: Date;
    /** Validation details */
    details?: Record<string, any>;
}
/**
 * Feature suggestion request
 */
export interface SuggestFeatureRequest {
    /** Feature title */
    title: string;
    /** Feature description */
    description: string;
    /** Business value justification */
    business_value: string;
    /** Feature category */
    category: FeatureCategory;
    /** Feature metadata */
    metadata?: Partial<FeatureMetadata>;
}
/**
 * Feature approval request
 */
export interface ApproveFeatureRequest {
    /** Feature ID to approve */
    featureId: FeatureId;
    /** Approver identifier */
    approved_by: string;
    /** Approval notes */
    notes?: string;
    /** Additional approval data */
    data?: Record<string, any>;
}
/**
 * Feature rejection request
 */
export interface RejectFeatureRequest {
    /** Feature ID to reject */
    featureId: FeatureId;
    /** Rejector identifier */
    rejected_by: string;
    /** Rejection reason */
    reason: string;
    /** Rejection notes */
    notes?: string;
    /** Additional rejection data */
    data?: Record<string, any>;
}
/**
 * Feature implementation request
 */
export interface ImplementFeatureRequest {
    /** Feature ID to implement */
    featureId: FeatureId;
    /** Implementing agent */
    implemented_by: AgentId;
    /** Implementation notes */
    notes?: string;
    /** Related tasks */
    related_tasks?: TaskId[];
}
/**
 * Feature query interface
 */
export interface FeatureQuery {
    /** Filter by IDs */
    ids?: FeatureId[];
    /** Filter by status */
    status?: FeatureStatus[];
    /** Filter by category */
    category?: FeatureCategory[];
    /** Filter by suggester */
    suggested_by?: string;
    /** Filter by date range */
    dateRange?: {
        from: Date;
        to: Date;
    };
    /** Text search */
    search?: string;
    /** Sort order */
    sortBy?: FeatureSortField;
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Result limit */
    limit?: number;
    /** Result offset */
    offset?: number;
}
/**
 * Feature sort fields
 */
export declare enum FeatureSortField {
    CREATED_AT = "created_at",
    UPDATED_AT = "updated_at",
    TITLE = "title",
    STATUS = "status",
    CATEGORY = "category",
    PRIORITY = "priority"
}
/**
 * Feature statistics
 */
export interface FeatureStatistics {
    /** Total features count */
    total: number;
    /** Count by status */
    byStatus: Record<FeatureStatus, number>;
    /** Count by category */
    byCategory: Record<FeatureCategory, number>;
    /** Recent activity */
    recentActivity: {
        suggested: number;
        approved: number;
        rejected: number;
        implemented: number;
    };
    /** Average approval time in milliseconds */
    averageApprovalTime: number;
    /** Average implementation time in milliseconds */
    averageImplementationTime: number;
    /** Success rate percentage */
    successRate: number;
}
/**
 * Feature workflow configuration
 */
export interface FeatureWorkflowConfig {
    /** Whether approval is required */
    require_approval: boolean;
    /** Auto-reject timeout in hours */
    auto_reject_timeout_hours: number;
    /** Allowed status transitions */
    allowed_statuses: FeatureStatus[];
    /** Required fields for feature creation */
    required_fields: string[];
    /** Approval roles */
    approval_roles?: string[];
    /** Notification settings */
    notifications?: NotificationSettings;
}
/**
 * Notification settings for features
 */
export interface NotificationSettings {
    /** Notify on feature suggestion */
    on_suggest: boolean;
    /** Notify on feature approval */
    on_approve: boolean;
    /** Notify on feature rejection */
    on_reject: boolean;
    /** Notify on feature implementation */
    on_implement: boolean;
    /** Notification channels */
    channels: string[];
}
