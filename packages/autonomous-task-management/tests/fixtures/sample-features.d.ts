/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sample feature data for testing autonomous task management components
 */
export declare const sampleFeatures: {
    suggested: {
        id: string;
        title: string;
        description: string;
        business_value: string;
        category: string;
        status: string;
        created_at: string;
        updated_at: string;
        suggested_by: string;
        metadata: {
            estimated_effort: string;
            target_version: string;
        };
    };
    approved: {
        id: string;
        title: string;
        description: string;
        business_value: string;
        category: string;
        status: string;
        created_at: string;
        updated_at: string;
        suggested_by: string;
        approved_by: string;
        approval_date: string;
        approval_notes: string;
        metadata: {
            estimated_effort: string;
            target_version: string;
            security_review_required: boolean;
        };
    };
    rejected: {
        id: string;
        title: string;
        description: string;
        business_value: string;
        category: string;
        status: string;
        created_at: string;
        updated_at: string;
        suggested_by: string;
        rejected_by: string;
        rejection_date: string;
        rejection_reason: string;
        metadata: {
            estimated_effort: string;
            compliance_review: string;
        };
    };
    implemented: {
        id: string;
        title: string;
        description: string;
        business_value: string;
        category: string;
        status: string;
        created_at: string;
        updated_at: string;
        suggested_by: string;
        approved_by: string;
        approval_date: string;
        approval_notes: string;
        implemented_date: string;
        implementation_notes: string;
        metadata: {
            estimated_effort: string;
            target_version: string;
            implementation_time_days: number;
        };
    };
    complexFeature: {
        id: string;
        title: string;
        description: string;
        business_value: string;
        category: string;
        status: string;
        created_at: string;
        updated_at: string;
        suggested_by: string;
        approved_by: string;
        approval_date: string;
        approval_notes: string;
        metadata: {
            estimated_effort: string;
            complexity: string;
            requires_ml_expertise: boolean;
            target_version: string;
            epic: boolean;
        };
    };
};
export declare const sampleTasks: {
    queued: {
        id: string;
        feature_id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
        status: string;
        dependencies: never[];
        estimated_effort: string;
        required_capabilities: string[];
        created_at: string;
        updated_at: string;
        created_by: string;
        metadata: {
            auto_generated: boolean;
            feature_category: string;
            business_value: string;
        };
    };
    assigned: {
        id: string;
        feature_id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
        status: string;
        assigned_to: string;
        assigned_at: string;
        dependencies: never[];
        estimated_effort: string;
        required_capabilities: string[];
        created_at: string;
        updated_at: string;
        created_by: string;
        assignment_metadata: {
            forced: boolean;
            assignment_reason: string;
        };
        metadata: {
            auto_generated: boolean;
            feature_category: string;
        };
    };
    inProgress: {
        id: string;
        feature_id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
        status: string;
        assigned_to: string;
        assigned_at: string;
        dependencies: string[];
        estimated_effort: string;
        required_capabilities: string[];
        created_at: string;
        updated_at: string;
        created_by: string;
        progress_history: {
            timestamp: string;
            status: string;
            progress_percentage: number;
            notes: string;
            updated_by: string;
        }[];
        metadata: {
            auto_generated: boolean;
            feature_category: string;
        };
    };
    completed: {
        id: string;
        feature_id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
        status: string;
        assigned_to: string;
        assigned_at: string;
        completed_at: string;
        dependencies: never[];
        estimated_effort: string;
        required_capabilities: string[];
        created_at: string;
        updated_at: string;
        created_by: string;
        progress_percentage: number;
        progress_history: {
            timestamp: string;
            status: string;
            progress_percentage: number;
            notes: string;
            updated_by: string;
        }[];
        metadata: {
            auto_generated: boolean;
            feature_category: string;
            implementation_time_hours: number;
        };
    };
};
export declare const sampleAgents: {
    frontend: {
        id: string;
        lastHeartbeat: string;
        status: string;
        initialized: string;
        sessionId: string;
        capabilities: string[];
        capabilities_registered_at: string;
        assigned_tasks: string[];
    };
    backend: {
        id: string;
        lastHeartbeat: string;
        status: string;
        initialized: string;
        sessionId: string;
        capabilities: string[];
        capabilities_registered_at: string;
        assigned_tasks: never[];
    };
    testing: {
        id: string;
        lastHeartbeat: string;
        status: string;
        initialized: string;
        sessionId: string;
        capabilities: string[];
        capabilities_registered_at: string;
        assigned_tasks: string[];
    };
    general: {
        id: string;
        lastHeartbeat: string;
        status: string;
        initialized: string;
        sessionId: string;
        capabilities: string[];
        capabilities_registered_at: string;
        assigned_tasks: never[];
    };
};
export declare const sampleProjectStructure: {
    project: string;
    features: ({
        id: string;
        title: string;
        description: string;
        business_value: string;
        category: string;
        status: string;
        created_at: string;
        updated_at: string;
        suggested_by: string;
        metadata: {
            estimated_effort: string;
            target_version: string;
        };
    } | {
        id: string;
        title: string;
        description: string;
        business_value: string;
        category: string;
        status: string;
        created_at: string;
        updated_at: string;
        suggested_by: string;
        rejected_by: string;
        rejection_date: string;
        rejection_reason: string;
        metadata: {
            estimated_effort: string;
            compliance_review: string;
        };
    })[];
    metadata: {
        version: string;
        created: string;
        updated: string;
        total_features: number;
        approval_history: ({
            feature_id: string;
            action: string;
            timestamp: string;
            approved_by: string;
            notes: string;
            rejected_by?: undefined;
            reason?: undefined;
        } | {
            feature_id: string;
            action: string;
            timestamp: string;
            rejected_by: string;
            reason: string;
            approved_by?: undefined;
            notes?: undefined;
        })[];
        initialization_stats: {
            total_initializations: number;
            total_reinitializations: number;
            current_day: string;
            time_buckets: {
                '08:00-12:59': {
                    init: number;
                    reinit: number;
                };
                '13:00-17:59': {
                    init: number;
                    reinit: number;
                };
                '18:00-22:59': {
                    init: number;
                    reinit: number;
                };
                '23:00-03:59': {
                    init: number;
                    reinit: number;
                };
                '04:00-07:59': {
                    init: number;
                    reinit: number;
                };
            };
            daily_history: never[];
            last_reset: string;
            last_updated: string;
        };
    };
    workflow_config: {
        require_approval: boolean;
        auto_reject_timeout_hours: number;
        allowed_statuses: string[];
        required_fields: string[];
    };
    agents: {
        frontend: {
            id: string;
            lastHeartbeat: string;
            status: string;
            initialized: string;
            sessionId: string;
            capabilities: string[];
            capabilities_registered_at: string;
            assigned_tasks: string[];
        };
        backend: {
            id: string;
            lastHeartbeat: string;
            status: string;
            initialized: string;
            sessionId: string;
            capabilities: string[];
            capabilities_registered_at: string;
            assigned_tasks: never[];
        };
        testing: {
            id: string;
            lastHeartbeat: string;
            status: string;
            initialized: string;
            sessionId: string;
            capabilities: string[];
            capabilities_registered_at: string;
            assigned_tasks: string[];
        };
        general: {
            id: string;
            lastHeartbeat: string;
            status: string;
            initialized: string;
            sessionId: string;
            capabilities: string[];
            capabilities_registered_at: string;
            assigned_tasks: never[];
        };
    };
    tasks: ({
        id: string;
        feature_id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
        status: string;
        dependencies: never[];
        estimated_effort: string;
        required_capabilities: string[];
        created_at: string;
        updated_at: string;
        created_by: string;
        metadata: {
            auto_generated: boolean;
            feature_category: string;
            business_value: string;
        };
    } | {
        id: string;
        feature_id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
        status: string;
        assigned_to: string;
        assigned_at: string;
        dependencies: never[];
        estimated_effort: string;
        required_capabilities: string[];
        created_at: string;
        updated_at: string;
        created_by: string;
        assignment_metadata: {
            forced: boolean;
            assignment_reason: string;
        };
        metadata: {
            auto_generated: boolean;
            feature_category: string;
        };
    } | {
        id: string;
        feature_id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
        status: string;
        assigned_to: string;
        assigned_at: string;
        dependencies: string[];
        estimated_effort: string;
        required_capabilities: string[];
        created_at: string;
        updated_at: string;
        created_by: string;
        progress_history: {
            timestamp: string;
            status: string;
            progress_percentage: number;
            notes: string;
            updated_by: string;
        }[];
        metadata: {
            auto_generated: boolean;
            feature_category: string;
        };
    })[];
    completed_tasks: {
        task_id: string;
        completed_at: string;
        assigned_to: string;
        feature_id: string;
    }[];
};
