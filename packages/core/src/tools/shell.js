/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import os, { EOL } from 'node:os';
import crypto from 'node:crypto';
import { ToolErrorType } from './tool-error.js';
import { BaseDeclarativeTool, BaseToolInvocation, ToolConfirmationOutcome, Kind, } from './tools.js';
import { getErrorMessage } from '../utils/errors.js';
import { summarizeToolOutput } from '../utils/summarizer.js';
import { getComponentLogger } from '../utils/logger.js';
import { ShellExecutionService } from '../services/shellExecutionService.js';
import { formatMemoryUsage } from '../utils/formatters.js';
import { getCommandRoots, isCommandAllowed, stripShellWrapper, } from '../utils/shell-utils.js';
/** Interval for updating shell command output in milliseconds */
export const OUTPUT_UPDATE_INTERVAL_MS = 1000;
/** Logger instance for shell tool */
const logger = getComponentLogger('ShellTool');
/**
 * Implementation of shell command execution logic
 *
 * This class handles the execution of shell commands with proper validation,
 * confirmation, output streaming, and process management including background
 * process tracking.
 */
export class ShellToolInvocation extends BaseToolInvocation {
    config;
    allowlist;
    /**
     * Creates a new shell tool invocation
     * @param config - The configuration object
     * @param params - Shell execution parameters
     * @param allowlist - Set of approved commands that don't require confirmation
     */
    constructor(config, params, allowlist) {
        super(params);
        this.config = config;
        this.allowlist = allowlist;
    }
    /**
     * Gets a human-readable description of the command to be executed
     * @returns Formatted description including command, directory, and optional description
     */
    getDescription() {
        let description = `${this.params.command}`;
        // append optional [in directory]
        // note description is needed even if validation fails due to absolute path
        if (this.params.directory) {
            description += ` [in ${this.params.directory}]`;
        }
        // append optional (description), replacing any line breaks with spaces
        if (this.params.description) {
            description += ` (${this.params.description.replace(/\n/g, ' ')})`;
        }
        return description;
    }
    /**
     * Determines if user confirmation is required for command execution
     *
     * Commands that haven't been previously approved require user confirmation.
     * Once approved, commands can be added to the allowlist to skip future confirmations.
     *
     * @param _abortSignal - Abort signal for cancellation (not used in this implementation)
     * @returns Confirmation details if confirmation is needed, false otherwise
     */
    async shouldConfirmExecute(_abortSignal) {
        const command = stripShellWrapper(this.params.command);
        const rootCommands = [...new Set(getCommandRoots(command))];
        const commandsToConfirm = rootCommands.filter((command) => !this.allowlist.has(command));
        if (commandsToConfirm.length === 0) {
            return false; // already approved and allowlisted
        }
        const confirmationDetails = {
            type: 'exec',
            title: 'Confirm Shell Command',
            command: this.params.command,
            rootCommand: commandsToConfirm.join(', '),
            onConfirm: async (outcome) => {
                if (outcome === ToolConfirmationOutcome.ProceedAlways) {
                    commandsToConfirm.forEach((command) => this.allowlist.add(command));
                }
            },
        };
        return confirmationDetails;
    }
    /**
     * Executes the shell command with comprehensive monitoring and output handling
     *
     * This method handles the complete execution lifecycle including:
     * - Command validation and preprocessing
     * - Process group management and background process tracking
     * - Real-time output streaming with binary detection
     * - Error handling and result formatting
     * - Cleanup of temporary resources
     *
     * @param signal - Abort signal for cancellation
     * @param updateOutput - Optional callback for streaming output updates
     * @param shellExecutionConfig - Optional shell execution configuration
     * @param setPidCallback - Optional callback to receive the process ID
     * @returns Promise resolving to tool execution result
     *
     * @example
     * ```typescript
     * const result = await invocation.execute(
     *   abortSignal,
     *   (output) => console.log(output),
     *   { timeout: 30000 },
     *   (pid) => console.log(`Process started: ${pid}`)
     * );
     * ```
     */
    async execute(signal, updateOutput, shellExecutionConfig, setPidCallback) {
        const strippedCommand = stripShellWrapper(this.params.command);
        if (signal.aborted) {
            return {
                llmContent: 'Command was cancelled by user before it could start.',
                returnDisplay: 'Command cancelled by user.',
            };
        }
        const isWindows = os.platform() === 'win32';
        const tempFileName = `shell_pgrep_${crypto
            .randomBytes(6)
            .toString('hex')}.tmp`;
        const tempFilePath = path.join(os.tmpdir(), tempFileName);
        try {
            // pgrep is not available on Windows, so we can't get background PIDs
            const commandToExecute = isWindows
                ? strippedCommand
                : (() => {
                    // wrap command to append subprocess pids (via pgrep) to temporary file
                    let command = strippedCommand.trim();
                    if (!command.endsWith('&'))
                        command += ';';
                    return `{ ${command} }; __code=$?; pgrep -g 0 >${tempFilePath} 2>&1; exit $__code;`;
                })();
            const cwd = this.params.directory || this.config.getTargetDir();
            let cumulativeOutput = '';
            let lastUpdateTime = Date.now();
            let isBinaryStream = false;
            const { result: resultPromise, pid } = await ShellExecutionService.execute(commandToExecute, cwd, (event) => {
                if (!updateOutput) {
                    return;
                }
                let shouldUpdate = false;
                switch (event.type) {
                    case 'data':
                        if (isBinaryStream)
                            break;
                        cumulativeOutput = event.chunk;
                        shouldUpdate = true;
                        break;
                    case 'binary_detected':
                        isBinaryStream = true;
                        cumulativeOutput =
                            '[Binary output detected. Halting stream...]';
                        shouldUpdate = true;
                        break;
                    case 'binary_progress':
                        isBinaryStream = true;
                        cumulativeOutput = `[Receiving binary output... ${formatMemoryUsage(event.bytesReceived)} received]`;
                        if (Date.now() - lastUpdateTime > OUTPUT_UPDATE_INTERVAL_MS) {
                            shouldUpdate = true;
                        }
                        break;
                    default: {
                        throw new Error('An unhandled ShellOutputEvent was found.');
                    }
                }
                if (shouldUpdate) {
                    updateOutput(cumulativeOutput);
                    lastUpdateTime = Date.now();
                }
            }, signal, this.config.getShouldUseNodePtyShell(), shellExecutionConfig ?? {});
            if (pid && setPidCallback) {
                setPidCallback(pid);
            }
            const result = await resultPromise;
            const backgroundPIDs = [];
            if (os.platform() !== 'win32') {
                if (fs.existsSync(tempFilePath)) {
                    const pgrepLines = fs
                        .readFileSync(tempFilePath, 'utf8')
                        .split(EOL)
                        .filter(Boolean);
                    for (const line of pgrepLines) {
                        if (!/^\d+$/.test(line)) {
                            logger.error('Invalid pgrep output line', {
                                line,
                                command: this.params.command,
                            });
                        }
                        const pid = Number(line);
                        if (pid !== result.pid) {
                            backgroundPIDs.push(pid);
                        }
                    }
                }
                else {
                    if (!signal.aborted) {
                        logger.error('Missing pgrep output file', {
                            tempFile: tempFilePath,
                            command: this.params.command,
                        });
                    }
                }
            }
            let llmContent = '';
            if (result.aborted) {
                llmContent = 'Command was cancelled by user before it could complete.';
                if (result.output.trim()) {
                    llmContent += ` Below is the output before it was cancelled:\n${result.output}`;
                }
                else {
                    llmContent += ' There was no output before it was cancelled.';
                }
            }
            else {
                // Create a formatted error string for display, replacing the wrapper command
                // with the user-facing command.
                const finalError = result.error
                    ? result.error.message.replace(commandToExecute, this.params.command)
                    : '(none)';
                llmContent = [
                    `Command: ${this.params.command}`,
                    `Directory: ${this.params.directory || '(root)'}`,
                    `Output: ${result.output || '(empty)'}`,
                    `Error: ${finalError}`, // Use the cleaned error string.
                    `Exit Code: ${result.exitCode ?? '(none)'}`,
                    `Signal: ${result.signal ?? '(none)'}`,
                    `Background PIDs: ${backgroundPIDs.length ? backgroundPIDs.join(', ') : '(none)'}`,
                    `Process Group PGID: ${result.pid ?? '(none)'}`,
                ].join('\n');
            }
            let returnDisplayMessage = '';
            if (this.config.getDebugMode()) {
                returnDisplayMessage = llmContent;
            }
            else {
                if (result.output.trim()) {
                    returnDisplayMessage = result.output;
                }
                else {
                    if (result.aborted) {
                        returnDisplayMessage = 'Command cancelled by user.';
                    }
                    else if (result.signal) {
                        returnDisplayMessage = `Command terminated by signal: ${result.signal}`;
                    }
                    else if (result.error) {
                        returnDisplayMessage = `Command failed: ${getErrorMessage(result.error)}`;
                    }
                    else if (result.exitCode !== null && result.exitCode !== 0) {
                        returnDisplayMessage = `Command exited with code: ${result.exitCode}`;
                    }
                    // If output is empty and command succeeded (code 0, no error/signal/abort),
                    // returnDisplayMessage will remain empty, which is fine.
                }
            }
            const summarizeConfig = this.config.getSummarizeToolOutputConfig();
            const executionError = result.error
                ? {
                    error: {
                        message: result.error.message,
                        type: ToolErrorType.SHELL_EXECUTE_ERROR,
                    },
                }
                : {};
            if (summarizeConfig && summarizeConfig[ShellTool.Name]) {
                const summary = await summarizeToolOutput(llmContent, this.config.getGeminiClient(), signal, summarizeConfig[ShellTool.Name].tokenBudget);
                return {
                    llmContent: summary,
                    returnDisplay: returnDisplayMessage,
                    ...executionError,
                };
            }
            return {
                llmContent,
                returnDisplay: returnDisplayMessage,
                ...executionError,
            };
        }
        finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }
}
/**
 * Generates a platform-specific description for the shell tool
 * @returns Detailed description of shell tool capabilities and behavior
 */
