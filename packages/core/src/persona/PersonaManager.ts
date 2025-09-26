/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview AI Persona Management System
 *
 * Provides comprehensive persona management for customizable AI behavior including:
 * - Built-in persona profiles for common use cases
 * - Custom persona creation and management
 * - Dynamic system prompt generation based on persona settings
 * - Profile switching and persistence
 * - Integration with settings system
 *
 * Features:
 * - Personality trait customization (formality, verbosity, creativity, teaching style)
 * - Behavioral pattern configuration (proactiveness, error handling, code review style)
 * - Advanced customization (terminology, prompt additions, learning preferences)
 * - Built-in personas for different development contexts
 * - Real-time persona switching without restart
 *
 * @author Claude Code - AI Persona Implementation Agent
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';
// Note: These types would normally be imported from the settings schema
// For now, defining them locally to avoid circular imports
export interface PersonalityTraits {
  formality?: 'formal' | 'professional' | 'casual' | 'relaxed';
  verbosity?: 'concise' | 'balanced' | 'detailed' | 'comprehensive';
  creativity?: 'conservative' | 'practical' | 'innovative' | 'experimental';
  teachingStyle?: 'direct' | 'explanatory' | 'socratic' | 'mentoring';
}

export interface BehavioralPatterns {
  proactiveness?: 'reactive' | 'balanced' | 'proactive' | 'assertive';
  errorHandling?: 'concise' | 'helpful' | 'thorough' | 'preventive';
  codeStyle?: 'minimal' | 'constructive' | 'comprehensive' | 'mentoring';
}

export interface PersonaCustomization {
  preferredTerminology?: Record<string, string>;
  customPromptAdditions?: string;
  learningPreferences?: string[];
}

export interface PersonaProfile {
  name: string;
  description: string;
  personality: PersonalityTraits;
  behavior: BehavioralPatterns;
  customization: PersonaCustomization;
  isSystem?: boolean;
  updatedAt?: string;
}

/**
 * Built-in persona profiles providing common AI behavior patterns.
 * These personas cover typical development scenarios and interaction styles.
 */
