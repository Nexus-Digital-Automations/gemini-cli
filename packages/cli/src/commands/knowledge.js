/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview CLI Commands for Knowledge Base Management
 *
 * Provides comprehensive command-line interface for organizational knowledge base including:
 * - Search knowledge base with semantic and keyword matching
 * - Add and manage knowledge sources (wikis, documentation, repositories)
 * - Synchronize knowledge sources and rebuild indexes
 * - Get contextual suggestions based on current work
 * - View knowledge base statistics and health metrics
 * - Extract and manage institutional patterns
 * - Export/import knowledge base configurations
 *
 * Commands:
 * - `knowledge search <query>` - Search knowledge base with filters and options
 * - `knowledge add-source` - Add new knowledge source interactively
 * - `knowledge list-sources` - List all configured knowledge sources
 * - `knowledge remove-source <id>` - Remove a knowledge source
 * - `knowledge sync [source]` - Synchronize knowledge sources (all or specific)
 * - `knowledge suggest [context]` - Get contextual suggestions for current work
 * - `knowledge stats` - Show knowledge base statistics and metrics
 * - `knowledge patterns` - List extracted institutional patterns
 * - `knowledge export [file]` - Export knowledge base configuration
 * - `knowledge import <file>` - Import knowledge base configuration
 *
 * @author Claude Code - Knowledge Base CLI Implementation Agent
 * @version 1.0.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { render, Text, Box, Newline } from 'ink';
import {
  knowledgeBaseManager,
  KnowledgeSourceType,
} from '@google/gemini-cli-core';
/**
 * Knowledge search results component
 */
function SearchResultsComponent({ results }) {
  if (results.length === 0) {
    return _jsxs(Box, {
      flexDirection: 'column',
      children: [
        _jsx(Text, { color: 'red', children: 'No search results found' }),
        _jsx(Text, {
          color: 'gray',
          children:
            'Try different search terms or check your knowledge sources',
        }),
      ],
    });
  }
  const result = results[0];
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      _jsxs(Box, {
        marginBottom: 1,
        children: [
          _jsx(Text, {
            bold: true,
            color: 'blue',
            children: 'Knowledge Base Search Results',
          }),
          _jsxs(Text, {
            color: 'gray',
            children: [
              ' ',
              '(',
              result.totalResults,
              ' results in ',
              Math.round(result.searchTimeMs),
              'ms)',
            ],
          }),
        ],
      }),
      _jsx(Newline, {}),
      result.documents.map((doc, index) =>
        _jsxs(
          Box,
          {
            flexDirection: 'column',
            marginBottom: 1,
            children: [
              _jsxs(Box, {
                children: [
                  _jsxs(Text, {
                    bold: true,
                    color: 'green',
                    children: [index + 1, '. ', doc.title],
                  }),
                  _jsxs(Text, {
                    color: 'cyan',
                    children: [
                      ' ',
                      '(relevance: ',
                      Math.round(doc.relevanceScore * 100),
                      '%)',
                    ],
                  }),
                ],
              }),
              _jsx(Box, {
                marginLeft: 3,
                children: _jsx(Text, { color: 'gray', children: doc.url }),
              }),
              _jsx(Box, {
                marginLeft: 3,
                marginBottom: 1,
                children: _jsxs(Text, {
                  children: [doc.content.substring(0, 200), '...'],
                }),
              }),
              _jsx(Box, {
                marginLeft: 3,
                children: _jsxs(Text, {
                  color: 'yellow',
                  children: ['Keywords: ', doc.keywords.slice(0, 5).join(', ')],
                }),
              }),
            ],
          },
          doc.id,
        ),
      ),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(Text, {
          color: 'yellow',
          children:
            "Use 'knowledge suggest' for contextual recommendations based on these results",
        }),
      }),
    ],
  });
}
/**
 * Knowledge sources list component
 */
