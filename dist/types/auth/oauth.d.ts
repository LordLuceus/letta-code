/**
 * OAuth 2.0 utilities for Letta Cloud authentication
 * Uses Device Code Flow for CLI authentication
 */
export declare const LETTA_CLOUD_API_URL = "https://api.letta.com";
export declare const OAUTH_CONFIG: {
    readonly clientId: "ci-let-724dea7e98f4af6f8f370f4b1466200c";
    readonly clientSecret: "";
    readonly authBaseUrl: "https://app.letta.com";
    readonly apiBaseUrl: "https://api.letta.com";
};
export interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval: number;
}
export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
    scope?: string;
}
export interface OAuthError {
    error: string;
    error_description?: string;
}
export declare class OAuthRefreshError extends Error {
    readonly retryable: boolean;
    readonly status?: number;
    readonly oauthCode?: string;
    constructor(message: string, options: {
        retryable: boolean;
        status?: number;
        oauthCode?: string;
        cause?: unknown;
    });
}
export type CredentialValidationFailureReason = "invalid_credentials" | "network_error" | "server_unreachable" | "unknown";
export type CredentialValidationResult = {
    ok: true;
} | {
    ok: false;
    reason: CredentialValidationFailureReason;
    message: string;
    status?: number;
};
/**
 * Device Code Flow - Step 1: Request device code
 */
export declare function requestDeviceCode(): Promise<DeviceCodeResponse>;
/**
 * Device Code Flow - Step 2: Poll for token
 */
export declare function pollForToken(deviceCode: string, interval: number | undefined, expiresIn: number | undefined, deviceId: string, deviceName?: string, signal?: AbortSignal): Promise<TokenResponse>;
/**
 * Refresh an access token using a refresh token
 */
export declare function refreshAccessToken(refreshToken: string, deviceId: string, deviceName?: string): Promise<TokenResponse>;
/**
 * Revoke a refresh token (logout)
 */
export declare function revokeToken(refreshToken: string): Promise<void>;
/**
 * Validate credentials by checking an authenticated endpoint.
 * Uses SDK's agents.list() which requires valid authentication.
 */
export declare function validateCredentials(baseUrl: string, apiKey: string): Promise<boolean>;
export declare function validateCredentialsWithResult(baseUrl: string, apiKey: string): Promise<CredentialValidationResult>;
//# sourceMappingURL=oauth.d.ts.map