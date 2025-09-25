/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getErrorMessage } from '../utils/errors.js';
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
export class OAuthUtils {
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
    static buildWellKnownUrls(baseUrl, includePathSuffix = false) {
        const serverUrl = new URL(baseUrl);
        const base = `${serverUrl.protocol}//${serverUrl.host}`;
        if (!includePathSuffix) {
            // Standard discovery: use root-based well-known URLs
            return {
                protectedResource: new URL('/.well-known/oauth-protected-resource', base).toString(),
                authorizationServer: new URL('/.well-known/oauth-authorization-server', base).toString(),
            };
        }
        // Path-based discovery: append path suffix to well-known URLs
        const pathSuffix = serverUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
        return {
            protectedResource: new URL(`/.well-known/oauth-protected-resource${pathSuffix}`, base).toString(),
            authorizationServer: new URL(`/.well-known/oauth-authorization-server${pathSuffix}`, base).toString(),
        };
    }
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
    static async fetchProtectedResourceMetadata(resourceMetadataUrl) {
        try {
            const response = await fetch(resourceMetadataUrl);
            if (!response.ok) {
                return null;
            }
            return (await response.json());
        }
        catch (error) {
            console.debug(`Failed to fetch protected resource metadata from ${resourceMetadataUrl}: ${getErrorMessage(error)}`);
            return null;
        }
    }
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
    static async fetchAuthorizationServerMetadata(authServerMetadataUrl) {
        try {
            const response = await fetch(authServerMetadataUrl);
            if (!response.ok) {
                return null;
            }
            return (await response.json());
        }
        catch (error) {
            console.debug(`Failed to fetch authorization server metadata from ${authServerMetadataUrl}: ${getErrorMessage(error)}`);
            return null;
        }
    }
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
    static metadataToOAuthConfig(metadata) {
        return {
            authorizationUrl: metadata.authorization_endpoint,
            tokenUrl: metadata.token_endpoint,
            scopes: metadata.scopes_supported || [],
        };
    }
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
    static async discoverAuthorizationServerMetadata(authServerUrl) {
        const authServerUrlObj = new URL(authServerUrl);
        const base = `${authServerUrlObj.protocol}//${authServerUrlObj.host}`;
        const endpointsToTry = [];
        // With issuer URLs with path components, try the following well-known
        // endpoints in order:
        if (authServerUrlObj.pathname !== '/') {
            // 1. OAuth 2.0 Authorization Server Metadata with path insertion
            endpointsToTry.push(new URL(`/.well-known/oauth-authorization-server${authServerUrlObj.pathname}`, base).toString());
            // 2. OpenID Connect Discovery 1.0 with path insertion
            endpointsToTry.push(new URL(`/.well-known/openid-configuration${authServerUrlObj.pathname}`, base).toString());
            // 3. OpenID Connect Discovery 1.0 with path appending
            endpointsToTry.push(new URL(`${authServerUrlObj.pathname}/.well-known/openid-configuration`, base).toString());
        }
        // With issuer URLs without path components, and those that failed previous
        // discoveries, try the following well-known endpoints in order:
        // 1. OAuth 2.0 Authorization Server Metadata
        endpointsToTry.push(new URL('/.well-known/oauth-authorization-server', base).toString());
        // 2. OpenID Connect Discovery 1.0
        endpointsToTry.push(new URL('/.well-known/openid-configuration', base).toString());
        for (const endpoint of endpointsToTry) {
            const authServerMetadata = await this.fetchAuthorizationServerMetadata(endpoint);
            if (authServerMetadata) {
                return authServerMetadata;
            }
        }
        console.debug(`Metadata discovery failed for authorization server ${authServerUrl}`);
        return null;
    }
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
    static async discoverOAuthConfig(serverUrl) {
        try {
            // First try standard root-based discovery
            const wellKnownUrls = this.buildWellKnownUrls(serverUrl, false);
            // Try to get the protected resource metadata at root
            let resourceMetadata = await this.fetchProtectedResourceMetadata(wellKnownUrls.protectedResource);
            // If root discovery fails and we have a path, try path-based discovery
            if (!resourceMetadata) {
                const url = new URL(serverUrl);
                if (url.pathname && url.pathname !== '/') {
                    const pathBasedUrls = this.buildWellKnownUrls(serverUrl, true);
                    resourceMetadata = await this.fetchProtectedResourceMetadata(pathBasedUrls.protectedResource);
                }
            }
            if (resourceMetadata?.authorization_servers?.length) {
                // Use the first authorization server
                const authServerUrl = resourceMetadata.authorization_servers[0];
                const authServerMetadata = await this.discoverAuthorizationServerMetadata(authServerUrl);
                if (authServerMetadata) {
                    const config = this.metadataToOAuthConfig(authServerMetadata);
                    if (authServerMetadata.registration_endpoint) {
                        console.log('Dynamic client registration is supported at:', authServerMetadata.registration_endpoint);
                    }
                    return config;
                }
            }
            // Fallback: try well-known endpoints at the base URL
            console.debug(`Trying OAuth discovery fallback at ${serverUrl}`);
            const authServerMetadata = await this.discoverAuthorizationServerMetadata(serverUrl);
            if (authServerMetadata) {
                const config = this.metadataToOAuthConfig(authServerMetadata);
                if (authServerMetadata.registration_endpoint) {
                    console.log('Dynamic client registration is supported at:', authServerMetadata.registration_endpoint);
                }
                return config;
            }
            return null;
        }
        catch (error) {
            console.debug(`Failed to discover OAuth configuration: ${getErrorMessage(error)}`);
            return null;
        }
    }
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
    static parseWWWAuthenticateHeader(header) {
        // Parse Bearer realm and resource_metadata
        const match = header.match(/resource_metadata="([^"]+)"/);
        if (match) {
            return match[1];
        }
        return null;
    }
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
    static async discoverOAuthFromWWWAuthenticate(wwwAuthenticate) {
        const resourceMetadataUri = this.parseWWWAuthenticateHeader(wwwAuthenticate);
        if (!resourceMetadataUri) {
            return null;
        }
        const resourceMetadata = await this.fetchProtectedResourceMetadata(resourceMetadataUri);
        if (!resourceMetadata?.authorization_servers?.length) {
            return null;
        }
        const authServerUrl = resourceMetadata.authorization_servers[0];
        const authServerMetadata = await this.discoverAuthorizationServerMetadata(authServerUrl);
        if (authServerMetadata) {
            return this.metadataToOAuthConfig(authServerMetadata);
        }
        return null;
    }
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
    static extractBaseUrl(mcpServerUrl) {
        const serverUrl = new URL(mcpServerUrl);
        return `${serverUrl.protocol}//${serverUrl.host}`;
    }
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
    static isSSEEndpoint(url) {
        return url.includes('/sse') || !url.includes('/mcp');
    }
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
    static buildResourceParameter(endpointUrl) {
        const url = new URL(endpointUrl);
        return `${url.protocol}//${url.host}`;
    }
}
//# sourceMappingURL=oauth-utils.js.map