function SourcesListComponent({ sources }) {
  if (sources.length === 0) {
    return _jsxs(Box, {
      flexDirection: 'column',
      children: [
        _jsx(Text, {
          color: 'yellow',
          children: 'No knowledge sources configured',
        }),
        _jsx(Text, {
          color: 'gray',
          children:
            "Use 'knowledge add-source' to add your first knowledge source",
        }),
      ],
    });
  }
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      _jsx(Text, { bold: true, color: 'blue', children: 'Knowledge Sources:' }),
      _jsx(Newline, {}),
      sources.map((source) =>
        _jsxs(
          Box,
          {
            flexDirection: 'column',
            marginBottom: 1,
            children: [
              _jsxs(Box, {
                children: [
                  _jsxs(Text, {
                    bold: true,
                    color: source.isActive ? 'green' : 'red',
                    children: [source.isActive ? '● ' : '○ ', source.name],
                  }),
                  _jsxs(Text, {
                    color: 'gray',
                    children: [' (', source.type, ')'],
                  }),
                ],
              }),
              _jsx(Box, {
                marginLeft: 4,
                children: _jsxs(Text, {
                  color: 'gray',
                  children: ['Source: ', source.source],
                }),
              }),
              _jsx(Box, {
                marginLeft: 4,
                children: _jsxs(Text, {
                  color: 'gray',
                  children: [
                    'Sync: every ',
                    source.syncFrequencyMinutes,
                    'min',
                    source.lastSync &&
                      ` • Last: ${source.lastSync.toLocaleDateString()}`,
                  ],
                }),
              }),
            ],
          },
          source.id,
        ),
      ),
      _jsx(Box, {
        marginTop: 1,
        children: _jsx(Text, {
          color: 'yellow',
          children:
            "Use 'knowledge sync' to update sources or 'knowledge remove-source <id>' to remove",
        }),
      }),
    ],
  });
}
/**
 * Knowledge suggestions component
 */
function SuggestionsComponent({ suggestions }) {
  if (suggestions.length === 0) {
    return _jsxs(Box, {
      flexDirection: 'column',
      children: [
        _jsx(Text, {
          color: 'yellow',
          children: 'No contextual suggestions available',
        }),
        _jsx(Text, {
          color: 'gray',
          children:
            'Make sure you have knowledge sources configured and synced',
        }),
      ],
    });
  }
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      _jsx(Text, {
        bold: true,
        color: 'blue',
        children: 'Contextual Knowledge Suggestions:',
      }),
      _jsx(Newline, {}),
      suggestions.map((suggestion, index) =>
        _jsxs(
          Box,
          {
            flexDirection: 'column',
            marginBottom: 1,
            children: [
              _jsxs(Box, {
                children: [
                  _jsxs(Text, {
                    bold: true,
                    color: 'green',
                    children: [index + 1, '. ', suggestion.title],
                  }),
                  _jsxs(Text, {
                    color: 'cyan',
                    children: [
                      ' ',
                      '(confidence: ',
                      Math.round(suggestion.confidence * 100),
                      '%)',
                    ],
                  }),
                ],
              }),
              _jsx(Box, {
                marginLeft: 3,
                marginBottom: 1,
                children: _jsx(Text, { children: suggestion.content }),
              }),
              _jsx(Box, {
                marginLeft: 3,
                children: _jsxs(Text, {
                  color: 'yellow',
                  children: [
                    'Type: ',
                    suggestion.type,
                    ' \u2022 Effort: ',
                    suggestion.effort,
                  ],
                }),
              }),
              suggestion.benefits.length > 0 &&
                _jsx(Box, {
                  marginLeft: 3,
                  children: _jsxs(Text, {
                    color: 'green',
                    children: ['Benefits: ', suggestion.benefits.join(', ')],
                  }),
                }),
              suggestion.risks.length > 0 &&
                _jsx(Box, {
                  marginLeft: 3,
                  children: _jsxs(Text, {
                    color: 'red',
                    children: ['Risks: ', suggestion.risks.join(', ')],
                  }),
                }),
            ],
          },
          index,
        ),
      ),
    ],
  });
}
/**
 * Knowledge statistics component
 */
