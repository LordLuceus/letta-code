interface ShellArgs {
    command: string[];
    workdir?: string;
    timeout_ms?: number;
    env_overrides?: NodeJS.ProcessEnv;
    secretEnv?: Record<string, string>;
    with_escalated_permissions?: boolean;
    justification?: string;
    signal?: AbortSignal;
    onOutput?: (chunk: string, stream: "stdout" | "stderr") => void;
}
export declare function resolveShellWorkdir(workdir?: string): string;
export interface ShellResult {
    output: string;
    stdout: string[];
    stderr: string[];
}
/**
 * Codex-style shell tool.
 * Runs an array of shell arguments using execvp-style semantics.
 * Typically called with ["bash", "-lc", "..."] for shell commands.
 */
export declare function shell(args: ShellArgs): Promise<ShellResult>;
export {};
//# sourceMappingURL=shell.d.ts.map