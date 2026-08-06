import Letta from "@letta-ai/letta-client";
export declare function __testOverrideGetClient(factory: (() => Promise<unknown>) | null): void;
export declare function consumeLastSDKDiagnostic(): string | null;
export declare function clearLastSDKDiagnostic(): void;
/**
 * Get the current Letta server URL from environment or settings.
 * Used for cache keys and API operations.
 */
export declare function getServerUrl(): string;
export { getMemfsGitProxyRewriteConfig, getMemfsServerUrl, LETTA_MEMFS_GIT_PROXY_BASE_URL_ENV, type MemfsGitProxyRewriteConfig, } from "./memfs-git-proxy";
export declare function getRuntimeEnvironmentDeviceId(): string;
export declare function getClientDefaultHeaders(): Record<string, string>;
export declare function getClient(): Promise<Letta>;
//# sourceMappingURL=client.d.ts.map