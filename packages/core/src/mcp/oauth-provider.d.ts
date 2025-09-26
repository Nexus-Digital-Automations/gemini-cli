/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { EventEmitter } from 'node:events';
import type { OAuthToken } from './token-storage/types.js';
import type { MCPOAuthTokenStorage } from './oauth-token-storage.js';
export declare const OAUTH_DISPLAY_MESSAGE_EVENT: "oauth-display-message";
/**
 * OAuth configuration for an MCP server.
 *
 * Defines the OAuth 2.0 configuration parameters required for authenticating
 * with MCP (Model Context Protocol) servers that implement OAuth 2.0 authorization.
 *
 * @example
 * ```typescript
 * const config: MCPOAuthConfig = {
 *   enabled: true,
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   authorizationUrl: 'https://auth.example.com/oauth/authorize',
 *   tokenUrl: 'https://auth.example.com/oauth/token',
 *   scopes: ['read', 'write'],
 *   redirectUri: 'http://localhost:7777/oauth/callback'
 * };
 * ```
 */
export interface MCPOAuthConfig {
    enabled?: boolean;
    clientId?: string;
    clientSecret?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    scopes?: string[];
    audiences?: string[];
    redirectUri?: string;
    tokenParamName?: string;
}
/**
 * OAuth authorization response.
 *
 * Contains the authorization code and state parameter returned by the OAuth server
 * after successful user authorization. Used in the authorization code flow.
 */
export interface OAuthAuthorizationResponse {
    code: string;
    state: string;
}
/**
 * OAuth token response from the authorization server.
 *
 * Standard OAuth 2.0 token response containing access token and optional refresh token.
 * Follows RFC 6749 specification for token endpoint responses.
 */
export interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
}
/**
 * Dynamic client registration request.
 *
 * Follows RFC 7591 for OAuth 2.0 Dynamic Client Registration Protocol.
 * Used to register OAuth clients dynamically with authorization servers.
 */
export interface OAuthClientRegistrationRequest {
    client_name: string;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    token_endpoint_auth_method: string;
    code_challenge_method?: string[];
    scope?: string;
}
/**
 * Dynamic client registration response.
 *
 * Response from dynamic client registration endpoint containing the registered
 * client credentials and metadata. Follows RFC 7591 specification.
 */
export interface OAuthClientRegistrationResponse {
    client_id: string;
    client_secret?: string;
    client_id_issued_at?: number;
    client_secret_expires_at?: number;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    token_endpoint_auth_method: string;
    code_challenge_method?: string[];
    scope?: string;
}
/**
 * Provider for handling OAuth authentication for MCP servers.
 *
 * This class implements a complete OAuth 2.0 authorization flow with PKCE
 * for secure authentication with MCP (Model Context Protocol) servers.
 * It supports:
 *
 * - OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636)
 * - Dynamic Client Registration (RFC 7591)
 * - OAuth 2.0 Server Metadata Discovery (RFC 8414)
 * - Token refresh and management
 * - MCP-specific resource parameter handling
 * - Local callback server for authorization code capture
 *
 * The provider handles the complete authentication lifecycle from initial
 * authorization through token refresh, with secure token storage and
 * automatic discovery of OAuth configuration from MCP servers.
 *
 * @example
 * ```typescript
 * const provider = new MCPOAuthProvider();
 * const token = await provider.authenticate(
 *   'my-mcp-server',
 *   {
 *     clientId: 'your-client-id',
 *     authorizationUrl: 'https://auth.example.com/oauth/authorize',
 *     tokenUrl: 'https://auth.example.com/oauth/token'
 *   },
 *   'https://mcp.example.com/api',
 *   eventEmitter
 * );
 * ```
 */
