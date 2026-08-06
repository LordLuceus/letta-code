import type { ModCommand, ModCommandResult } from "../../mods/types";
import type { ModCommandInfo } from "../../types/protocol_v2";
import type { ConversationRuntime, ListenerRuntime } from "./types";
/**
 * Registered mod commands as advertisable facts. Clients read these to surface
 * mod commands in their palette by their own policy (separate from the built-in
 * `supported_commands` allowlist).
 */
export declare function listListenerModCommands(runtime: ListenerRuntime, agentId?: string | null): ModCommandInfo[];
/** Look up a registered mod command by id, if any. */
export declare function getListenerModCommand(runtime: ListenerRuntime, commandId: string, agentId?: string | null): ModCommand | undefined;
/**
 * Run a mod command in the listener and return its result. Builds a
 * ModCommandContext that mirrors the TUI command path (createModConversationHandle
 * with the shared sendMessageStreamWithBackend so fork/send/updateLlmConfig work
 * across local and Letta Cloud backends).
 */
export declare function runListenerModCommand(conversationRuntime: ConversationRuntime, modCommand: ModCommand, parsed: {
    commandId: string;
    args: string;
    rawInput: string;
}): Promise<ModCommandResult>;
//# sourceMappingURL=mod-commands.d.ts.map