function getShellToolDescription() {
    const returnedInfo = `

      The following information is returned:

      Command: Executed command.
      Directory: Directory where command was executed, or \`(root)\`.
      Stdout: Output on stdout stream. Can be \`(empty)\` or partial on error and for any unwaited background processes.
      Stderr: Output on stderr stream. Can be \`(empty)\` or partial on error and for any unwaited background processes.
      Error: Error or \`(none)\` if no error was reported for the subprocess.
      Exit Code: Exit code or \`(none)\` if terminated by signal.
      Signal: Signal number or \`(none)\` if no signal was received.
      Background PIDs: List of background processes started or \`(none)\`.
      Process Group PGID: Process group started or \`(none)\``;
    if (os.platform() === 'win32') {
        return `This tool executes a given shell command as \`cmd.exe /c <command>\`. Command can start background processes using \`start /b\`.${returnedInfo}`;
    }
    else {
        return `This tool executes a given shell command as \`bash -c <command>\`. Command can start background processes using \`&\`. Command is executed as a subprocess that leads its own process group. Command process group can be terminated as \`kill -- -PGID\` or signaled as \`kill -s SIGNAL -- -PGID\`.${returnedInfo}`;
    }
}
/**
 * Generates a platform-specific description for the command parameter
 * @returns Platform-appropriate command parameter description
 */
