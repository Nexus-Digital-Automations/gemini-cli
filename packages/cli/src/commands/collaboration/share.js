/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import { SessionManager } from '@gemini-cli/core/src/collaboration/SessionManager.js';
import { ContextType, ContextPriority } from '@gemini-cli/core/src/context/types.js';

export const shareCommand = {
    command: 'share <type> [target]',
    describe: 'Share context with collaboration session participants',
    builder: (yargs) => yargs
        .positional('type', {
            describe: 'Type of content to share',
            type: 'string',
            choices: ['context', 'file', 'directory', 'error', 'snippet', 'state']
        })
        .positional('target', {
            describe: 'Target file, directory, or content to share',
            type: 'string'
        })
        .option('session', {
            describe: 'Session ID to share with (uses current session if not provided)',
            type: 'string',
            alias: 's'
        })
        .option('priority', {
            describe: 'Priority level of shared content',
            type: 'string',
            choices: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'CACHED'],
            default: 'MEDIUM',
            alias: 'p'
        })
        .option('description', {
            describe: 'Description of what you are sharing',
            type: 'string',
            alias: 'd'
        })
        .option('include-history', {
            describe: 'Include git history for files/directories',
            type: 'boolean',
            default: false
        })
        .option('recursive', {
            describe: 'Recursively share directory contents',
            type: 'boolean',
            default: false,
            alias: 'r'
        })
        .option('exclude', {
            describe: 'Patterns to exclude (comma-separated)',
            type: 'string'
        })
        .example('gemini collab share file ./src/api.js', 'Share a specific file')
        .example('gemini collab share directory ./src --recursive', 'Share directory recursively')
        .example('gemini collab share error "TypeError in auth.js line 42"', 'Share an error for help')
        .example('gemini collab share snippet --description "Login validation"', 'Share code snippet from clipboard')
        .example('gemini collab share state --priority HIGH', 'Share current project state'),

    handler: async (argv) => {
        try {
            const sessionManager = new SessionManager();
            let targetSessionId = argv.session;

            // Get current session if not specified
            if (!targetSessionId) {
                targetSessionId = await getCurrentSessionId();
                if (!targetSessionId) {
                    console.log(chalk.yellow('ℹ️  No active collaboration session'));
                    console.log(chalk.gray('• Create a session: ') + chalk.cyan('gemini collab create <name>'));
                    console.log(chalk.gray('• Join a session: ') + chalk.cyan('gemini collab join <sessionId>'));
                    return;
                }
            }

            console.log(chalk.cyan(`📤 Sharing ${argv.type} with collaboration session...`));

            // Process different sharing types
            let contextItems = [];
            switch (argv.type) {
                case 'file':
                    contextItems = await shareFile(argv.target, argv);
                    break;
                case 'directory':
                    contextItems = await shareDirectory(argv.target, argv);
                    break;
                case 'context':
                    contextItems = await shareContext(argv.target, argv);
                    break;
                case 'error':
                    contextItems = await shareError(argv.target, argv);
                    break;
                case 'snippet':
                    contextItems = await shareSnippet(argv.target, argv);
                    break;
                case 'state':
                    contextItems = await shareProjectState(argv);
                    break;
                default:
                    throw new Error(`Unsupported share type: ${argv.type}`);
            }

            // Share each context item with the session
            let sharedCount = 0;
            for (const contextItem of contextItems) {
                try {
                    await sessionManager.shareContext(targetSessionId, contextItem);
                    sharedCount++;
                } catch (error) {
                    console.warn(chalk.yellow(`⚠️  Failed to share: ${contextItem.source}`));
                    console.warn(chalk.gray(`   Reason: ${error.message}`));
                }
            }

            // Display success summary
            console.log(chalk.green(`✅ Successfully shared ${sharedCount} context item(s)`));
            console.log('');
            console.log(chalk.bold('Shared Content:'));

            contextItems.forEach((item, index) => {
                const priorityColor = item.priority === 'CRITICAL' ? chalk.red :
                                    item.priority === 'HIGH' ? chalk.yellow :
                                    item.priority === 'MEDIUM' ? chalk.blue :
                                    chalk.gray;

                console.log(`   ${index + 1}. ${chalk.white(item.source)} - ${priorityColor(item.priority)}`);
                if (item.metadata?.size) {
                    console.log(`      📏 Size: ${formatBytes(item.metadata.size)}`);
                }
                if (item.metadata?.lines) {
                    console.log(`      📄 Lines: ${item.metadata.lines}`);
                }
                if (item.description) {
                    console.log(`      📝 ${chalk.gray(item.description)}`);
                }
            });

            console.log('');
            console.log(chalk.bold('Participants Notified:'));
            const session = await sessionManager.getSession(targetSessionId);
            const currentParticipant = await getCurrentParticipantInfo();

            session.participants
                .filter(p => p.id !== currentParticipant?.id)
                .forEach(participant => {
                    const statusIcon = participant.status === 'ACTIVE' ? '🟢' : '🟡';
                    console.log(`   ${statusIcon} ${participant.name} (${participant.role})`);
                });

            console.log('');
            console.log(chalk.gray('💡 Participants can now access this shared content'));
            console.log(chalk.gray('💡 Use "gemini collab status --detailed" to see all shared context'));

        } catch (error) {
            console.error(chalk.red('❌ Failed to share context:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));

            // Provide helpful suggestions
            if (error.message.includes('not found')) {
                console.log(chalk.yellow('\n💡 File or directory not found'));
                console.log(chalk.gray('• Check the path is correct'));
                console.log(chalk.gray('• Use relative paths from current directory'));
            } else if (error.message.includes('permission')) {
                console.log(chalk.yellow('\n💡 Permission denied'));
                console.log(chalk.gray('• Check file/directory permissions'));
                console.log(chalk.gray('• Ensure you can read the target'));
            }

            process.exit(1);
        }
    },
};

/**
 * Share a single file
 */
async function shareFile(filePath, options) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    if (!filePath) {
        throw new Error('File path is required');
    }

    const absolutePath = path.resolve(filePath);
    const stats = await fs.stat(absolutePath);

    if (!stats.isFile()) {
        throw new Error(`${filePath} is not a file`);
    }

    const content = await fs.readFile(absolutePath, 'utf-8');
    const lines = content.split('\n').length;

    const contextItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ContextType.FILE,
        source: filePath,
        content,
        priority: ContextPriority[options.priority],
        lastAccessed: new Date(),
        description: options.description || `Shared file: ${path.basename(filePath)}`,
        metadata: {
            filePath: absolutePath,
            size: stats.size,
            lines,
            modified: stats.mtime,
            extension: path.extname(filePath),
            sharedAt: new Date(),
            includeHistory: options.includeHistory
        }
    };

    return [contextItem];
}

