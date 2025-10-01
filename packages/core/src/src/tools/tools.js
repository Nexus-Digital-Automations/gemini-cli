/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolErrorType } from './tool-error.js';
import { SchemaValidator } from '../utils/schemaValidator.js';
import { randomUUID } from 'node:crypto';
import { MessageBusType, } from '../confirmation-bus/types.js';
import { HooksManager, HookEvent } from '../hooks/index.js';
/**
 * A convenience base class for ToolInvocation.
 */
export class BaseToolInvocation {
    params;
    messageBus;
    hooksManager;
    sessionId;
    workspaceDir;
    constructor(params, messageBus, hooksManager, sessionId, workspaceDir) {
        this.params = params;
        this.messageBus = messageBus;
        this.hooksManager = hooksManager;
        this.sessionId = sessionId;
        this.workspaceDir = workspaceDir;
        if (this.messageBus) {
            console.log(`[DEBUG] Tool ${this.constructor.name} created with messageBus: YES`);
        }
        if (this.hooksManager) {
            console.log(`[DEBUG] Tool ${this.constructor.name} created with hooksManager: YES`);
        }
    }
    toolLocations() {
        return [];
    }
    shouldConfirmExecute(_abortSignal) {
        // If message bus is available, use it for confirmation
        if (this.messageBus) {
            console.log(`[DEBUG] Using message bus for tool confirmation: ${this.constructor.name}`);
            return this.handleMessageBusConfirmation(_abortSignal);
        }
        // Fall back to existing confirmation flow
        return Promise.resolve(false);
    }
    /**
     * Handle tool confirmation using the message bus.
     * This method publishes a confirmation request and waits for the response.
     */
    async handleMessageBusConfirmation(abortSignal) {
        if (!this.messageBus) {
            return false;
        }
        const correlationId = randomUUID();
        const toolCall = {
            name: this.constructor.name,
            args: this.params,
        };
        return new Promise((resolve, reject) => {
            if (!this.messageBus) {
                resolve(false);
                return;
            }
            let timeoutId;
            // Centralized cleanup function
            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = undefined;
                }
                abortSignal.removeEventListener('abort', abortHandler);
                this.messageBus?.unsubscribe(MessageBusType.TOOL_CONFIRMATION_RESPONSE, responseHandler);
            };
            // Set up abort handler
            const abortHandler = () => {
                cleanup();
                reject(new Error('Tool confirmation aborted'));
            };
            // Check if already aborted
            if (abortSignal.aborted) {
                reject(new Error('Tool confirmation aborted'));
                return;
            }
            // Set up response handler
            const responseHandler = (response) => {
                if (response.correlationId === correlationId) {
                    cleanup();
                    if (response.confirmed) {
                        // Tool was confirmed, return false to indicate no further confirmation needed
                        resolve(false);
                    }
                    else {
                        // Tool was denied, reject to prevent execution
                        reject(new Error('Tool execution denied by policy'));
                    }
                }
            };
            // Add event listener for abort signal
            abortSignal.addEventListener('abort', abortHandler);
            // Set up timeout
            timeoutId = setTimeout(() => {
                cleanup();
                resolve(false);
            }, 30000); // 30 second timeout
            // Subscribe to response
            this.messageBus.subscribe(MessageBusType.TOOL_CONFIRMATION_RESPONSE, responseHandler);
            // Publish confirmation request
            const request = {
                type: MessageBusType.TOOL_CONFIRMATION_REQUEST,
                toolCall,
                correlationId,
            };
            try {
                this.messageBus.publish(request);
            }
            catch (_error) {
                cleanup();
                resolve(false);
            }
        });
    }
    /**
     * Executes PreToolUse hooks for this tool invocation.
     * Should be called at the beginning of the execute() method.
     *
     * @returns Object containing blocked status and optional modified input
     */
    async executePreToolUseHooks() {
        if (!this.hooksManager || !this.sessionId || !this.workspaceDir) {
            return { blocked: false };
        }
        const results = await this.hooksManager.executeHooks(HookEvent.PreToolUse, {
            sessionId: this.sessionId,
            workspaceDir: this.workspaceDir,
            toolName: this.constructor.name.replace(/ToolInvocation$/, ''),
            toolInput: this.params,
        });
        const blockInfo = HooksManager.isBlocked(results);
        const modifiedInput = HooksManager.getModifiedInput(results);
        return {
            blocked: blockInfo.blocked,
            message: blockInfo.message,
            modifiedInput,
        };
    }
    /**
     * Executes PostToolUse hooks for this tool invocation.
     * Should be called at the end of the execute() method with the result.
     *
     * @param result The result returned by the tool
     */
    async executePostToolUseHooks(result) {
        if (!this.hooksManager || !this.sessionId || !this.workspaceDir) {
            return;
        }
        await this.hooksManager.executeHooks(HookEvent.PostToolUse, {
            sessionId: this.sessionId,
            workspaceDir: this.workspaceDir,
            toolName: this.constructor.name.replace(/ToolInvocation$/, ''),
            toolInput: this.params,
            toolOutput: result,
        });
    }
}
/**
 * New base class for tools that separates validation from execution.
 * New tools should extend this class.
 */
