interface ShellCommandArgs {
    command: string;
    description?: string;
    workdir?: string;
    login?: boolean;
    timeout_ms?: number;
    sandbox_permissions?: "use_default" | "require_escalated";
    justification?: string;
    prefix_rule?: string[];
    signal?: AbortSignal;
    onOutput?: (chunk: string, stream: "stdout" | "stderr") => void;
    secretEnv?: Record<string, string>;
}
interface ShellCommandResult {
    output: string;
    stdout?: string[];
    stderr?: string[];
}
/**
 * Codex-style shell_command tool.
 * Runs a shell script string in the user's default shell.
 */
export declare function shell_command(args: ShellCommandArgs): Promise<ShellCommandResult>;
export {};
//# sourceMappingURL=shell-command.d.ts.map