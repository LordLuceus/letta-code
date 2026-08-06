/**
 * Gemini CLI run_shell_command tool - wrapper around Letta Code's Bash tool
 * Uses Gemini's exact schema and description
 */
interface RunShellCommandGeminiArgs {
    command: string;
    description?: string;
    dir_path?: string;
    timeout_ms?: number;
    signal?: AbortSignal;
    onOutput?: (chunk: string, stream: "stdout" | "stderr") => void;
    secretEnv?: Record<string, string>;
}
export declare function run_shell_command(args: RunShellCommandGeminiArgs): Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=run-shell-command-gemini.d.ts.map