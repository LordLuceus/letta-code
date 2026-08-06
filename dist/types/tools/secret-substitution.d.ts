/**
 * Secret handling for shell tool arguments and output.
 */
/**
 * Scan a command string or command-argument array for `$SECRET_NAME`
 * references and build an env map of matching secrets from the store.
 * The shell will expand these vars natively, so secret values never get
 * injected into the command string itself.
 */
export declare function extractSecretEnvFromCommand(command: string | readonly string[], agentId?: string): Record<string, string>;
/**
 * Scrub secret values from a string, replacing them with an explicit
 * placeholder that makes it unambiguous to the LLM that the value is hidden.
 * Used to prevent secret values from leaking into agent context via tool output.
 */
export declare function scrubSecretsFromString(input: string, agentId?: string): string;
//# sourceMappingURL=secret-substitution.d.ts.map