/**
 * Share a directory
 */
async function shareDirectory(dirPath, options) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    if (!dirPath) {
        throw new Error('Directory path is required');
    }

    const absolutePath = path.resolve(dirPath);
    const stats = await fs.stat(absolutePath);

    if (!stats.isDirectory()) {
        throw new Error(`${dirPath} is not a directory`);
    }

    const excludePatterns = options.exclude ?
        options.exclude.split(',').map(p => p.trim()) :
        ['node_modules', '.git', 'dist', 'build', '.DS_Store'];

    const files = await getDirectoryFiles(absolutePath, {
        recursive: options.recursive,
        excludePatterns
    });

    const contextItems = [];
    for (const filePath of files) {
        try {
            const relativeFilePath = path.relative(process.cwd(), filePath);
            const fileItems = await shareFile(relativeFilePath, {
                ...options,
                description: options.description || `From directory: ${dirPath}`
            });
            contextItems.push(...fileItems);
        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Skipped file: ${filePath}`));
        }
    }

    return contextItems;
}

/**
 * Share existing context
 */
async function shareContext(contextQuery, options) {
    // This would typically query the user's existing context
    // For now, create a placeholder context item
    const contextItem = {
        id: `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ContextType.CONVERSATION,
        source: 'Current context',
        content: contextQuery || 'Shared context from current session',
        priority: ContextPriority[options.priority],
        lastAccessed: new Date(),
        description: options.description || 'Shared context from current work',
        metadata: {
            sharedAt: new Date(),
            query: contextQuery
        }
    };

    return [contextItem];
}

