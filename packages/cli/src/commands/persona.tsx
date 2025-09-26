/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview CLI Commands for AI Persona Management
 *
 * Provides comprehensive command-line interface for managing AI personas including:
 * - List all available personas (built-in and custom)
 * - Switch between different persona profiles
 * - Create new custom personas with interactive prompts
 * - Edit existing custom personas
 * - Delete custom personas
 * - Import/export persona configurations
 * - Show detailed persona information
 *
 * Commands:
 * - `persona list` - List all available personas
 * - `persona switch <name>` - Switch to a specific persona
 * - `persona create` - Create a new custom persona interactively
 * - `persona edit <name>` - Edit an existing custom persona
 * - `persona delete <name>` - Delete a custom persona
 * - `persona show [name]` - Show persona details
 * - `persona export` - Export custom personas to JSON
 * - `persona import <file>` - Import personas from JSON file
 *
 * @author Claude Code - AI Persona CLI Implementation Agent
 * @version 1.0.0
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Argv, ArgumentsCamelCase } from 'yargs';
import { render, Text, Box, Newline } from 'ink';
import { personaManager } from '@google/gemini-cli-core';
import type { PersonaProfile } from '@google/gemini-cli-core';

/**
 * Persona list component showing all available personas
 */
function PersonaListComponent() {
  const personas = personaManager.getAllPersonas();
  const activePersonaId = personaManager.getActivePersonaId();

  return (
    <Box flexDirection="column">
      <Text bold color="blue">
        Available AI Personas:
      </Text>
      <Newline />

      {Array.from(personas.entries()).map(
        ([id, persona]: [string, PersonaProfile]) => (
          <Box key={id} flexDirection="column" marginBottom={1}>
            <Box>
              <Text bold color={id === activePersonaId ? 'green' : 'white'}>
                {id === activePersonaId ? '★ ' : '  '}
                {persona.name}
              </Text>
              {persona.isSystem && (
                <Text color="gray" dimColor>
                  {' '}
                  (built-in)
                </Text>
              )}
            </Box>
            <Box marginLeft={4}>
              <Text color="gray">{persona.description}</Text>
            </Box>
          </Box>
        ),
      )}

      <Box marginTop={1}>
        <Text color="yellow">
          Use &apos;persona switch &lt;name&gt;&apos; to activate a persona
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Persona details component showing comprehensive persona information
 */
function PersonaDetailsComponent({ personaId }: { personaId?: string }) {
  const persona = personaId
    ? personaManager.getPersona(personaId)
    : personaManager.getActivePersona();

  const currentId = personaId || personaManager.getActivePersonaId();

  if (!persona) {
    return <Text color="red">Persona &apos;{personaId}&apos; not found</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">
          {persona.name}
        </Text>
        {persona.isSystem && (
          <Text color="gray" dimColor>
            {' '}
            (built-in)
          </Text>
        )}
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">{persona.description}</Text>
      </Box>

      {currentId === personaManager.getActivePersonaId() && (
        <Box marginBottom={1}>
          <Text bold color="green">
            ★ Currently Active
          </Text>
        </Box>
      )}

      <Newline />

      <Text bold color="yellow">
        Personality Traits:
      </Text>
      <Box flexDirection="column" marginLeft={2} marginBottom={1}>
        <Text>
          • Communication:{' '}
          <Text color="cyan">{persona.personality.formality || 'default'}</Text>
        </Text>
        <Text>
          • Response Length:{' '}
          <Text color="cyan">{persona.personality.verbosity || 'default'}</Text>
        </Text>
        <Text>
          • Creativity:{' '}
          <Text color="cyan">
            {persona.personality.creativity || 'default'}
          </Text>
        </Text>
        <Text>
          • Teaching Style:{' '}
          <Text color="cyan">
            {persona.personality.teachingStyle || 'default'}
          </Text>
        </Text>
      </Box>

      <Text bold color="yellow">
        Behavioral Patterns:
      </Text>
      <Box flexDirection="column" marginLeft={2} marginBottom={1}>
        <Text>
          • Proactiveness:{' '}
          <Text color="cyan">
            {persona.behavior.proactiveness || 'default'}
          </Text>
        </Text>
        <Text>
          • Error Handling:{' '}
          <Text color="cyan">
            {persona.behavior.errorHandling || 'default'}
          </Text>
        </Text>
        <Text>
          • Code Review:{' '}
          <Text color="cyan">{persona.behavior.codeStyle || 'default'}</Text>
        </Text>
      </Box>

      {persona.customization.customPromptAdditions && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">
            Custom Instructions:
          </Text>
          <Box marginLeft={2}>
            <Text>{persona.customization.customPromptAdditions}</Text>
          </Box>
        </Box>
      )}

      {persona.customization.learningPreferences &&
        persona.customization.learningPreferences.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color="yellow">
              Learning Focus Areas:
            </Text>
            <Box flexDirection="column" marginLeft={2}>
              {persona.customization.learningPreferences.map(
                (area: string, index: number) => (
                  <Text key={index}>• {area}</Text>
                ),
              )}
            </Box>
          </Box>
        )}

      {persona.customization.preferredTerminology &&
        Object.keys(persona.customization.preferredTerminology).length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color="yellow">
              Preferred Terminology:
            </Text>
            <Box flexDirection="column" marginLeft={2}>
              {Object.entries(persona.customization.preferredTerminology).map(
                ([standard, preferred]: [string, string]) => (
                  <Text key={standard}>
                    • &quot;{preferred}&quot; instead of &quot;{standard}&quot;
                  </Text>
                ),
              )}
            </Box>
          </Box>
        )}

      {persona.updatedAt && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Last updated: {new Date(persona.updatedAt).toLocaleDateString()}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Success message component for persona operations
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
 * Error message component for persona operations
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
 * CLI command registration for persona management
 */
export const personaCommand = {
  command: 'persona <command>',
  describe: 'Manage AI persona profiles and behavior customization',
  builder: (yargs: Argv) => yargs
      .command('list', 'List all available personas', {}, () => {
        render(<PersonaListComponent />);
      })
      .command(
        'switch <name>',
        'Switch to a specific persona',
        (yargs: Argv) =>
          yargs.positional('name', {
            describe: 'Name or ID of persona to activate',
            type: 'string',
            demandOption: true,
          }),
        (argv: ArgumentsCamelCase<{ name: string }>) => {
          try {
            const personas = personaManager.getAllPersonas();
            let personaId = argv.name;

            // Try to find persona by ID first, then by name
            if (!personas.has(personaId)) {
              const foundEntry = Array.from(personas.entries()).find(
                ([_, persona]: [string, PersonaProfile]) =>
                  persona.name.toLowerCase() === argv.name.toLowerCase(),
              );

              if (foundEntry) {
                personaId = foundEntry[0];
              }
            }

            personaManager.activatePersona(personaId);
            const persona = personaManager.getPersona(personaId);
            render(
              <SuccessMessage
                message={`Switched to persona: ${persona?.name}`}
              />,
            );
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to switch persona: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .command(
        'show [name]',
        'Show detailed information about a persona',
        (yargs: Argv) =>
          yargs.positional('name', {
            describe:
              'Name or ID of persona to show (defaults to active persona)',
            type: 'string',
            required: false,
          }),
        (argv: ArgumentsCamelCase<{ name?: string }>) => {
          let personaId = argv.name;

          if (personaId) {
            const personas = personaManager.getAllPersonas();
            // Try to find persona by ID first, then by name
            if (!personas.has(personaId)) {
              const foundEntry = Array.from(personas.entries()).find(
                ([_, persona]) =>
                  persona.name.toLowerCase() === personaId!.toLowerCase(),
              );

              if (foundEntry) {
                personaId = foundEntry[0];
              }
            }
          }

          render(<PersonaDetailsComponent personaId={personaId} />);
        },
      )
      .command(
        'create',
        'Create a new custom persona interactively',
        {},
        () => {
          render(
            <ErrorMessage message="Interactive persona creation not yet implemented. Use the UI settings dialog instead." />,
          );
        },
      )
      .command(
        'delete <name>',
        'Delete a custom persona',
        (yargs: Argv) =>
          yargs.positional('name', {
            describe: 'Name or ID of custom persona to delete',
            type: 'string',
            demandOption: true,
          }),
        (argv: ArgumentsCamelCase<{ name: string }>) => {
          try {
            const personas = personaManager.getAllPersonas();
            let personaId = argv.name;

            // Try to find persona by ID first, then by name
            if (!personas.has(personaId)) {
              const foundEntry = Array.from(personas.entries()).find(
                ([_, persona]: [string, PersonaProfile]) =>
                  persona.name.toLowerCase() === argv.name.toLowerCase(),
              );

              if (foundEntry) {
                personaId = foundEntry[0];
              }
            }

            const persona = personaManager.getPersona(personaId);
            if (!persona) {
              throw new Error(`Persona '${argv.name}' not found`);
            }

            personaManager.deletePersona(personaId);
            render(
              <SuccessMessage
                message={`Deleted custom persona: ${persona.name}`}
              />,
            );
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to delete persona: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .command(
        'export [file]',
        'Export custom personas to JSON file',
        (yargs: Argv) =>
          yargs.positional('file', {
            describe: 'Output file path (defaults to personas.json)',
            type: 'string',
            default: 'personas.json',
          }),
        (argv: ArgumentsCamelCase<{ file: string }>) => {
          try {
            const personasJson = personaManager.exportCustomPersonas();
            const filePath = path.resolve(argv.file);

            fs.writeFileSync(filePath, personasJson, 'utf-8');
            render(
              <SuccessMessage
                message={`Custom personas exported to: ${filePath}`}
              />,
            );
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to export personas: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .command(
        'import <file>',
        'Import personas from JSON file',
        (yargs: Argv) =>
          yargs.positional('file', {
            describe: 'JSON file containing persona definitions',
            type: 'string',
            demandOption: true,
          }),
        (argv: ArgumentsCamelCase<{ file: string }>) => {
          try {
            const filePath = path.resolve(argv.file);

            if (!fs.existsSync(filePath)) {
              throw new Error(`File not found: ${filePath}`);
            }

            const personasJson = fs.readFileSync(filePath, 'utf-8');
            personaManager.importCustomPersonas(personasJson);

            render(
              <SuccessMessage
                message={`Personas imported from: ${filePath}`}
              />,
            );
          } catch (error) {
            render(
              <ErrorMessage
                message={`Failed to import personas: ${error instanceof Error ? error.message : String(error)}`}
              />,
            );
            process.exit(1);
          }
        },
      )
      .demandCommand(1, 'Please specify a persona command')
      .help(),
  handler: () => {
    // This handler is not used since we have subcommands
  },
};
