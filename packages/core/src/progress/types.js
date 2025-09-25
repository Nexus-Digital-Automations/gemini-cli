/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Types of operations that can be tracked for progress
 */
export var OperationType;
(function (OperationType) {
    OperationType["FileOperation"] = "file_operation";
    OperationType["NetworkOperation"] = "network_operation";
    OperationType["CodeAnalysis"] = "code_analysis";
    OperationType["BuildOperation"] = "build_operation";
    OperationType["TestOperation"] = "test_operation";
    OperationType["GitOperation"] = "git_operation";
    OperationType["PackageOperation"] = "package_operation";
    OperationType["SearchOperation"] = "search_operation";
    OperationType["GeneralOperation"] = "general_operation";
})(OperationType || (OperationType = {}));
/**
 * States that an operation can be in
 */
export var ProgressState;
(function (ProgressState) {
    ProgressState["Initializing"] = "initializing";
    ProgressState["InProgress"] = "in_progress";
    ProgressState["Paused"] = "paused";
    ProgressState["Completing"] = "completing";
    ProgressState["Completed"] = "completed";
    ProgressState["Failed"] = "failed";
    ProgressState["Cancelled"] = "cancelled";
})(ProgressState || (ProgressState = {}));
//# sourceMappingURL=types.js.map