/**
 * Share an error for collaborative debugging
 */
async function shareError(errorDescription, options) {
    const contextItem = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ContextType.ERROR,
        source: 'Error report',
        content: errorDescription || 'Error shared for collaborative debugging',
        priority: ContextPriority.HIGH, // Errors are typically high priority
        lastAccessed: new Date(),
        description: options.description || 'Error shared for debugging assistance',
        metadata: {
            sharedAt: new Date(),
            errorType: 'runtime', // Could be parsed from error description
            needsHelp: true
        }
    };

    return [contextItem];
}

/**
 * Share a code snippet
 */
async function shareSnippet(snippetContent, options) {
    // If no content provided, try to get from clipboard (placeholder)
    const content = snippetContent || 'Code snippet from clipboard';

    const contextItem = {
        id: `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ContextType.CODE,
        source: 'Code snippet',
        content,
        priority: ContextPriority[options.priority],
        lastAccessed: new Date(),
        description: options.description || 'Shared code snippet',
        metadata: {
            sharedAt: new Date(),
            lines: content.split('\n').length,
            language: 'javascript' // Could be detected from content
        }
    };

    return [contextItem];
}

/**
 * Share current project state
 */
async function shareProjectState(options) {
    // Gather current project state information
    const projectState = {
        workingDirectory: process.cwd(),
        timestamp: new Date(),
        gitStatus: await getGitStatus(),
        packageInfo: await getPackageInfo(),
        // Add more project state information as needed
    };

    const contextItem = {
        id: `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ContextType.PROJECT_STATE,
        source: 'Project state',
        content: JSON.stringify(projectState, null, 2),
        priority: ContextPriority[options.priority],
        lastAccessed: new Date(),
        description: options.description || 'Current project state snapshot',
        metadata: {
            sharedAt: new Date(),
            projectPath: process.cwd()
        }
    };

    return [contextItem];
}

/**
 * Helper functions
 */

async function getCurrentSessionId() {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');

        const sessionFile = path.join(process.cwd(), '.gemini-cli', 'active-session.json');
        const sessionData = await fs.readFile(sessionFile, 'utf-8');
        const sessionInfo = JSON.parse(sessionData);

        return sessionInfo.isActive ? sessionInfo.id : null;
    } catch (error) {
        return null;
    }
}

async function getCurrentParticipantInfo() {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');

        const sessionFile = path.join(process.cwd(), '.gemini-cli', 'active-session.json');
        const sessionData = await fs.readFile(sessionFile, 'utf-8');
        const sessionInfo = JSON.parse(sessionData);

        return {
            id: sessionInfo.participantName || 'unknown',
            name: sessionInfo.participantName,
            role: sessionInfo.role
        };
    } catch (error) {
        return null;
    }
}

async function getDirectoryFiles(dirPath, options) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const files = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip excluded patterns
        if (options.excludePatterns?.some(pattern => entry.name.includes(pattern))) {
            continue;
        }

        if (entry.isFile()) {
            files.push(fullPath);
        } else if (entry.isDirectory() && options.recursive) {
            const subFiles = await getDirectoryFiles(fullPath, options);
            files.push(...subFiles);
        }
    }

    return files;
}

async function getGitStatus() {
    try {
        const { execSync } = await import('node:child_process');
        const status = execSync('git status --porcelain', {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        return status.trim();
    } catch (error) {
        return 'Not a git repository or git not available';
    }
}

async function getPackageInfo() {
    try {
        const fs = await import('node:fs/promises');
        const packageData = await fs.readFile('./package.json', 'utf-8');
        const packageJson = JSON.parse(packageData);
        return {
            name: packageJson.name,
            version: packageJson.version,
            description: packageJson.description
        };
    } catch (error) {
        return null;
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}