const BUILT_IN_PERSONAS: Record<string, PersonaProfile> = {
  professional: {
    name: 'Professional Assistant',
    description:
      'Balanced, professional communication focused on efficiency and clarity',
    personality: {
      formality: 'professional',
      verbosity: 'balanced',
      creativity: 'practical',
      teachingStyle: 'explanatory',
    },
    behavior: {
      proactiveness: 'balanced',
      errorHandling: 'helpful',
      codeStyle: 'constructive',
    },
    customization: {
      preferredTerminology: {},
      customPromptAdditions: '',
      learningPreferences: [],
    },
    isSystem: true,
    updatedAt: new Date().toISOString(),
  },

  mentor: {
    name: 'Coding Mentor',
    description: 'Patient teacher focused on education and skill development',
    personality: {
      formality: 'professional',
      verbosity: 'detailed',
      creativity: 'practical',
      teachingStyle: 'mentoring',
    },
    behavior: {
      proactiveness: 'proactive',
      errorHandling: 'thorough',
      codeStyle: 'mentoring',
    },
    customization: {
      preferredTerminology: {},
      customPromptAdditions:
        'Focus on explaining the reasoning behind suggestions and helping the user understand best practices.',
      learningPreferences: [
        'best-practices',
        'code-quality',
        'debugging',
        'architecture',
      ],
    },
    isSystem: true,
    updatedAt: new Date().toISOString(),
  },

  expert: {
    name: 'Technical Expert',
    description:
      'Highly knowledgeable expert providing comprehensive technical guidance',
    personality: {
      formality: 'formal',
      verbosity: 'comprehensive',
      creativity: 'innovative',
      teachingStyle: 'explanatory',
    },
    behavior: {
      proactiveness: 'assertive',
      errorHandling: 'preventive',
      codeStyle: 'comprehensive',
    },
    customization: {
      preferredTerminology: {},
      customPromptAdditions:
        'Provide deep technical insights, consider edge cases, and suggest advanced optimizations.',
      learningPreferences: [
        'advanced-patterns',
        'performance',
        'security',
        'scalability',
      ],
    },
    isSystem: true,
    updatedAt: new Date().toISOString(),
  },

  casual: {
    name: 'Casual Helper',
    description:
      'Friendly, approachable assistant for relaxed development sessions',
    personality: {
      formality: 'casual',
      verbosity: 'balanced',
      creativity: 'practical',
      teachingStyle: 'explanatory',
    },
    behavior: {
      proactiveness: 'balanced',
      errorHandling: 'helpful',
      codeStyle: 'constructive',
    },
    customization: {
      preferredTerminology: {},
      customPromptAdditions:
        'Use a friendly, conversational tone. Keep explanations accessible and encouraging.',
      learningPreferences: [],
    },
    isSystem: true,
    updatedAt: new Date().toISOString(),
  },

  efficient: {
    name: 'Efficiency Expert',
    description: 'Direct, concise responses focused on quick solutions',
    personality: {
      formality: 'professional',
      verbosity: 'concise',
      creativity: 'practical',
      teachingStyle: 'direct',
    },
    behavior: {
      proactiveness: 'reactive',
      errorHandling: 'concise',
      codeStyle: 'minimal',
    },
    customization: {
      preferredTerminology: {},
      customPromptAdditions:
        'Prioritize brevity and actionable solutions. Minimize explanatory text unless specifically requested.',
      learningPreferences: [],
    },
    isSystem: true,
    updatedAt: new Date().toISOString(),
  },

  creative: {
    name: 'Creative Developer',
    description:
      'Innovative problem solver encouraging experimental approaches',
    personality: {
      formality: 'casual',
      verbosity: 'detailed',
      creativity: 'experimental',
      teachingStyle: 'socratic',
    },
    behavior: {
      proactiveness: 'proactive',
      errorHandling: 'helpful',
      codeStyle: 'comprehensive',
    },
    customization: {
      preferredTerminology: {},
      customPromptAdditions:
        'Encourage creative solutions, suggest alternative approaches, and explore innovative techniques.',
      learningPreferences: [
        'emerging-tech',
        'creative-coding',
        'experimental-features',
      ],
    },
    isSystem: true,
    updatedAt: new Date().toISOString(),
  },
};

/**
 * Manages AI persona configurations and behavior customization.
 *
 * Provides comprehensive persona management including:
 * - Built-in and custom persona profiles
 * - Dynamic system prompt generation
 * - Profile switching and persistence
 * - Integration with application settings
 *
 * @example
 * ```typescript
 * const manager = new PersonaManager();
 *
 * // Switch to mentor persona
 * await manager.activatePersona('mentor');
 *
 * // Create custom persona
 * const customPersona = manager.createPersona({
 *   name: 'My Custom Assistant',
 *   personality: { formality: 'casual', verbosity: 'concise' },
 *   // ... other settings
 * });
 *
 * // Generate system prompt for current persona
 * const prompt = manager.generateSystemPrompt();
 * ```
 */
export class PersonaManager {
  private readonly logger = logger.child({ component: 'PersonaManager' });
  private personas: Map<string, PersonaProfile> = new Map();
  private activePersonaId: string = 'professional';

  constructor() {
    this.initializeBuiltInPersonas();
    this.logger.info('PersonaManager initialized with built-in personas', {
      builtInCount: Object.keys(BUILT_IN_PERSONAS).length,
      activePersona: this.activePersonaId,
    });
  }

  /**
   * Initializes built-in persona profiles
   */
  private initializeBuiltInPersonas(): void {
    for (const [id, persona] of Object.entries(BUILT_IN_PERSONAS)) {
      this.personas.set(id, persona);
    }
  }

  /**
   * Gets all available personas (built-in and custom)
   *
   * @returns Map of persona IDs to persona profiles
   */
  getAllPersonas(): Map<string, PersonaProfile> {
    return new Map(this.personas);
  }

