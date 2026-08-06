/**
 * Agent-scoped secret storage for Letta Code.
 * Cloud agent secrets are stored on the Letta server. Local agent secrets are
 * stored in the operating system credential manager when available, with a
 * local-backend file fallback for Node production. Both paths hydrate the same
 * in-memory cache for fast $SECRET_NAME substitution.
 */
type SecretsBackend = {
    capabilities: {
        serverSecrets: boolean;
    };
    retrieveAgent: (agentId: string, options?: {
        include?: string[];
    }) => Promise<{
        secrets?: Array<{
            key?: string;
            value?: string;
        }> | null;
    }>;
    updateAgent: (agentId: string, body: {
        secrets: Record<string, string>;
    }) => Promise<unknown>;
};
type LocalSecretStorage = {
    delete: (name: string) => Promise<boolean>;
    get: (name: string, label: string) => Promise<string | null>;
    set: (name: string, value: string) => Promise<void>;
};
export declare function __testOverrideSecretsBackend(backend: SecretsBackend | null): void;
export declare function __testOverrideLocalSecretStorage(storage: LocalSecretStorage | null): void;
/**
 * Initialize the agent-scoped secrets cache. Cloud agents fetch from the
 * server. Local agents read from OS secure storage through Bun.secrets.
 */
export declare function initSecretsFromServer(agentId: string, cachedAgent?: {
    secrets?: Array<{
        key?: string;
        value?: string;
    }> | null;
}): Promise<void>;
/**
 * Load secrets from the in-memory cache.
 * Returns an empty object if secrets have not been initialized yet.
 */
export declare function loadSecrets(agentId?: string): Record<string, string>;
/**
 * List all secret names (not values).
 */
export declare function listSecretNames(agentId?: string): string[];
/**
 * Refresh the cache from core, then return the full entries. Used by the
 * modal's `secret_list` WS handler to pre-populate the form.
 */
export declare function refreshAndListSecrets(agentIdArg?: string): Promise<Array<{
    key: string;
    value: string;
}>>;
/**
 * Apply a batch of secret mutations. Cloud agents use a single server PATCH;
 * local agents update OS secure storage and the local key index. Used by the
 * modal's `secret_apply` WS handler.
 *
 * @returns sorted final secret name list after the apply
 */
export declare function applySecretBatch(options: {
    set?: Record<string, string>;
    unset?: string[];
}, agentIdArg?: string): Promise<string[]>;
/**
 * Set an agent-scoped secret and update the in-memory cache.
 */
export declare function setSecretOnServer(key: string, value: string, agentIdArg?: string): Promise<void>;
/**
 * Delete an agent-scoped secret and update the in-memory cache.
 * @returns true if the secret existed and was deleted
 */
export declare function deleteSecretOnServer(key: string, agentIdArg?: string): Promise<boolean>;
/**
 * Clear the in-memory cache (useful for testing).
 */
export declare function clearSecretsCache(agentId?: string | null): void;
export {};
//# sourceMappingURL=secrets-store.d.ts.map