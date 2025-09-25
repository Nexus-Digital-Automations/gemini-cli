/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Feature status enumeration
 */
export var FeatureStatus;
(function (FeatureStatus) {
    FeatureStatus["SUGGESTED"] = "suggested";
    FeatureStatus["APPROVED"] = "approved";
    FeatureStatus["REJECTED"] = "rejected";
    FeatureStatus["IMPLEMENTED"] = "implemented";
    FeatureStatus["ARCHIVED"] = "archived";
})(FeatureStatus || (FeatureStatus = {}));
/**
 * Feature category enumeration
 */
export var FeatureCategory;
(function (FeatureCategory) {
    FeatureCategory["ENHANCEMENT"] = "enhancement";
    FeatureCategory["BUG_FIX"] = "bug-fix";
    FeatureCategory["NEW_FEATURE"] = "new-feature";
    FeatureCategory["PERFORMANCE"] = "performance";
    FeatureCategory["SECURITY"] = "security";
    FeatureCategory["DOCUMENTATION"] = "documentation";
    FeatureCategory["REFACTORING"] = "refactoring";
    FeatureCategory["TESTING"] = "testing";
})(FeatureCategory || (FeatureCategory = {}));
/**
 * Feature sort fields
 */
export var FeatureSortField;
(function (FeatureSortField) {
    FeatureSortField["CREATED_AT"] = "created_at";
    FeatureSortField["UPDATED_AT"] = "updated_at";
    FeatureSortField["TITLE"] = "title";
    FeatureSortField["STATUS"] = "status";
    FeatureSortField["CATEGORY"] = "category";
    FeatureSortField["PRIORITY"] = "priority";
})(FeatureSortField || (FeatureSortField = {}));
//# sourceMappingURL=Feature.js.map