export class DeclarativeTool {
    name;
    displayName;
    description;
    kind;
    parameterSchema;
    isOutputMarkdown;
    canUpdateOutput;
    messageBus;
    hooksManager;
    sessionId;
    workspaceDir;
    constructor(name, displayName, description, kind, parameterSchema, isOutputMarkdown = true, canUpdateOutput = false, messageBus, hooksManager, sessionId, workspaceDir) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.kind = kind;
        this.parameterSchema = parameterSchema;
        this.isOutputMarkdown = isOutputMarkdown;
        this.canUpdateOutput = canUpdateOutput;
        this.messageBus = messageBus;
        this.hooksManager = hooksManager;
        this.sessionId = sessionId;
        this.workspaceDir = workspaceDir;
    }
    get schema() {
        return {
            name: this.name,
            description: this.description,
            parametersJsonSchema: this.parameterSchema,
        };
    }
    /**
     * Validates the raw tool parameters.
     * Subclasses should override this to add custom validation logic
     * beyond the JSON schema check.
     * @param params The raw parameters from the model.
     * @returns An error message string if invalid, null otherwise.
     */
    validateToolParams(_params) {
        // Base implementation can be extended by subclasses.
        return null;
    }
    /**
     * A convenience method that builds and executes the tool in one step.
     * Throws an error if validation fails.
     * @param params The raw, untrusted parameters from the model.
     * @param signal AbortSignal for tool cancellation.
     * @param updateOutput Optional callback to stream output.
     * @returns The result of the tool execution.
     */
    async buildAndExecute(params, signal, updateOutput, shellExecutionConfig) {
        const invocation = this.build(params);
        return invocation.execute(signal, updateOutput, shellExecutionConfig);
    }
    /**
     * Similar to `build` but never throws.
     * @param params The raw, untrusted parameters from the model.
     * @returns A `ToolInvocation` instance.
     */
    silentBuild(params) {
        try {
            return this.build(params);
        }
        catch (e) {
            if (e instanceof Error) {
                return e;
            }
            return new Error(String(e));
        }
    }
    /**
     * A convenience method that builds and executes the tool in one step.
     * Never throws.
     * @param params The raw, untrusted parameters from the model.
     * @params abortSignal a signal to abort.
     * @returns The result of the tool execution.
     */
    async validateBuildAndExecute(params, abortSignal) {
        const invocationOrError = this.silentBuild(params);
        if (invocationOrError instanceof Error) {
            const errorMessage = invocationOrError.message;
            return {
                llmContent: `Error: Invalid parameters provided. Reason: ${errorMessage}`,
                returnDisplay: errorMessage,
                error: {
                    message: errorMessage,
                    type: ToolErrorType.INVALID_TOOL_PARAMS,
                },
            };
        }
        try {
            return await invocationOrError.execute(abortSignal);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                llmContent: `Error: Tool call execution failed. Reason: ${errorMessage}`,
                returnDisplay: errorMessage,
                error: {
                    message: errorMessage,
                    type: ToolErrorType.EXECUTION_FAILED,
                },
            };
        }
    }
}
/**
 * New base class for declarative tools that separates validation from execution.
 * New tools should extend this class, which provides a `build` method that
 * validates parameters before deferring to a `createInvocation` method for
 * the final `ToolInvocation` object instantiation.
 */
