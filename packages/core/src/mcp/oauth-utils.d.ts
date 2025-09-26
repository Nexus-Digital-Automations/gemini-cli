/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPOAuthConfig } from './oauth-provider.js';
/**
 * OAuth authorization server metadata as per RFC 8414.
 *
 * Defines the standard metadata endpoints and capabilities published by an
 * OAuth 2.0 authorization server for automatic discovery.
 */
export interface OAuthAuthorizationServerMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    token_endpoint_auth_methods_supported?: string[];
    revocation_endpoint?: string;
    revocation_endpoint_auth_methods_supported?: string[];
    registration_endpoint?: string;
    response_types_supported?: string[];
    grant_types_supported?: string[];
    code_challenge_methods_supported?: string[];
    scopes_supported?: string[];
}
/**
 * OAuth protected resource metadata as per RFC 9728.
 *
 * Defines metadata published by OAuth 2.0 protected resources to facilitate
 * automatic discovery of authorization server relationships and supported methods.
 */
export interface OAuthProtectedResourceMetadata {
    resource: string;
    authorization_servers?: string[];
    bearer_methods_supported?: string[];
    resource_documentation?: string;
    resource_signing_alg_values_supported?: string[];
    resource_encryption_alg_values_supported?: string[];
    resource_encryption_enc_values_supported?: string[];
}
/**
 * Utility class for common OAuth operations.
 *
 * Provides a comprehensive set of utilities for OAuth 2.0 discovery, metadata
 * parsing, and configuration management. Implements multiple RFC specifications:
 *
 * - RFC 8414: OAuth 2.0 Authorization Server Metadata
 * - RFC 9728: OAuth 2.0 Protected Resource Metadata
 * - RFC 6750: OAuth 2.0 Bearer Token Usage (WWW-Authenticate parsing)
 * - OpenID Connect Discovery 1.0
 *
 * The class handles various discovery patterns including:
 * - Standard well-known endpoint discovery
 * - Path-based discovery for servers with non-root endpoints
 * - WWW-Authenticate header-based discovery
 * - MCP-specific resource parameter handling
 *
 * @example
 * ```typescript
 * // Discover OAuth config from an MCP server
 * const config = await OAuthUtils.discoverOAuthConfig('https://api.example.com/mcp');
 *
 * // Parse authentication requirements from response headers
 * const headerConfig = await OAuthUtils.discoverOAuthFromWWWAuthenticate(wwwAuthHeader);
 * ```
 */