function getCommandDescription() {
    const cmd_substitution_warning = '\n*** WARNING: Command substitution using $(), `` ` ``, <(), or >() is not allowed for security reasons.';
    if (os.platform() === 'win32') {
        return ('Exact command to execute as `cmd.exe /c <command>`' +
            cmd_substitution_warning);
    }
    else {
        return ('Exact bash command to execute as `bash -c <command>`' +
            cmd_substitution_warning);
    }
}
/**
 * Shell command execution tool for the Gemini CLI
 *
 * This tool provides secure shell command execution with the following features:
 * - Cross-platform support (Windows cmd.exe and Unix/Linux bash)
 * - Command allowlisting and user confirmation for security
 * - Real-time output streaming with binary detection
 * - Background process tracking and management
 * - Process group handling for proper cleanup
 * - Workspace directory validation and sandboxing
 * - Comprehensive error handling and reporting
 *
 * Commands are executed with proper isolation and monitoring to ensure
 * safe operation within the configured workspace boundaries.
 */
export class ShellTool extends BaseDeclarativeTool {
    config;
    /** Tool identifier for registration and configuration */
    static Name = 'run_shell_command';
    /** Set of command roots that have been approved by the user */
    allowlist = new Set();
    /**
     * Creates a new shell tool instance
     * @param config - Configuration object containing workspace and security settings
     */
    constructor(config) {
        super(ShellTool.Name, 'Shell', getShellToolDescription(), Kind.Execute, {
            type: 'object',
            properties: {
                command: {
                    type: 'string',
                    description: getCommandDescription(),
                },
                description: {
                    type: 'string',
                    description: 'Brief description of the command for the user. Be specific and concise. Ideally a single sentence. Can be up to 3 sentences for clarity. No line breaks.',
                },
                directory: {
                    type: 'string',
                    description: '(OPTIONAL) The absolute path of the directory to run the command in. If not provided, the project root directory is used. Must be a directory within the workspace and must already exist.',
                },
            },
            required: ['command'],
        }, false, // output is not markdown
        true);
        this.config = config;
    }
    /**
     * Validates shell tool parameters for security and correctness
     *
     * Performs comprehensive validation including:
     * - Command allowlist checking against security policies
     * - Directory path validation and workspace boundary enforcement
     * - Command root extraction for permission management
     *
     * @param params - Shell tool parameters to validate
     * @returns Error message if validation fails, null if parameters are valid
     */
    validateToolParamValues(params) {
        const commandCheck = isCommandAllowed(params.command, this.config);
        if (!commandCheck.allowed) {
            if (!commandCheck.reason) {
                logger.error('Command validation failed without reason', {
                    command: params.command,
                });
                return `Command is not allowed: ${params.command}`;
            }
            return commandCheck.reason;
        }
        if (!params.command.trim()) {
            return 'Command cannot be empty.';
        }
        if (getCommandRoots(params.command).length === 0) {
            return 'Could not identify command root to obtain permission from user.';
        }
        if (params.directory) {
            if (!path.isAbsolute(params.directory)) {
                return 'Directory must be an absolute path.';
            }
            const workspaceDirs = this.config.getWorkspaceContext().getDirectories();
            const isWithinWorkspace = workspaceDirs.some((wsDir) => params.directory.startsWith(wsDir));
            if (!isWithinWorkspace) {
                return `Directory '${params.directory}' is not within any of the registered workspace directories.`;
            }
        }
        return null;
    }
    /**
     * Creates a shell tool invocation instance for command execution
     * @param params - Validated shell tool parameters
     * @returns Configured shell tool invocation ready for execution
     */
    createInvocation(params) {
        return new ShellToolInvocation(this.config, params, this.allowlist);
    }
}
//# sourceMappingURL=shell.js.map