export class BaseDeclarativeTool extends DeclarativeTool {
    build(params) {
        const validationError = this.validateToolParams(params);
        if (validationError) {
            throw new Error(validationError);
        }
        return this.createInvocation(params, this.messageBus, this.hooksManager, this.sessionId, this.workspaceDir);
    }
    validateToolParams(params) {
        const errors = SchemaValidator.validate(this.schema.parametersJsonSchema, params);
        if (errors) {
            return errors;
        }
        return this.validateToolParamValues(params);
    }
    validateToolParamValues(_params) {
        // Base implementation can be extended by subclasses.
        return null;
    }
}
/**
 * Type guard to check if an object is a Tool.
 * @param obj The object to check.
 * @returns True if the object is a Tool, false otherwise.
 */
export function isTool(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'name' in obj &&
        'build' in obj &&
        typeof obj.build === 'function');
}
/**
 * Detects cycles in a JSON schemas due to `$ref`s.
 * @param schema The root of the JSON schema.
 * @returns `true` if a cycle is detected, `false` otherwise.
 */
export function hasCycleInSchema(schema) {
    function resolveRef(ref) {
        if (!ref.startsWith('#/')) {
            return null;
        }
        const path = ref.substring(2).split('/');
        let current = schema;
        for (const segment of path) {
            if (typeof current !== 'object' ||
                current === null ||
                !Object.prototype.hasOwnProperty.call(current, segment)) {
                return null;
            }
            current = current[segment];
        }
        return current;
    }
    function traverse(node, visitedRefs, pathRefs) {
        if (typeof node !== 'object' || node === null) {
            return false;
        }
        if (Array.isArray(node)) {
            for (const item of node) {
                if (traverse(item, visitedRefs, pathRefs)) {
                    return true;
                }
            }
            return false;
        }
        if ('$ref' in node && typeof node.$ref === 'string') {
            const ref = node.$ref;
            if (ref === '#/' || pathRefs.has(ref)) {
                // A ref to just '#/' is always a cycle.
                return true; // Cycle detected!
            }
            if (visitedRefs.has(ref)) {
                return false; // Bail early, we have checked this ref before.
            }
            const resolvedNode = resolveRef(ref);
            if (resolvedNode) {
                // Add it to both visited and the current path
                visitedRefs.add(ref);
                pathRefs.add(ref);
                const hasCycle = traverse(resolvedNode, visitedRefs, pathRefs);
                pathRefs.delete(ref); // Backtrack, leaving it in visited
                return hasCycle;
            }
        }
        // Crawl all the properties of node
        for (const key in node) {
            if (Object.prototype.hasOwnProperty.call(node, key)) {
                if (traverse(node[key], visitedRefs, pathRefs)) {
                    return true;
                }
            }
        }
        return false;
    }
    return traverse(schema, new Set(), new Set());
}
export var ToolConfirmationOutcome;
(function (ToolConfirmationOutcome) {
    ToolConfirmationOutcome["ProceedOnce"] = "proceed_once";
    ToolConfirmationOutcome["ProceedAlways"] = "proceed_always";
    ToolConfirmationOutcome["ProceedAlwaysServer"] = "proceed_always_server";
    ToolConfirmationOutcome["ProceedAlwaysTool"] = "proceed_always_tool";
    ToolConfirmationOutcome["ModifyWithEditor"] = "modify_with_editor";
    ToolConfirmationOutcome["Cancel"] = "cancel";
})(ToolConfirmationOutcome || (ToolConfirmationOutcome = {}));
export var Kind;
(function (Kind) {
    Kind["Read"] = "read";
    Kind["Edit"] = "edit";
    Kind["Delete"] = "delete";
    Kind["Move"] = "move";
    Kind["Search"] = "search";
    Kind["Execute"] = "execute";
    Kind["Think"] = "think";
    Kind["Fetch"] = "fetch";
    Kind["Other"] = "other";
})(Kind || (Kind = {}));
// Function kinds that have side effects
export const MUTATOR_KINDS = [
    Kind.Edit,
    Kind.Delete,
    Kind.Move,
    Kind.Execute,
];
//# sourceMappingURL=tools.js.map