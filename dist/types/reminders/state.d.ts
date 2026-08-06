import type { ContextTracker } from "../cli/helpers/context-tracker";
import type { PermissionMode } from "../permissions/mode";
export interface CommandIoReminder {
    input: string;
    output: string;
    success: boolean;
    /** Extra context appended only in the agent-facing reminder, not shown in the UI. */
    agentHint?: string;
}
export interface ToolsetChangeReminder {
    source: string;
    previousToolset: string | null;
    newToolset: string | null;
    previousTools: string[];
    newTools: string[];
}
export interface MemoryGitSyncReminder {
    text: string;
}
export type SessionContextReason = "initial_attach" | "cwd_changed";
export interface SharedReminderState {
    hasSentAgentInfo: boolean;
    hasSentSessionContext: boolean;
    hasSentConversationBootstrap: boolean;
    pendingConversationBootstrap: boolean;
    hasSentSecretsInfo: boolean;
    pendingSecretsInfoRefresh: boolean;
    lastSentSecretNamesKey: string | null;
    lastNotifiedPermissionMode: PermissionMode | null;
    turnCount: number;
    pendingReflectionTrigger: boolean;
    pendingMemoryGitSyncReminders: MemoryGitSyncReminder[];
    pendingCommandIoReminders: CommandIoReminder[];
    pendingToolsetChangeReminders: ToolsetChangeReminder[];
    /** When set, the next session-context reminder uses this reason for its intro text. */
    pendingSessionContextReason?: SessionContextReason;
}
export declare function createSharedReminderState(): SharedReminderState;
export declare function resetSharedReminderState(state: SharedReminderState): void;
export declare function syncReminderStateFromContextTracker(state: SharedReminderState, contextTracker: ContextTracker): void;
export declare function enqueueCommandIoReminder(state: SharedReminderState, reminder: CommandIoReminder): void;
export declare function enqueueMemoryGitSyncReminder(state: SharedReminderState, reminder: MemoryGitSyncReminder): void;
export declare function enqueueToolsetChangeReminder(state: SharedReminderState, reminder: ToolsetChangeReminder): void;
export declare function markSecretsInfoReminderPending(state: SharedReminderState): void;
//# sourceMappingURL=state.d.ts.map