export declare class MCPOAuthProvider {
    private readonly tokenStorage;
    constructor(tokenStorage?: MCPOAuthTokenStorage);
    /**
     * Register a client dynamically with the OAuth server.
     *
     * Implements RFC 7591 Dynamic Client Registration Protocol to automatically
     * register the Gemini CLI as an OAuth client with the authorization server.
     * This eliminates the need for manual client registration in many cases.
     *
     * @param registrationUrl - The client registration endpoint URL
     * @param config - OAuth configuration with scopes and redirect URI
     * @returns Promise resolving to the registered client information
     * @throws {Error} When registration fails or server returns an error
     * @private
     */
    private registerClient;
    /**
     * Discover OAuth configuration from an MCP server URL.
     *
     * Attempts to discover OAuth 2.0 configuration from an MCP server using
     * standard discovery mechanisms including .well-known endpoints and
     * server metadata responses.
     *
     * @param mcpServerUrl - The MCP server URL to discover OAuth config from
     * @returns Promise resolving to OAuth configuration if discovered, null otherwise
     * @private
     */
    private discoverOAuthFromMCPServer;
    /**
     * Generate PKCE parameters for OAuth flow.
     *
     * Creates cryptographically secure PKCE parameters following RFC 7636:
     * - Code verifier: 43-128 character random string
     * - Code challenge: SHA256 hash of verifier, base64url encoded
     * - State: Random string for CSRF protection
     *
     * @returns PKCE parameters including code verifier, challenge, and state
     * @private
     */
    private generatePKCEParams;
    /**
     * Start a local HTTP server to handle OAuth callback.
     *
     * Creates a temporary HTTP server on localhost to receive the OAuth
     * authorization callback. Validates the state parameter to prevent
     * CSRF attacks and extracts the authorization code.
     *
     * @param expectedState - The state parameter to validate against CSRF attacks
     * @returns Promise that resolves with the authorization code and state
     * @throws {Error} When callback times out, state mismatches, or OAuth error occurs
     * @private
     */
    private startCallbackServer;
    /**
     * Build the authorization URL with PKCE parameters.
     *
     * Constructs the OAuth 2.0 authorization URL with all required parameters
     * including PKCE challenge, scopes, and MCP-specific resource parameter.
     * The resource parameter indicates which MCP server the token will be used for.
     *
     * @param config - OAuth configuration with client ID and scopes
     * @param pkceParams - PKCE parameters for secure authorization
     * @param mcpServerUrl - Optional MCP server URL to include as resource parameter
     * @returns The complete authorization URL for user redirection
     * @private
     */
    private buildAuthorizationUrl;
    /**
     * Exchange authorization code for tokens.
     *
     * Implements the OAuth 2.0 authorization code exchange flow with PKCE.
     * Sends the authorization code and code verifier to the token endpoint
     * to receive access and refresh tokens.
     *
     * @param config - OAuth configuration with client credentials
     * @param code - Authorization code received from callback
     * @param codeVerifier - PKCE code verifier for security validation
     * @param mcpServerUrl - Optional MCP server URL for resource parameter
     * @returns Promise resolving to the token response
     * @throws {Error} When token exchange fails or returns an error
     * @private
     */
    private exchangeCodeForToken;
    /**
     * Refresh an access token using a refresh token.
     *
     * Implements OAuth 2.0 refresh token flow to obtain new access tokens
     * when the current token expires. Maintains the same scopes and audience
     * as the original token grant.
     *
     * @param config - OAuth configuration with client credentials
     * @param refreshToken - The refresh token to use for obtaining new access token
     * @param tokenUrl - The token endpoint URL for refresh requests
     * @param mcpServerUrl - Optional MCP server URL for resource parameter
     * @returns Promise resolving to the new token response
     * @throws {Error} When token refresh fails or refresh token is invalid
     */
    refreshAccessToken(config: MCPOAuthConfig, refreshToken: string, tokenUrl: string, mcpServerUrl?: string): Promise<OAuthTokenResponse>;
    /**
     * Perform the full OAuth authorization code flow with PKCE.
     *
     * This is the main entry point for OAuth authentication. It orchestrates
     * the complete flow including:
     * - OAuth configuration discovery from MCP servers
     * - Dynamic client registration if no client ID provided
     * - PKCE parameter generation for security
     * - Browser-based user authorization
     * - Authorization code exchange for tokens
     * - Secure token storage
     *
     * The method handles both standard OAuth flows and MCP-specific extensions,
     * including automatic discovery of OAuth endpoints from MCP server metadata.
     *
     * @param serverName - The name of the MCP server for token storage
     * @param config - OAuth configuration (may be partial for discovery)
     * @param mcpServerUrl - Optional MCP server URL for OAuth discovery and resource parameter
     * @param events - Optional event emitter for displaying user messages
     * @returns Promise resolving to the obtained OAuth token
     * @throws {Error} When authentication fails at any stage
     *
     * @example
     * ```typescript
     * const token = await provider.authenticate(
     *   'github-mcp',
     *   { clientId: 'abc123' },
     *   'https://api.github.com/mcp',
     *   eventEmitter
     * );
     * ```
     */
    authenticate(serverName: string, config: MCPOAuthConfig, mcpServerUrl?: string, events?: EventEmitter): Promise<OAuthToken>;
    /**
     * Get a valid access token for an MCP server, refreshing if necessary.
     *
     * Retrieves a stored access token and validates its expiration status.
     * If the token is expired but a refresh token is available, automatically
     * refreshes the token and updates storage. Returns null if no valid
     * authentication exists.
     *
     * @param serverName - The name of the MCP server to get token for
     * @param config - OAuth configuration with client credentials for refresh
     * @returns Promise resolving to valid access token or null if not authenticated
     *
     * @example
     * ```typescript
     * const token = await provider.getValidToken('my-server', config);
     * if (token) {
     *   // Use token for authenticated requests
     *   headers.Authorization = `Bearer ${token}`;
     * }
     * ```
     */
    getValidToken(serverName: string, config: MCPOAuthConfig): Promise<string | null>;
}