export declare class OAuthUtils {
    /**
     * Construct well-known OAuth endpoint URLs.
     *
     * Generates standard OAuth discovery URLs following RFC 8414 and OpenID Connect
     * Discovery specifications. Supports both root-based and path-based discovery
     * patterns for servers with non-standard endpoint structures.
     *
     * @param baseUrl - The base server URL to construct endpoints for
     * @param includePathSuffix - Whether to append the URL path to well-known endpoints
     * @returns Object containing protected resource and authorization server URLs
     * @static
     */
    static buildWellKnownUrls(baseUrl: string, includePathSuffix?: boolean): {
        protectedResource: string;
        authorizationServer: string;
    };
    /**
     * Fetch OAuth protected resource metadata.
     *
     * Retrieves RFC 9728 protected resource metadata from the specified endpoint.
     * This metadata describes the authorization servers and methods supported
     * by the protected resource.
     *
     * @param resourceMetadataUrl - The protected resource metadata URL
     * @returns Promise resolving to metadata or null if not available
     * @static
     */
    static fetchProtectedResourceMetadata(resourceMetadataUrl: string): Promise<OAuthProtectedResourceMetadata | null>;
    /**
     * Fetch OAuth authorization server metadata.
     *
     * Retrieves RFC 8414 authorization server metadata containing endpoint URLs,
     * supported grant types, and other capabilities. Used for automatic OAuth
     * configuration discovery.
     *
     * @param authServerMetadataUrl - The authorization server metadata URL
     * @returns Promise resolving to metadata or null if not available
     * @static
     */
    static fetchAuthorizationServerMetadata(authServerMetadataUrl: string): Promise<OAuthAuthorizationServerMetadata | null>;
    /**
     * Convert authorization server metadata to OAuth configuration.
     *
     * Transforms RFC 8414 authorization server metadata into the internal
     * OAuth configuration format used by the MCP OAuth provider.
     *
     * @param metadata - The authorization server metadata to convert
     * @returns The OAuth configuration with endpoint URLs and supported scopes
     * @static
     */
    static metadataToOAuthConfig(metadata: OAuthAuthorizationServerMetadata): MCPOAuthConfig;
    /**
     * Discover OAuth Authorization server metadata given an Auth server URL.
     *
     * Attempts to discover authorization server metadata by trying multiple
     * well-known endpoint patterns in order of preference:
     * 1. Path-based discovery (for servers with path components)
     * 2. Root-based RFC 8414 discovery
     * 3. Root-based OpenID Connect Discovery
     *
     * @param authServerUrl - The authorization server URL to discover metadata for
     * @returns Promise resolving to metadata or null if not found
     * @static
     */
    static discoverAuthorizationServerMetadata(authServerUrl: string): Promise<OAuthAuthorizationServerMetadata | null>;
    /**
     * Discover OAuth configuration using the standard well-known endpoints.
     *
     * Implements a comprehensive discovery strategy that tries multiple approaches:
     * 1. Protected resource metadata discovery (RFC 9728)
     * 2. Authorization server metadata discovery (RFC 8414)
     * 3. Path-based discovery for non-standard server layouts
     * 4. Fallback to direct authorization server discovery
     *
     * @param serverUrl - The base URL of the server to discover OAuth config for
     * @returns Promise resolving to discovered OAuth configuration or null
     * @static
     */
    static discoverOAuthConfig(serverUrl: string): Promise<MCPOAuthConfig | null>;
    /**
     * Parse WWW-Authenticate header to extract OAuth information.
     *
     * Extracts the resource_metadata URI from a Bearer WWW-Authenticate header
     * as specified in RFC 6750. This URI points to the protected resource metadata.
     *
     * @param header - The WWW-Authenticate header value to parse
     * @returns The resource metadata URI if found, null otherwise
     * @static
     */
    static parseWWWAuthenticateHeader(header: string): string | null;
    /**
     * Discover OAuth configuration from WWW-Authenticate header.
     *
     * Uses the resource_metadata URI from a WWW-Authenticate header to discover
     * OAuth configuration. This follows the pattern where protected resources
     * advertise their authorization requirements via response headers.
     *
     * @param wwwAuthenticate - The WWW-Authenticate header value
     * @returns Promise resolving to discovered OAuth configuration or null
     * @static
     */
    static discoverOAuthFromWWWAuthenticate(wwwAuthenticate: string): Promise<MCPOAuthConfig | null>;
    /**
     * Extract base URL from an MCP server URL.
     *
     * Extracts the protocol and host portions of a URL, removing path and
     * query components. Used for constructing well-known discovery endpoints.
     *
     * @param mcpServerUrl - The MCP server URL to extract base from
     * @returns The base URL (protocol + host)
     * @static
     */
    static extractBaseUrl(mcpServerUrl: string): string;
    /**
     * Check if a URL is an SSE (Server-Sent Events) endpoint.
     *
     * Determines if a URL appears to be a Server-Sent Events endpoint based
     * on common URL patterns. SSE endpoints may require different content-type
     * headers for proper OAuth discovery.
     *
     * @param url - The URL to check for SSE characteristics
     * @returns True if the URL appears to be an SSE endpoint
     * @static
     */
    static isSSEEndpoint(url: string): boolean;
    /**
     * Build a resource parameter for OAuth requests.
     *
     * Constructs the resource parameter value for MCP OAuth flows. The resource
     * parameter indicates which protected resource the access token will be used
     * for, enabling resource-specific token scoping.
     *
     * @param endpointUrl - The endpoint URL to build resource parameter for
     * @returns The resource parameter value (protocol + host)
     * @static
     */
    static buildResourceParameter(endpointUrl: string): string;
}
