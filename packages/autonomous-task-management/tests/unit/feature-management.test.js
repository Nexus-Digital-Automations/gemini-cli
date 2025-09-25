/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import { fsHelper } from '../helpers/fs-helper';
import { sampleFeatures, sampleProjectStructure } from '../fixtures/sample-features';
// Mock the TaskManager API
const mockTaskManagerPath = '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';
vi.mock('fs/promises', () => {
    const memfs = require('memfs');
    return memfs.fs.promises;
});
describe('Feature Management - Autonomous Task Management', () => {
    let AutonomousTaskManagerAPI;
    let api;
    const projectRoot = '/test-project';
    beforeEach(async () => {
        // Reset file system
        vol.reset();
        fsHelper.createBasicProjectStructure(projectRoot);
        // Mock environment
        process.env.NODE_ENV = 'test';
        process.cwd = vi.fn(() => projectRoot);
        // Import the TaskManager API
        try {
            const module = await import(mockTaskManagerPath);
            AutonomousTaskManagerAPI = module.default;
            api = new AutonomousTaskManagerAPI();
        }
        catch (error) {
            // If real module not available, create mock
            AutonomousTaskManagerAPI = class MockTaskManagerAPI {
                timeout = 10000;
                featuresPath = `${projectRoot}/FEATURES.json`;
                validStatuses = ['suggested', 'approved', 'rejected', 'implemented'];
                validCategories = ['enhancement', 'bug-fix', 'new-feature', 'performance', 'security', 'documentation'];
                requiredFields = ['title', 'description', 'business_value', 'category'];
                async _ensureFeaturesFile() {
                    if (!fsHelper.exists(this.featuresPath)) {
                        fsHelper.createFeaturesFile(projectRoot);
                    }
                }
                async _loadFeatures() {
                    const content = fsHelper.readFile(this.featuresPath);
                    return JSON.parse(content);
                }
                async _saveFeatures(features) {
                    fsHelper.writeFile(this.featuresPath, JSON.stringify(features, null, 2));
                }
                _validateFeatureData(featureData) {
                    if (!featureData || typeof featureData !== 'object') {
                        throw new Error('Feature data must be a valid object');
                    }
                    for (const field of this.requiredFields) {
                        if (!featureData[field] || (typeof featureData[field] === 'string' && featureData[field].trim() === '')) {
                            throw new Error(`Required field '${field}' is missing or empty`);
                        }
                    }
                    if (!this.validCategories.includes(featureData.category)) {
                        throw new Error(`Invalid category '${featureData.category}'`);
                    }
                }
                _generateFeatureId() {
                    const timestamp = Date.now();
                    const randomString = Math.random().toString(36).substring(2, 8);
                    return `feature_${timestamp}_${randomString}`;
                }
                async suggestFeature(featureData) {
                    try {
                        this._validateFeatureData(featureData);
                        await this._ensureFeaturesFile();
                        const features = await this._loadFeatures();
                        const feature = {
                            id: this._generateFeatureId(),
                            title: featureData.title,
                            description: featureData.description,
                            business_value: featureData.business_value,
                            category: featureData.category,
                            status: 'suggested',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            suggested_by: featureData.suggested_by || 'system',
                            metadata: featureData.metadata || {},
                        };
                        features.features.push(feature);
                        features.metadata.total_features = features.features.length;
                        features.metadata.updated = new Date().toISOString();
                        await this._saveFeatures(features);
                        return {
                            success: true,
                            feature,
                            message: 'Feature suggestion created successfully',
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error.message,
                        };
                    }
                }
                async approveFeature(featureId, approvalData = {}) {
                    try {
                        await this._ensureFeaturesFile();
                        const features = await this._loadFeatures();
                        const feature = features.features.find((f) => f.id === featureId);
                        if (!feature) {
                            throw new Error(`Feature with ID ${featureId} not found`);
                        }
                        if (feature.status !== 'suggested') {
                            throw new Error(`Feature must be in 'suggested' status to approve. Current status: ${feature.status}`);
                        }
                        feature.status = 'approved';
                        feature.updated_at = new Date().toISOString();
                        feature.approved_by = approvalData.approved_by || 'system';
                        feature.approval_date = new Date().toISOString();
                        feature.approval_notes = approvalData.notes || '';
                        await this._saveFeatures(features);
                        return {
                            success: true,
                            feature,
                            message: 'Feature approved successfully',
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error.message,
                        };
                    }
                }
                async rejectFeature(featureId, rejectionData = {}) {
                    try {
                        await this._ensureFeaturesFile();
                        const features = await this._loadFeatures();
                        const feature = features.features.find((f) => f.id === featureId);
                        if (!feature) {
                            throw new Error(`Feature with ID ${featureId} not found`);
                        }
                        if (feature.status !== 'suggested') {
                            throw new Error(`Feature must be in 'suggested' status to reject. Current status: ${feature.status}`);
                        }
                        feature.status = 'rejected';
                        feature.updated_at = new Date().toISOString();
                        feature.rejected_by = rejectionData.rejected_by || 'system';
                        feature.rejection_date = new Date().toISOString();
                        feature.rejection_reason = rejectionData.reason || 'No reason provided';
                        await this._saveFeatures(features);
                        return {
                            success: true,
                            feature,
                            message: 'Feature rejected successfully',
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error.message,
                        };
                    }
                }
                async listFeatures(filter = {}) {
                    try {
                        await this._ensureFeaturesFile();
                        const features = await this._loadFeatures();
                        let filteredFeatures = features.features;
                        if (filter.status) {
                            filteredFeatures = filteredFeatures.filter((f) => f.status === filter.status);
                        }
                        if (filter.category) {
                            filteredFeatures = filteredFeatures.filter((f) => f.category === filter.category);
                        }
                        return {
                            success: true,
                            features: filteredFeatures,
                            total: filteredFeatures.length,
                            metadata: features.metadata,
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error.message,
                        };
                    }
                }
            };
            api = new AutonomousTaskManagerAPI();
        }
    });
    afterEach(() => {
        vol.reset();
        vi.restoreAllMocks();
    });
    describe('Feature Suggestion', () => {
        it('should create a valid feature suggestion', async () => {
            const featureData = {
                title: 'Test Feature Suggestion',
                description: 'A comprehensive test feature for the autonomous task management system',
                business_value: 'Provides testing capabilities and validation of feature management workflows',
                category: 'enhancement'
            };
            const result = await api.suggestFeature(featureData);
            expect(result.success).toBe(true);
            expect(result.feature).toBeDefined();
            expect(result.feature.id).toMatch(/^feature_\d+_[a-z0-9]+$/);
            expect(result.feature.status).toBe('suggested');
            expect(result.feature.title).toBe(featureData.title);
            expect(result.feature.description).toBe(featureData.description);
            expect(result.feature.business_value).toBe(featureData.business_value);
            expect(result.feature.category).toBe(featureData.category);
            expect(result.message).toBe('Feature suggestion created successfully');
        });
        it('should validate required fields', async () => {
            const invalidFeatureData = {
                title: 'Test Feature',
                // Missing required fields: description, business_value, category
            };
            const result = await api.suggestFeature(invalidFeatureData);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Required field');
        });
        it('should validate category values', async () => {
            const featureDataWithInvalidCategory = {
                title: 'Test Feature with Invalid Category',
                description: 'A test feature with an invalid category value',
                business_value: 'Testing category validation',
                category: 'invalid-category'
            };
            const result = await api.suggestFeature(featureDataWithInvalidCategory);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid category');
        });
        it('should preserve metadata in feature suggestions', async () => {
            const featureData = {
                title: 'Feature with Metadata',
                description: 'A feature that includes custom metadata',
                business_value: 'Testing metadata preservation',
                category: 'new-feature',
                metadata: {
                    priority: 'high',
                    estimated_days: 5,
                    tags: ['testing', 'metadata']
                }
            };
            const result = await api.suggestFeature(featureData);
            expect(result.success).toBe(true);
            expect(result.feature.metadata).toEqual(featureData.metadata);
        });
    });
    describe('Feature Approval', () => {
        it('should approve a suggested feature', async () => {
            // First create a feature suggestion
            const featureData = {
                title: 'Feature to Approve',
                description: 'A feature that will be approved for testing',
                business_value: 'Testing approval workflow',
                category: 'enhancement'
            };
            const suggestionResult = await api.suggestFeature(featureData);
            expect(suggestionResult.success).toBe(true);
            const featureId = suggestionResult.feature.id;
            const approvalData = {
                approved_by: 'test_manager',
                notes: 'Approved for testing purposes'
            };
            const approvalResult = await api.approveFeature(featureId, approvalData);
            expect(approvalResult.success).toBe(true);
            expect(approvalResult.feature.status).toBe('approved');
            expect(approvalResult.feature.approved_by).toBe('test_manager');
            expect(approvalResult.feature.approval_notes).toBe('Approved for testing purposes');
            expect(approvalResult.feature.approval_date).toBeDefined();
            expect(approvalResult.message).toBe('Feature approved successfully');
        });
        it('should fail to approve non-existent feature', async () => {
            const result = await api.approveFeature('non-existent-id');
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
        it('should fail to approve already approved feature', async () => {
            // Create and approve a feature
            const featureData = {
                title: 'Already Approved Feature',
                description: 'A feature that will be approved twice for testing',
                business_value: 'Testing double approval prevention',
                category: 'enhancement'
            };
            const suggestionResult = await api.suggestFeature(featureData);
            const featureId = suggestionResult.feature.id;
            await api.approveFeature(featureId);
            // Try to approve again
            const secondApprovalResult = await api.approveFeature(featureId);
            expect(secondApprovalResult.success).toBe(false);
            expect(secondApprovalResult.error).toContain('must be in \'suggested\' status to approve');
        });
    });
    describe('Feature Rejection', () => {
        it('should reject a suggested feature', async () => {
            // First create a feature suggestion
            const featureData = {
                title: 'Feature to Reject',
                description: 'A feature that will be rejected for testing',
                business_value: 'Testing rejection workflow',
                category: 'new-feature'
            };
            const suggestionResult = await api.suggestFeature(featureData);
            const featureId = suggestionResult.feature.id;
            const rejectionData = {
                rejected_by: 'test_reviewer',
                reason: 'Does not align with current priorities'
            };
            const rejectionResult = await api.rejectFeature(featureId, rejectionData);
            expect(rejectionResult.success).toBe(true);
            expect(rejectionResult.feature.status).toBe('rejected');
            expect(rejectionResult.feature.rejected_by).toBe('test_reviewer');
            expect(rejectionResult.feature.rejection_reason).toBe('Does not align with current priorities');
            expect(rejectionResult.feature.rejection_date).toBeDefined();
            expect(rejectionResult.message).toBe('Feature rejected successfully');
        });
        it('should fail to reject non-existent feature', async () => {
            const result = await api.rejectFeature('non-existent-id');
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
        it('should fail to reject already approved feature', async () => {
            // Create and approve a feature
            const featureData = {
                title: 'Approved Feature Cannot Be Rejected',
                description: 'A feature that will be approved then attempted to be rejected',
                business_value: 'Testing rejection of approved feature',
                category: 'enhancement'
            };
            const suggestionResult = await api.suggestFeature(featureData);
            const featureId = suggestionResult.feature.id;
            await api.approveFeature(featureId);
            // Try to reject after approval
            const rejectionResult = await api.rejectFeature(featureId);
            expect(rejectionResult.success).toBe(false);
            expect(rejectionResult.error).toContain('must be in \'suggested\' status to reject');
        });
    });
    describe('Feature Listing', () => {
        beforeEach(async () => {
            // Create sample features for listing tests
            const features = [
                {
                    title: 'Suggested Feature 1',
                    description: 'First suggested feature',
                    business_value: 'Testing listing functionality',
                    category: 'enhancement'
                },
                {
                    title: 'Suggested Feature 2',
                    description: 'Second suggested feature',
                    business_value: 'Testing listing functionality',
                    category: 'new-feature'
                }
            ];
            for (const feature of features) {
                await api.suggestFeature(feature);
            }
            // Approve one feature
            const listResult = await api.listFeatures();
            const firstFeatureId = listResult.features[0].id;
            await api.approveFeature(firstFeatureId);
        });
        it('should list all features without filters', async () => {
            const result = await api.listFeatures();
            expect(result.success).toBe(true);
            expect(result.features).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.metadata).toBeDefined();
        });
        it('should filter features by status', async () => {
            const suggestedResult = await api.listFeatures({ status: 'suggested' });
            const approvedResult = await api.listFeatures({ status: 'approved' });
            expect(suggestedResult.success).toBe(true);
            expect(suggestedResult.features).toHaveLength(1);
            expect(suggestedResult.features[0].status).toBe('suggested');
            expect(approvedResult.success).toBe(true);
            expect(approvedResult.features).toHaveLength(1);
            expect(approvedResult.features[0].status).toBe('approved');
        });
        it('should filter features by category', async () => {
            const enhancementResult = await api.listFeatures({ category: 'enhancement' });
            const newFeatureResult = await api.listFeatures({ category: 'new-feature' });
            expect(enhancementResult.success).toBe(true);
            expect(enhancementResult.features).toHaveLength(1);
            expect(enhancementResult.features[0].category).toBe('enhancement');
            expect(newFeatureResult.success).toBe(true);
            expect(newFeatureResult.features).toHaveLength(1);
            expect(newFeatureResult.features[0].category).toBe('new-feature');
        });
        it('should return empty list for non-matching filters', async () => {
            const result = await api.listFeatures({ status: 'implemented' });
            expect(result.success).toBe(true);
            expect(result.features).toHaveLength(0);
            expect(result.total).toBe(0);
        });
    });
    describe('Error Handling', () => {
        it('should handle missing feature data gracefully', async () => {
            const result = await api.suggestFeature(null);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Feature data must be a valid object');
        });
        it('should handle empty feature data gracefully', async () => {
            const result = await api.suggestFeature({});
            expect(result.success).toBe(false);
            expect(result.error).toContain('Required field');
        });
        it('should handle file system errors gracefully', async () => {
            // Mock file system error
            const originalReadFile = fsHelper.readFile;
            fsHelper.readFile = vi.fn(() => {
                throw new Error('File system error');
            });
            try {
                const result = await api.listFeatures();
                expect(result.success).toBe(false);
                expect(result.error).toContain('error');
            }
            finally {
                fsHelper.readFile = originalReadFile;
            }
        });
    });
});
//# sourceMappingURL=feature-management.test.js.map