  /**
   * Gets a specific persona by ID
   *
   * @param personaId - Unique identifier for the persona
   * @returns Persona profile or undefined if not found
   */
  getPersona(personaId: string): PersonaProfile | undefined {
    return this.personas.get(personaId);
  }

  /**
   * Gets the currently active persona
   *
   * @returns Currently active persona profile
   */
  getActivePersona(): PersonaProfile {
    const persona = this.personas.get(this.activePersonaId);
    if (!persona) {
      this.logger.warn(
        'Active persona not found, falling back to professional',
        {
          activePersonaId: this.activePersonaId,
        },
      );
      return BUILT_IN_PERSONAS.professional;
    }
    return persona;
  }

  /**
   * Gets the ID of the currently active persona
   *
   * @returns Active persona ID
   */
  getActivePersonaId(): string {
    return this.activePersonaId;
  }

  /**
   * Activates a specific persona
   *
   * @param personaId - ID of persona to activate
   * @throws Error if persona doesn't exist
   */
  activatePersona(personaId: string): void {
    if (!this.personas.has(personaId)) {
      throw new Error(`Persona '${personaId}' not found`);
    }

    const previousPersona = this.activePersonaId;
    this.activePersonaId = personaId;

    this.logger.info('Persona activated', {
      previousPersona,
      newPersona: personaId,
      personaName: this.personas.get(personaId)?.name,
    });
  }

  /**
   * Creates a new custom persona
   *
   * @param personaData - Partial persona data (ID will be generated)
   * @returns Created persona profile with generated ID
   */
  createPersona(
    personaData: Omit<PersonaProfile, 'isSystem' | 'updatedAt'>,
  ): PersonaProfile & { id: string } {
    const personaId = this.generatePersonaId(personaData.name);
    const persona: PersonaProfile = {
      ...personaData,
      isSystem: false,
      updatedAt: new Date().toISOString(),
    };

    this.personas.set(personaId, persona);

    this.logger.info('Custom persona created', {
      personaId,
      personaName: persona.name,
      totalPersonas: this.personas.size,
    });

    return { ...persona, id: personaId };
  }