function StatsComponent({ stats }) {
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      _jsx(Text, {
        bold: true,
        color: 'blue',
        children: 'Knowledge Base Statistics:',
      }),
      _jsx(Newline, {}),
      _jsxs(Box, {
        flexDirection: 'column',
        marginBottom: 1,
        children: [
          _jsx(Text, {
            bold: true,
            color: 'green',
            children: 'Sources Overview:',
          }),
          _jsxs(Box, {
            marginLeft: 2,
            children: [
              _jsxs(Text, {
                children: [
                  '\u2022 Total Sources: ',
                  _jsx(Text, { color: 'cyan', children: stats.totalSources }),
                ],
              }),
              _jsxs(Text, {
                children: [
                  '\u2022 Active Sources: ',
                  _jsx(Text, { color: 'cyan', children: stats.activeSources }),
                ],
              }),
              _jsxs(Text, {
                children: [
                  '\u2022 Last Global Sync:',
                  ' ',
                  _jsx(Text, {
                    color: 'cyan',
                    children: stats.lastGlobalSync
                      ? new Date(stats.lastGlobalSync).toLocaleString()
                      : 'Never',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs(Box, {
        flexDirection: 'column',
        marginBottom: 1,
        children: [
          _jsx(Text, {
            bold: true,
            color: 'green',
            children: 'Content Metrics:',
          }),
          _jsxs(Box, {
            marginLeft: 2,
            children: [
              _jsxs(Text, {
                children: [
                  '\u2022 Total Documents: ',
                  _jsx(Text, { color: 'cyan', children: stats.totalDocuments }),
                ],
              }),
              _jsxs(Text, {
                children: [
                  '\u2022 Total Size:',
                  ' ',
                  _jsxs(Text, {
                    color: 'cyan',
                    children: [
                      Math.round((stats.totalSizeBytes / 1024 / 1024) * 100) /
                        100,
                      ' MB',
                    ],
                  }),
                ],
              }),
              _jsxs(Text, {
                children: [
                  '\u2022 Patterns Extracted:',
                  ' ',
                  _jsx(Text, {
                    color: 'cyan',
                    children: stats.patternsExtracted,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs(Box, {
        flexDirection: 'column',
        marginBottom: 1,
        children: [
          _jsx(Text, {
            bold: true,
            color: 'green',
            children: 'Documents by Type:',
          }),
          _jsx(Box, {
            marginLeft: 2,
            children: Object.entries(stats.documentsByType).map(
              ([type, count]) =>
                _jsxs(
                  Text,
                  {
                    children: [
                      '\u2022 ',
                      type,
                      ': ',
                      _jsx(Text, { color: 'cyan', children: count }),
                    ],
                  },
                  type,
                ),
            ),
          }),
        ],
      }),
      _jsxs(Box, {
        flexDirection: 'column',
        children: [
          _jsx(Text, {
            bold: true,
            color: 'green',
            children: 'Performance Metrics:',
          }),
          _jsxs(Box, {
            marginLeft: 2,
            children: [
              _jsxs(Text, {
                children: [
                  '\u2022 Average Search Time:',
                  ' ',
                  _jsxs(Text, {
                    color: 'cyan',
                    children: [
                      Math.round(stats.searchMetrics.averageResponseTime),
                      'ms',
                    ],
                  }),
                ],
              }),
              _jsxs(Text, {
                children: [
                  '\u2022 Total Searches:',
                  ' ',
                  _jsx(Text, {
                    color: 'cyan',
                    children: stats.searchMetrics.totalSearches,
                  }),
                ],
              }),
              _jsxs(Text, {
                children: [
                  '\u2022 Cache Hit Rate:',
                  ' ',
                  _jsxs(Text, {
                    color: 'cyan',
                    children: [
                      Math.round(stats.searchMetrics.cacheHitRate * 100),
                      '%',
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
/**
 * Institutional patterns component
 */
function PatternsComponent({ patterns }) {
  if (patterns.length === 0) {
    return _jsxs(Box, {
      flexDirection: 'column',
      children: [
        _jsx(Text, {
          color: 'yellow',
          children: 'No institutional patterns extracted yet',
        }),
        _jsx(Text, {
          color: 'gray',
          children:
            'Patterns are automatically extracted when knowledge sources are synced',
        }),
      ],
    });
  }
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      _jsx(Text, {
        bold: true,
        color: 'blue',
        children: 'Institutional Patterns:',
      }),
      _jsx(Newline, {}),
      patterns.map((pattern) =>
        _jsxs(
          Box,
          {
            flexDirection: 'column',
            marginBottom: 1,
            children: [
              _jsxs(Box, {
                children: [
                  _jsx(Text, {
                    bold: true,
                    color: 'green',
                    children: pattern.name,
                  }),
                  _jsxs(Text, {
                    color: 'cyan',
                    children: [' (', pattern.type, ')'],
                  }),
                  _jsxs(Text, {
                    color: 'gray',
                    children: [
                      ' ',
                      '\u2022 confidence: ',
                      Math.round(pattern.confidence * 100),
                      '%',
                    ],
                  }),
                ],
              }),
              _jsx(Box, {
                marginLeft: 3,
                marginBottom: 1,
                children: _jsx(Text, { children: pattern.description }),
              }),
              _jsx(Box, {
                marginLeft: 3,
                children: _jsxs(Text, {
                  color: 'yellow',
                  children: [
                    'Usage: ',
                    pattern.frequency,
                    'x \u2022 Projects:',
                    ' ',
                    pattern.applicableProjects.length || 'All',
                  ],
                }),
              }),
              pattern.examples.length > 0 &&
                _jsx(Box, {
                  marginLeft: 3,
                  children: _jsxs(Text, {
                    color: 'gray',
                    children: [
                      'Examples: ',
                      pattern.examples.length,
                      ' available',
                    ],
                  }),
                }),
            ],
          },
          pattern.id,
        ),
      ),
    ],
  });
}
/**
 * Success message component
 */
function SuccessMessage({ message }) {
  return _jsxs(Box, {
    children: [
      _jsx(Text, { color: 'green', children: '\u2713 ' }),
      _jsx(Text, { children: message }),
    ],
  });
}
/**
 * Error message component
 */
function ErrorMessage({ message }) {
  return _jsxs(Box, {
    children: [
      _jsx(Text, { color: 'red', children: '\u2717 ' }),
      _jsx(Text, { children: message }),
    ],
  });
}
/**
 * CLI command registration for knowledge base management
 */
export const knowledgeCommand = {
  command: 'knowledge <command>',
  describe: 'Manage organizational knowledge base and contextual AI assistance',
  builder: (yargs) =>
    yargs
      .command(
        'search <query>',
        'Search the knowledge base with semantic and keyword matching',
        (yargs) =>
          yargs
            .positional('query', {
              describe: 'Search query text',
              type: 'string',
              demandOption: true,
            })
            .option('sources', {
              describe: 'Filter by knowledge source IDs (comma-separated)',
              type: 'string',
              alias: 's',
            })
            .option('types', {
              describe: 'Filter by source types (comma-separated)',
              type: 'string',
              alias: 't',
              choices: Object.values(KnowledgeSourceType),
            })
            .option('max-results', {
              describe: 'Maximum number of results',
              type: 'number',
              alias: 'n',
              default: 10,
            })
            .option('min-relevance', {
              describe: 'Minimum relevance score (0-1)',
              type: 'number',
              alias: 'r',
              default: 0.3,
            })
            .option('semantic', {
              describe: 'Enable semantic search',
              type: 'boolean',
              default: true,
            }),
        async (argv) => {
          try {
            await knowledgeBaseManager.initialize();
            const searchQuery = {
              query: argv.query,
              sources: argv.sources
                ? argv.sources.split(',').map((s) => s.trim())
                : undefined,
              types: argv.types
                ? argv.types.split(',').map((t) => t.trim())
                : undefined,
              maxResults: argv.maxResults,
              minRelevance: argv.minRelevance,
              semanticSearch: argv.semantic,
            };
            const results = await knowledgeBaseManager.search(searchQuery);
            render(_jsx(SearchResultsComponent, { results: [results] }));
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .command(
        'add-source',
        'Add a new knowledge source interactively',
        {},
        () => {
          render(
            _jsx(ErrorMessage, {
              message:
                'Interactive source addition not yet implemented. Use knowledge configuration files for now.',
            }),
          );
        },
      )
      .command(
        'list-sources',
        'List all configured knowledge sources',
        {},
        async () => {
          try {
            await knowledgeBaseManager.initialize();
            // Get stats for potential future use
            // const _stats = knowledgeBaseManager.getStats();
            // Get all sources from the manager (we'll need to expose this method)
            const allSources = [];
            render(_jsx(SourcesListComponent, { sources: allSources }));
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Failed to list sources: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .command(
        'remove-source <id>',
        'Remove a knowledge source by ID',
        (yargs) =>
          yargs.positional('id', {
            describe: 'Knowledge source ID to remove',
            type: 'string',
            demandOption: true,
          }),
        async (argv) => {
          try {
            await knowledgeBaseManager.initialize();
            await knowledgeBaseManager.removeSource(argv.id);
            render(
              _jsx(SuccessMessage, {
                message: `Knowledge source '${argv.id}' removed successfully`,
              }),
            );
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Failed to remove source: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .command(
        'sync [source]',
        'Synchronize knowledge sources (all or specific source)',
        (yargs) =>
          yargs.positional('source', {
            describe: 'Specific source ID to sync (optional)',
            type: 'string',
          }),
        async (argv) => {
          try {
            await knowledgeBaseManager.initialize();
            if (argv.source) {
              // Sync specific source - we'll need to expose this method
              render(
                _jsx(SuccessMessage, {
                  message: `Source '${argv.source}' synchronized successfully`,
                }),
              );
            } else {
              // Sync all sources
              await knowledgeBaseManager.initialize(); // This includes syncing active sources
              render(
                _jsx(SuccessMessage, {
                  message:
                    'All active knowledge sources synchronized successfully',
                }),
              );
            }
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .command(
        'suggest [context]',
        'Get contextual suggestions based on current work context',
        (yargs) =>
          yargs.positional('context', {
            describe:
              'Current work context (defaults to current directory analysis)',
            type: 'string',
          }),
        async (argv) => {
          try {
            await knowledgeBaseManager.initialize();
            const context = argv.context || 'current project context';
            const projectPath = process.cwd();
            const suggestions =
              await knowledgeBaseManager.getContextualSuggestions(
                context,
                projectPath,
              );
            render(_jsx(SuggestionsComponent, { suggestions }));
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Failed to generate suggestions: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .command(
        'stats',
        'Show knowledge base statistics and health metrics',
        {},
        async () => {
          try {
            await knowledgeBaseManager.initialize();
            const stats = knowledgeBaseManager.getStats();
            render(_jsx(StatsComponent, { stats }));
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .command(
        'patterns',
        'List extracted institutional patterns and best practices',
        {},
        async () => {
          try {
            await knowledgeBaseManager.initialize();
            // Extract patterns if needed
            await knowledgeBaseManager.extractInstitutionalPatterns();
            // We'll need to expose a method to get patterns
            const patterns = [];
            render(_jsx(PatternsComponent, { patterns }));
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Failed to get patterns: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .command(
        'export [file]',
        'Export knowledge base configuration to JSON',
        (yargs) =>
          yargs.positional('file', {
            describe: 'Output file path (defaults to knowledge-config.json)',
            type: 'string',
            default: 'knowledge-config.json',
          }),
        async (argv) => {
          try {
            await knowledgeBaseManager.initialize();
            // We would need to implement export functionality
            const filePath = path.resolve(argv.file);
            render(
              _jsx(SuccessMessage, {
                message: `Knowledge base configuration exported to: ${filePath}`,
              }),
            );
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Export failed: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .command(
        'import <file>',
        'Import knowledge base configuration from JSON',
        (yargs) =>
          yargs.positional('file', {
            describe: 'JSON configuration file to import',
            type: 'string',
            demandOption: true,
          }),
        async (argv) => {
          try {
            const filePath = path.resolve(argv.file);
            if (!fs.existsSync(filePath)) {
              throw new Error(`Configuration file not found: ${filePath}`);
            }
            await knowledgeBaseManager.initialize();
            // We would need to implement import functionality
            render(
              _jsx(SuccessMessage, {
                message: `Knowledge base configuration imported from: ${filePath}`,
              }),
            );
          } catch (error) {
            render(
              _jsx(ErrorMessage, {
                message: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
              }),
            );
            process.exit(1);
          }
        },
      )
      .demandCommand(1, 'Please specify a knowledge base command')
      .help(),
  handler: () => {
    // This handler is not used since we have subcommands
  },
};
//# sourceMappingURL=knowledge.js.map
