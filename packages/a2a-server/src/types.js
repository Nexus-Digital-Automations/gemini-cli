/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Interfaces and enums for the CoderAgent protocol.
export const CoderAgentEvent = {
  /**
   * An event requesting one or more tool call confirmations.
   */
  ToolCallConfirmationEvent: 'tool-call-confirmation',
  /**
   * An event updating on the status of one or more tool calls.
   */
  ToolCallUpdateEvent: 'tool-call-update',
  /**
   * An event providing text updates on the task.
   */
  TextContentEvent: 'text-content',
  /**
   * An event that indicates a change in the task's execution state.
   */
  StateChangeEvent: 'state-change',
  /**
   * An user-sent event to initiate the agent.
   */
  StateAgentSettingsEvent: 'agent-settings',
  /**
   * An event that contains a thought from the agent.
   */
  ThoughtEvent: 'thought',
};
export const METADATA_KEY = '__persistedState';
export function getPersistedState(metadata) {
  return metadata?.[METADATA_KEY];
}
export function setPersistedState(metadata, state) {
  return {
    ...metadata,
    [METADATA_KEY]: state,
  };
}
//# sourceMappingURL=types.js.map
