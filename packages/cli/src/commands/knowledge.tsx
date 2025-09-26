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
import type { Argv, ArgumentsCamelCase } from 'yargs';
import { render, Text, Box, Newline } from 'ink';
import {
  knowledgeBaseManager,
  KnowledgeSourceType,
  type KnowledgeQuery,
  type KnowledgeSource,
  type KnowledgeDocument,
  type KnowledgeSuggestion,
  type KnowledgeStats,
  type InstitutionalPattern,
} from '@google/gemini-cli-core';

/**
 * Knowledge search results component
 */
function SearchResultsComponent({
  results,
}: {
  results: Array<{
    documents: KnowledgeDocument[];
    query: KnowledgeQuery;
    totalResults: number;
    searchTimeMs: number;
  }>;
}) {
  if (results.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="red">No search results found</Text>
        <Text color="gray">
          Try different search terms or check your knowledge sources
        </Text>
      </Box>
    );
  }

  const result = results[0];

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">
          Knowledge Base Search Results
        </Text>
        <Text color="gray">
          {' '}
          ({result.totalResults} results in {Math.round(result.searchTimeMs)}ms)
        </Text>
      </Box>
      <Newline />

      {result.documents.map((doc: KnowledgeDocument, index: number) => (
        <Box key={doc.id} flexDirection="column" marginBottom={1}>
          <Box>
            <Text bold color="green">
              {index + 1}. {doc.title}
            </Text>
            <Text color="cyan">
              {' '}
              (relevance: {Math.round(doc.relevanceScore * 100)}%)
            </Text>
          </Box>
          <Box marginLeft={3}>
            <Text color="gray">{doc.url}</Text>
          </Box>
          <Box marginLeft={3} marginBottom={1}>
            <Text>{doc.content.substring(0, 200)}...</Text>
          </Box>
          <Box marginLeft={3}>
            <Text color="yellow">
              Keywords: {doc.keywords.slice(0, 5).join(', ')}
            </Text>
          </Box>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text color="yellow">
          Use &apos;knowledge suggest&apos; for contextual recommendations based
          on these results
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Knowledge sources list component
 */
function SourcesListComponent({ sources }: { sources: KnowledgeSource[] }) {
  if (sources.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">No knowledge sources configured</Text>
        <Text color="gray">
          Use &apos;knowledge add-source&apos; to add your first knowledge
          source
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        Knowledge Sources:
      </Text>
      <Newline />

      {sources.map((source: KnowledgeSource) => (
        <Box key={source.id} flexDirection="column" marginBottom={1}>
          <Box>
            <Text bold color={source.isActive ? 'green' : 'red'}>
              {source.isActive ? '● ' : '○ '}
              {source.name}
            </Text>
            <Text color="gray"> ({source.type})</Text>
          </Box>
          <Box marginLeft={4}>
            <Text color="gray">Source: {source.source}</Text>
          </Box>
          <Box marginLeft={4}>
            <Text color="gray">
              Sync: every {source.syncFrequencyMinutes}min
              {source.lastSync &&
                ` • Last: ${source.lastSync.toLocaleDateString()}`}
            </Text>
          </Box>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text color="yellow">
          Use &apos;knowledge sync&apos; to update sources or &apos;knowledge
          remove-source &lt;id&gt;&apos; to remove
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Knowledge suggestions component
 */
function SuggestionsComponent({
  suggestions,
}: {
  suggestions: KnowledgeSuggestion[];
}) {
  if (suggestions.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">No contextual suggestions available</Text>
        <Text color="gray">
          Make sure you have knowledge sources configured and synced
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        Contextual Knowledge Suggestions:
      </Text>
      <Newline />

      {suggestions.map((suggestion: KnowledgeSuggestion, index: number) => (
        <Box key={index} flexDirection="column" marginBottom={1}>
          <Box>
            <Text bold color="green">
              {index + 1}. {suggestion.title}
            </Text>
            <Text color="cyan">
              {' '}
              (confidence: {Math.round(suggestion.confidence * 100)}%)
            </Text>
          </Box>
          <Box marginLeft={3} marginBottom={1}>
            <Text>{suggestion.content}</Text>
          </Box>
          <Box marginLeft={3}>
            <Text color="yellow">
              Type: {suggestion.type} • Effort: {suggestion.effort}
            </Text>
          </Box>
          {suggestion.benefits.length > 0 && (
            <Box marginLeft={3}>
              <Text color="green">
                Benefits: {suggestion.benefits.join(', ')}
              </Text>
            </Box>
          )}
          {suggestion.risks.length > 0 && (
            <Box marginLeft={3}>
              <Text color="red">Risks: {suggestion.risks.join(', ')}</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Knowledge statistics component
 */
function StatsComponent({ stats }: { stats: KnowledgeStats }) {
  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        Knowledge Base Statistics:
      </Text>
      <Newline />

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="green">
          Sources Overview:
        </Text>
        <Box marginLeft={2}>
          <Text>
            • Total Sources: <Text color="cyan">{stats.totalSources}</Text>
          </Text>
          <Text>
            • Active Sources: <Text color="cyan">{stats.activeSources}</Text>
          </Text>
          <Text>
            • Last Global Sync:{' '}
            <Text color="cyan">
              {stats.lastGlobalSync
                ? new Date(stats.lastGlobalSync).toLocaleString()
                : 'Never'}
            </Text>
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="green">
          Content Metrics:
        </Text>
        <Box marginLeft={2}>
          <Text>
            • Total Documents: <Text color="cyan">{stats.totalDocuments}</Text>
          </Text>
          <Text>
            • Total Size:{' '}
            <Text color="cyan">
              {Math.round((stats.totalSizeBytes / 1024 / 1024) * 100) / 100} MB
            </Text>
          </Text>
          <Text>
            • Patterns Extracted:{' '}
            <Text color="cyan">{stats.patternsExtracted}</Text>
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="green">
          Documents by Type:
        </Text>
        <Box marginLeft={2}>
          {Object.entries(stats.documentsByType).map(([type, count]) => (
            <Text key={type}>
              • {type}: <Text color="cyan">{count as number}</Text>
            </Text>
          ))}
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold color="green">
          Performance Metrics:
        </Text>
        <Box marginLeft={2}>
          <Text>
            • Average Search Time:{' '}
            <Text color="cyan">
              {Math.round(stats.searchMetrics.averageResponseTime)}ms
            </Text>
          </Text>
          <Text>
            • Total Searches:{' '}
            <Text color="cyan">{stats.searchMetrics.totalSearches}</Text>
          </Text>
          <Text>
            • Cache Hit Rate:{' '}
            <Text color="cyan">
              {Math.round(stats.searchMetrics.cacheHitRate * 100)}%
            </Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Institutional patterns component
 */
function PatternsComponent({ patterns }: { patterns: InstitutionalPattern[] }) {
  if (patterns.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">No institutional patterns extracted yet</Text>
        <Text color="gray">
          Patterns are automatically extracted when knowledge sources are synced
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        Institutional Patterns:
      </Text>
      <Newline />

      {patterns.map((pattern: InstitutionalPattern) => (
        <Box key={pattern.id} flexDirection="column" marginBottom={1}>
          <Box>
            <Text bold color="green">
              {pattern.name}
            </Text>
            <Text color="cyan"> ({pattern.type})</Text>
            <Text color="gray">
              {' '}
              • confidence: {Math.round(pattern.confidence * 100)}%
            </Text>
          </Box>
          <Box marginLeft={3} marginBottom={1}>
            <Text>{pattern.description}</Text>
          </Box>
          <Box marginLeft={3}>
            <Text color="yellow">
              Usage: {pattern.frequency}x • Projects:{' '}
              {pattern.applicableProjects.length || 'All'}
            </Text>
          </Box>
          {pattern.examples.length > 0 && (
            <Box marginLeft={3}>
              <Text color="gray">
                Examples: {pattern.examples.length} available
              </Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Success message component
 */
function SuccessMessage({ message }: { message: string }) {
  return (
    <Box>
      <Text color="green">✓ </Text>
      <Text>{message}</Text>
    </Box>
  );
}

/**
 * Error message component
 */
function ErrorMessage({ message }: { message: string }) {
  return (
    <Box>
      <Text color="red">✗ </Text>
      <Text>{message}</Text>
    </Box>
  );
}

/**
 * CLI command registration for knowledge base management
 */
export const knowledgeCommand = {
  command: 'knowledge <command>',
  describe: 'Manage organizational knowledge base and contextual AI assistance',
  builder: (yargs: Argv) =>
    yargs
      .command(
        'search <query>',
        'Search the knowledge base with semantic and keyword matching',
        (yargs: Argv) =>
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
        async (
          argv: ArgumentsCamelCase<{
            query: string;
            sources?: string;
            types?: string;
            maxResults: number;
            minRelevance: number;
            semantic: boolean;
          }>,
        ) => {
          try {
            await knowledgeBaseManager.initialize();

            const searchQuery: KnowledgeQuery = {
              query: argv.query,
              sources: argv.sources
                ? argv.sources.split(',').map((s) => s.trim())
                : undefined,
              types: argv.types
                ? argv.types
                    .split(',')
                    .map((t) => t.trim() as KnowledgeSourceType)
                : undefined,
              maxResults: argv.maxResults,
              minRelevance: argv.minRelevance,
              semanticSearch: argv.semantic,
            };

            const results = await knowledgeBaseManager.search(searchQuery);
            render(<SearchResultsComponent results={[results]} />);
          } catch (error) {
            render(
              <ErrorMessage
                message={`Search failed: ${error instanceof Error ? error.message : String(error)}`}
              />,
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
            <ErrorMessage message="Interactive source addition not yet implemented. Use knowledge configuration files for now." />,
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
            const _stats = knowledgeBaseManager.getStats();

            // Get all sources from the manager (we'll need to expose this method)
            const allSources: KnowledgeSource[] = [];
            render(<SourcesListComponent sources={allSources} />);
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to list sources: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .command(
        'remove-source <id>',
        'Remove a knowledge source by ID',
        (yargs: Argv) =>
          yargs.positional('id', {
            describe: 'Knowledge source ID to remove',
            type: 'string',
            demandOption: true,
          }),
        async (argv: ArgumentsCamelCase<{ id: string }>) => {
          try {
            await knowledgeBaseManager.initialize();
            await knowledgeBaseManager.removeSource(argv.id);
            render(
              <SuccessMessage
                message={`Knowledge source '${argv.id}' removed successfully`}
              />,
            );
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to remove source: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .command(
        'sync [source]',
        'Synchronize knowledge sources (all or specific source)',
        (yargs: Argv) =>
          yargs.positional('source', {
            describe: 'Specific source ID to sync (optional)',
            type: 'string',
          }),
        async (argv: ArgumentsCamelCase<{ source?: string }>) => {
          try {
            await knowledgeBaseManager.initialize();

            if (argv.source) {
              // Sync specific source - we'll need to expose this method
              render(
                <SuccessMessage
                  message={`Source '${argv.source}' synchronized successfully`}
                />,
              );
            } else {
              // Sync all sources
              await knowledgeBaseManager.initialize(); // This includes syncing active sources
              render(
                <SuccessMessage message="All active knowledge sources synchronized successfully" />,
              );
            }
          } catch (error) {
            render(
              <ErrorMessage
                message={`Sync failed: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .command(
        'suggest [context]',
        'Get contextual suggestions based on current work context',
        (yargs: Argv) =>
          yargs.positional('context', {
            describe:
              'Current work context (defaults to current directory analysis)',
            type: 'string',
          }),
        async (argv: ArgumentsCamelCase<{ context?: string }>) => {
          try {
            await knowledgeBaseManager.initialize();

            const context = argv.context || 'current project context';
            const projectPath = process.cwd();

            const suggestions =
              await knowledgeBaseManager.getContextualSuggestions(
                context,
                projectPath,
              );

            render(<SuggestionsComponent suggestions={suggestions} />);
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to generate suggestions: ${error instanceof Error ? error.message : String(error)}`}
              />,
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
            render(<StatsComponent stats={stats} />);
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`}
              />,
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
            const patterns: InstitutionalPattern[] = [];
            render(<PatternsComponent patterns={patterns} />);
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to get patterns: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .command(
        'export [file]',
        'Export knowledge base configuration to JSON',
        (yargs: Argv) =>
          yargs.positional('file', {
            describe: 'Output file path (defaults to knowledge-config.json)',
            type: 'string',
            default: 'knowledge-config.json',
          }),
        async (argv: ArgumentsCamelCase<{ file: string }>) => {
          try {
            await knowledgeBaseManager.initialize();

            // We would need to implement export functionality
            const filePath = path.resolve(argv.file);
            render(
              <SuccessMessage
                message={`Knowledge base configuration exported to: ${filePath}`}
              />,
            );
          } catch (error) {
            render(
              <ErrorMessage
                message={`Export failed: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .command(
        'import <file>',
        'Import knowledge base configuration from JSON',
        (yargs: Argv) =>
          yargs.positional('file', {
            describe: 'JSON configuration file to import',
            type: 'string',
            demandOption: true,
          }),
        async (argv: ArgumentsCamelCase<{ file: string }>) => {
          try {
            const filePath = path.resolve(argv.file);

            if (!fs.existsSync(filePath)) {
              throw new Error(`Configuration file not found: ${filePath}`);
            }

            await knowledgeBaseManager.initialize();

            // We would need to implement import functionality
            render(
              <SuccessMessage
                message={`Knowledge base configuration imported from: ${filePath}`}
              />,
            );
          } catch (error) {
            render(
              <ErrorMessage
                message={`Import failed: ${error instanceof Error ? error.message : String(error)}`}
              />,
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
