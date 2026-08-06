/**
 * Task tool implementation
 *
 * Spawns specialized subagents to handle complex, multi-step tasks autonomously.
 * Supports both built-in subagent types and custom subagents defined in .letta/agents/.
 */
import { completeSubagent, generateSubagentId, getSnapshot as getSubagentSnapshot, registerSubagent } from "../../agent/subagent-state.js";
import { type SubagentMemoryScope } from "../../agent/subagents";
import { spawnSubagent } from "../../agent/subagents/manager";
import { runSubagentStopHooks } from "../../hooks";
import { addToMessageQueue } from "../../utils/message-queue-bridge.js";
import { formatTaskNotification } from "../../utils/task-notifications.js";
interface TaskArgs {
    command?: "run" | "refresh";
    subagent_type?: string;
    prompt?: string;
    description?: string;
    model?: string;
    agent_id?: string;
    conversation_id?: string;
    run_in_background?: boolean;
    max_turns?: number;
    toolCallId?: string;
    signal?: AbortSignal;
    parentScope?: {
        agentId: string;
        conversationId: string;
    };
}
export interface SpawnBackgroundSubagentTaskArgs {
    subagentType: string;
    /** User-facing task type; execution still uses subagentType. */
    displayType?: string;
    prompt: string;
    description: string;
    model?: string;
    /** Replace the subagent's configured system prompt/persona (advanced). */
    systemPromptOverride?: string;
    toolCallId?: string;
    existingAgentId?: string;
    existingConversationId?: string;
    maxTurns?: number;
    forkedContext?: boolean;
    /** Parent conversation scope for routing notifications in listener mode. */
    parentScope?: {
        agentId: string;
        conversationId: string;
    };
    /**
     * Optional path to a transcript/payload file the subagent should read.
     * Exposed to the child process as the `TRANSCRIPT_PATH` env var so
     * prompts can reference `$TRANSCRIPT_PATH` (resolved via Bash) instead
     * of interpolating an absolute path. Currently used by reflection
     * subagents.
     */
    transcriptPath?: string;
    /** Optional exact memory scope for harness-created memory worktrees. */
    memoryScope?: SubagentMemoryScope;
    /**
     * When true, skip injecting the completion notification into the primary
     * agent's message queue and hide from SubagentGroupDisplay.
     * Use `onComplete` to show a user-facing notification without leaking
     * into the agent's context.
     */
    silentCompletion?: boolean;
    /**
     * Emit a completion notification even when `silentCompletion` is true.
     * Useful when the parent should not stream subagent tokens but still wants
     * a normal task notification event.
     */
    emitCompletionNotification?: boolean;
    /**
     * Optional override for the completion notification summary.
     */
    completionSummary?: string | ((result: {
        success: boolean;
        error?: string;
    }) => string | Promise<string>);
    /**
     * Called after the subagent finishes (success or failure).
     * Runs regardless of `silentCompletion` and is awaited before
     * completion notifications/hooks continue.
     * `report` is the raw final subagent report and may be large; callbacks
     * should parse/summarize it rather than injecting it directly into context.
     */
    onComplete?: (result: {
        success: boolean;
        error?: string;
        agentId?: string;
        conversationId?: string;
        model?: string;
        stepCount?: number;
        durationMs?: number;
        report?: string;
    }) => void | Promise<void>;
    /**
     * Optional dependency overrides for tests.
     * Production callers should not provide this.
     */
    deps?: Partial<SpawnBackgroundSubagentTaskDeps>;
}
export interface SpawnBackgroundSubagentTaskResult {
    taskId: string;
    outputFile: string;
    subagentId: string;
}
interface SpawnBackgroundSubagentTaskDeps {
    spawnSubagentImpl: typeof spawnSubagent;
    addToMessageQueueImpl: typeof addToMessageQueue;
    formatTaskNotificationImpl: typeof formatTaskNotification;
    runSubagentStopHooksImpl: typeof runSubagentStopHooks;
    generateSubagentIdImpl: typeof generateSubagentId;
    registerSubagentImpl: typeof registerSubagent;
    completeSubagentImpl: typeof completeSubagent;
    getSubagentSnapshotImpl: typeof getSubagentSnapshot;
}
/**
 * Wait briefly for a background subagent to publish its agent URL.
 * This keeps Task mostly non-blocking while allowing static transcript rows
 * to include an ADE link in the common case.
 */
export declare function waitForBackgroundSubagentLink(subagentId: string, timeoutMs?: number | null, signal?: AbortSignal): Promise<void>;
export declare function waitForBackgroundSubagentAgentId(subagentId: string, timeoutMs?: number | null, signal?: AbortSignal): Promise<string | null>;
export declare function waitForBackgroundSubagentConversationId(subagentId: string, timeoutMs?: number | null, signal?: AbortSignal): Promise<string | null>;
/**
 * Spawn a background subagent task and return task metadata immediately.
 * Notification/hook behavior is identical to Task's background path.
 */
export declare function spawnBackgroundSubagentTask(args: SpawnBackgroundSubagentTaskArgs): SpawnBackgroundSubagentTaskResult;
/**
 * Task tool - Launch a specialized subagent to handle complex tasks
 */
export declare function task(args: TaskArgs): Promise<string>;
export {};
//# sourceMappingURL=task.d.ts.map