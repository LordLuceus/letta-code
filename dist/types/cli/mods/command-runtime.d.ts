import type { ModCommand, ModCommandContext, ModCommandResult } from "./types";
export declare function parseModSlashCommand(trimmed: string): {
    command: string;
    args: string;
} | null;
export declare function parseModCommandArgv(args: string): string[];
export declare function normalizeModCommandResult(result: unknown): ModCommandResult;
export declare function buildModCommandPrompt(result: {
    content: string;
    systemReminder?: boolean;
}): string;
export declare function runModCommandWithTimeout(command: ModCommand, context: ModCommandContext): Promise<ModCommandResult>;
//# sourceMappingURL=command-runtime.d.ts.map