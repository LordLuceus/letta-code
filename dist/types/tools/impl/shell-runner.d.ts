export declare class ShellExecutionError extends Error {
    code?: string;
    executable?: string;
    cwd?: string;
    /** Distinguishes which lookup failed when `code` is ENOENT. */
    reason?: "executable_missing" | "cwd_missing";
}
export type ShellSpawnOptions = {
    cwd: string;
    env: NodeJS.ProcessEnv;
    timeoutMs: number;
    signal?: AbortSignal;
    onOutput?: (chunk: string, stream: "stdout" | "stderr") => void;
};
/**
 * Spawn a command with a specific launcher.
 * Returns a promise that resolves with the output or rejects with an error.
 */
export declare function spawnWithLauncher(launcher: string[], options: ShellSpawnOptions): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
}>;
//# sourceMappingURL=shell-runner.d.ts.map