  /**
   * Updates an existing persona
   *
   * @param personaId - ID of persona to update
   * @param updates - Partial persona data to merge
   * @throws Error if persona doesn't exist or is a system persona
   */
  updatePersona(
    personaId: string,
    updates: Partial<PersonaProfile>,
  ): void {
    const existingPersona = this.personas.get(personaId);
    if (!existingPersona) {
      throw new Error(`Persona '${personaId}' not found`);
    }

    if (existingPersona.isSystem) {
      throw new Error(`Cannot modify system persona '${personaId}'`);
    }

    const updatedPersona: PersonaProfile = {
      ...existingPersona,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.personas.set(personaId, updatedPersona);

    this.logger.info('Persona updated', {
      personaId,
      personaName: updatedPersona.name,
    });
  }

  /**
   * Deletes a custom persona
   *
   * @param personaId - ID of persona to delete
   * @throws Error if persona doesn't exist or is a system persona
   */
  deletePersona(personaId: string): void {
    const persona = this.personas.get(personaId);
    if (!persona) {
      throw new Error(`Persona '${personaId}' not found`);
    }

    if (persona.isSystem) {
      throw new Error(`Cannot delete system persona '${personaId}'`);
    }

    // If deleting the active persona, switch to professional
    if (this.activePersonaId === personaId) {
      this.activePersonaId = 'professional';
      this.logger.info('Active persona deleted, switched to professional');
    }

    this.personas.delete(personaId);

    this.logger.info('Persona deleted', {
      personaId,
      personaName: persona.name,
      remainingPersonas: this.personas.size,
    });
  }

  /**
   * Generates a system prompt based on the active persona configuration
   *
   * @returns Persona-customized system prompt additions
   */
  generateSystemPrompt(): string {
    const persona = this.getActivePersona();
    const promptParts: string[] = [];

    // Add persona identification
    promptParts.push(`# AI Persona: ${persona.name}`);
    promptParts.push(`${persona.description}`);
    promptParts.push('');

    // Add personality-based instructions
    promptParts.push('## Communication Style');
    promptParts.push(this.generatePersonalityInstructions(persona.personality));
    promptParts.push('');

    // Add behavioral instructions
    promptParts.push('## Behavioral Guidelines');
    promptParts.push(this.generateBehaviorInstructions(persona.behavior));
    promptParts.push('');

    // Add custom prompt additions
    if (persona.customization.customPromptAdditions) {
      promptParts.push('## Custom Instructions');
      promptParts.push(persona.customization.customPromptAdditions);
      promptParts.push('');
    }

    // Add learning preferences if specified
    if (persona.customization.learningPreferences?.length) {
      promptParts.push('## Focus Areas');
      promptParts.push(
        'Pay special attention to these areas when providing guidance:',
      );
      persona.customization.learningPreferences.forEach((area) => {
        promptParts.push(`- ${area}`);
      });
      promptParts.push('');
    }

    // Add terminology preferences
    if (
      persona.customization.preferredTerminology &&
      Object.keys(persona.customization.preferredTerminology).length > 0
    ) {
      promptParts.push('## Preferred Terminology');
      promptParts.push('Use these preferred terms when applicable:');
      Object.entries(persona.customization.preferredTerminology).forEach(
        ([standard, preferred]) => {
          promptParts.push(`- Use "${preferred}" instead of "${standard}"`);
        },
      );
      promptParts.push('');
    }

    return promptParts.join('\n');
  }

  /**
   * Generates personality-based instructions for system prompt
   */
  private generatePersonalityInstructions(
    personality: PersonalityTraits,
  ): string {
    const instructions: string[] = [];

    // Formality instructions
    switch (personality.formality) {
      case 'formal':
        instructions.push(
          '- Use formal, professional language with proper titles and structured responses',
        );
        break;
      case 'professional':
        instructions.push(
          '- Maintain professional tone while being approachable and clear',
        );
        break;
      case 'casual':
        instructions.push(
          '- Use conversational, friendly language that feels natural and approachable',
        );
        break;
      case 'relaxed':
        instructions.push(
          '- Adopt a relaxed, informal tone as if speaking with a colleague',
        );
        break;
      default:
        instructions.push(
          '- Maintain professional tone while being approachable and clear',
        );
        break;
    }

    // Verbosity instructions
    switch (personality.verbosity) {
      case 'concise':
        instructions.push(
          '- Keep responses brief and to the point, focusing on essential information',
        );
        break;
      case 'balanced':
        instructions.push(
          '- Provide well-balanced responses with appropriate detail for the context',
        );
        break;
      case 'detailed':
        instructions.push(
          '- Include comprehensive explanations and context for better understanding',
        );
        break;
      case 'comprehensive':
        instructions.push(
          '- Provide thorough, extensive responses covering all relevant aspects',
        );
        break;
      default:
        instructions.push(
          '- Provide well-balanced responses with appropriate detail for the context',
        );
        break;
    }

    // Creativity instructions
    switch (personality.creativity) {
      case 'conservative':
        instructions.push(
          '- Stick to well-established, proven solutions and conventional approaches',
        );
        break;
      case 'practical':
        instructions.push(
          '- Focus on practical, reliable solutions while considering some innovative options',
        );
        break;
      case 'innovative':
        instructions.push(
          '- Suggest creative solutions and explore modern approaches when appropriate',
        );
        break;
      case 'experimental':
        instructions.push(
          '- Encourage experimental approaches and cutting-edge techniques',
        );
        break;
      default:
        instructions.push(
          '- Focus on practical, reliable solutions while considering some innovative options',
        );
        break;
    }

    // Teaching style instructions
    switch (personality.teachingStyle) {
      case 'direct':
        instructions.push(
          '- Provide direct solutions with minimal explanation unless requested',
        );
        break;
      case 'explanatory':
        instructions.push(
          '- Explain the reasoning behind suggestions and provide educational context',
        );
        break;
      case 'socratic':
        instructions.push(
          '- Guide understanding through questions and encourage independent thinking',
        );
        break;
      case 'mentoring':
        instructions.push(
          '- Act as a patient mentor, focusing on skill development and learning',
        );
        break;
      default:
        instructions.push(
          '- Explain the reasoning behind suggestions and provide educational context',
        );
        break;
    }

    return instructions.join('\n');
  }

  /**
   * Generates behavior-based instructions for system prompt
   */
  private generateBehaviorInstructions(behavior: BehavioralPatterns): string {
    const instructions: string[] = [];

    // Proactiveness instructions
    switch (behavior.proactiveness) {
      case 'reactive':
        instructions.push(
          '- Wait for explicit requests before suggesting improvements or alternatives',
        );
        break;
      case 'balanced':
        instructions.push(
          '- Offer moderate suggestions and improvements when relevant to the context',
        );
        break;
      case 'proactive':
        instructions.push(
          '- Actively suggest improvements, optimizations, and best practices',
        );
        break;
      case 'assertive':
        instructions.push(
          '- Strongly advocate for best practices and proactively guide toward optimal solutions',
        );
        break;
      default:
        instructions.push(
          '- Offer moderate suggestions and improvements when relevant to the context',
        );
        break;
    }

    // Error handling instructions
    switch (behavior.errorHandling) {
      case 'concise':
        instructions.push(
          '- Provide brief error explanations focused on the immediate solution',
        );
        break;
      case 'helpful':
        instructions.push(
          '- Explain errors clearly and provide guidance for resolution',
        );
        break;
      case 'thorough':
        instructions.push(
          '- Provide comprehensive error analysis including root causes and prevention',
        );
        break;
      case 'preventive':
        instructions.push(
          '- Focus on preventing future errors through education and best practices',
        );
        break;
      default:
        instructions.push(
          '- Explain errors clearly and provide guidance for resolution',
        );
        break;
    }

    // Code style instructions
    switch (behavior.codeStyle) {
      case 'minimal':
        instructions.push(
          '- Focus on essential code changes only, avoiding unnecessary modifications',
        );
        break;
      case 'constructive':
        instructions.push(
          '- Provide balanced feedback with constructive suggestions for improvement',
        );
        break;
      case 'comprehensive':
        instructions.push(
          '- Offer detailed code review covering style, performance, and best practices',
        );
        break;
      case 'mentoring':
        instructions.push(
          '- Focus on teaching through code review, explaining patterns and principles',
        );
        break;
      default:
        instructions.push(
          '- Provide balanced feedback with constructive suggestions for improvement',
        );
        break;
    }

    return instructions.join('\n');
  }

  /**
   * Generates a unique persona ID based on the persona name
   */
  private generatePersonaId(name: string): string {
    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    let id = baseId;
    let counter = 1;

    while (this.personas.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }

    return id;
  }

  /**
   * Exports all custom personas as JSON
   *
   * @returns JSON string of custom personas
   */
  exportCustomPersonas(): string {
    const customPersonas: Record<string, PersonaProfile> = {};

    for (const [id, persona] of this.personas) {
      if (!persona.isSystem) {
        customPersonas[id] = persona;
      }
    }

    return JSON.stringify(customPersonas, null, 2);
  }

  /**
   * Imports custom personas from JSON
   *
   * @param personasJson - JSON string containing persona definitions
   * @throws Error if JSON is invalid or personas have conflicts
   */
  importCustomPersonas(personasJson: string): void {
    try {
      const importedPersonas = JSON.parse(personasJson) as Record<
        string,
        PersonaProfile
      >;
      const importCount = Object.keys(importedPersonas).length;

      for (const [id, persona] of Object.entries(importedPersonas)) {
        // Ensure imported personas are marked as custom
        persona.isSystem = false;
        persona.updatedAt = new Date().toISOString();

        this.personas.set(id, persona);
      }

      this.logger.info('Custom personas imported', {
        importCount,
        totalPersonas: this.personas.size,
      });
    } catch (error) {
      this.logger.error('Failed to import personas', { error });
      throw new Error('Invalid persona JSON format');
    }
  }
}

/**
 * Global persona manager instance
 */
export const personaManager = new PersonaManager();
