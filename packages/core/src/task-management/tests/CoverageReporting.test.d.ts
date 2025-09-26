/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export declare class CoverageTestUtilities {
    static validateMinimumCoverageRequirements(): Promise<boolean>;
    static generateFinalCoverageReport(): Promise<string>;
    static validateProductionReadiness(): Promise<{
        ready: boolean;
        blockers: string[];
        recommendations: string[];
    }>;
}
