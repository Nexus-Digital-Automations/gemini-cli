/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
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
export declare class PersonaManager {
    private readonly logger;
    private personas;
    private activePersonaId;
    constructor();
    /**
     * Initializes built-in persona profiles
     */
    private initializeBuiltInPersonas;
    /**
     * Gets all available personas (built-in and custom)
     *
     * @returns Map of persona IDs to persona profiles
     */
    getAllPersonas(): Map<string, PersonaProfile>;
    /**
     * Gets a specific persona by ID
     *
     * @param personaId - Unique identifier for the persona
     * @returns Persona profile or undefined if not found
     */
    getPersona(personaId: string): PersonaProfile | undefined;
    /**
     * Gets the currently active persona
     *
     * @returns Currently active persona profile
     */
    getActivePersona(): PersonaProfile;
    /**
     * Gets the ID of the currently active persona
     *
     * @returns Active persona ID
     */
    getActivePersonaId(): string;
    /**
     * Activates a specific persona
     *
     * @param personaId - ID of persona to activate
     * @throws Error if persona doesn't exist
     */
    activatePersona(personaId: string): void;
    /**
     * Creates a new custom persona
     *
     * @param personaData - Partial persona data (ID will be generated)
     * @returns Created persona profile with generated ID
     */
    createPersona(personaData: Omit<PersonaProfile, 'isSystem' | 'updatedAt'>): PersonaProfile & {
        id: string;
    };
    /**
     * Updates an existing persona
     *
     * @param personaId - ID of persona to update
     * @param updates - Partial persona data to merge
     * @throws Error if persona doesn't exist or is a system persona
     */
    updatePersona(personaId: string, updates: Partial<PersonaProfile>): void;
    /**
     * Deletes a custom persona
     *
     * @param personaId - ID of persona to delete
     * @throws Error if persona doesn't exist or is a system persona
     */
    deletePersona(personaId: string): void;
    /**
     * Generates a system prompt based on the active persona configuration
     *
     * @returns Persona-customized system prompt additions
     */
    generateSystemPrompt(): string;
    /**
     * Generates personality-based instructions for system prompt
     */
    private generatePersonalityInstructions;
    /**
     * Generates behavior-based instructions for system prompt
     */
    private generateBehaviorInstructions;
    /**
     * Generates a unique persona ID based on the persona name
     */
    private generatePersonaId;
    /**
     * Exports all custom personas as JSON
     *
     * @returns JSON string of custom personas
     */
    exportCustomPersonas(): string;
    /**
     * Imports custom personas from JSON
     *
     * @param personasJson - JSON string containing persona definitions
     * @throws Error if JSON is invalid or personas have conflicts
     */
    importCustomPersonas(personasJson: string): void;
}
/**
 * Global persona manager instance
 */
export declare const personaManager: PersonaManager;
