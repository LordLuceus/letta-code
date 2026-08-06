export type TelemetrySurface = "letta_code_tui" | "letta_code_headless" | "letta_code_cli_server" | "letta_code_desktop";
export type TelemetryBackend = "cloud" | "local" | "docker_deprecated" | "self_hosted_api" | "unknown";
export interface TelemetryInitOptions {
    handleSigint?: boolean;
}
export interface TelemetryEvent {
    type: "session_start" | "session_end" | "tool_usage" | "error" | "user_input" | "reflection_start" | "reflection_end" | "reflection_worktree_cleanup" | "reflection_arena_vote";
    timestamp: string;
    data: Record<string, unknown>;
}
export interface SessionStartData {
    startup_command: string;
    version: string;
    platform: string;
    node_version: string;
}
export interface SessionEndData {
    duration: number;
    message_count: number;
    tool_call_count: number;
    exit_reason?: string;
    total_api_ms?: number;
    total_wall_ms?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cached_input_tokens?: number;
    cached_tokens?: number;
    cache_write_tokens?: number;
    reasoning_tokens?: number;
    context_tokens?: number;
    step_count?: number;
}
export interface ToolUsageData {
    tool_name: string;
    success: boolean;
    duration: number;
    response_length?: number;
    error_type?: string;
    stderr?: string;
}
export interface ErrorData {
    error_type: string;
    error_message: string;
    context?: string;
    http_status?: number;
    model_id?: string;
    run_id?: string;
    recent_chunks?: Record<string, unknown>[];
    debug_log_tail?: string;
}
export interface UserInputData {
    input_length: number;
    is_command: boolean;
    command_name?: string;
    message_type: string;
    model_id: string;
}
export type ReflectionTriggerSource = "manual" | "step-count" | "compaction-event";
export interface ReflectionStartData {
    trigger_source: ReflectionTriggerSource;
    subagent_id?: string;
    conversation_id?: string;
    start_message_id?: string;
    end_message_id?: string;
    model?: string;
    version?: string;
    platform?: string;
}
export interface ReflectionEndData {
    trigger_source: ReflectionTriggerSource;
    success: boolean;
    subagent_id?: string;
    conversation_id?: string;
    error?: string;
    step_count?: number;
    duration_ms?: number;
    model?: string;
    version?: string;
    platform?: string;
}
export type ReflectionWorktreeCleanupOutcome = "parent_dirty" | "merge_conflict" | "reflection_worktree_dirty" | "subagent_failed";
export interface ReflectionWorktreeCleanupData {
    outcome: ReflectionWorktreeCleanupOutcome;
    integration_status: "parent_dirty" | "merge_conflict" | "dirty_uncommitted" | "failed";
    trigger_source?: ReflectionTriggerSource;
    subagent_id?: string;
    conversation_id?: string;
    reflection_worktree_id?: string;
    commit_count?: number;
    model?: string;
    version?: string;
    platform?: string;
}
export interface ReflectionArenaVoteData {
    run_id: string;
    choice: "win_loss" | "tie";
    winner: string | null;
    loser: string | null;
    winner_agent_id: string | null;
    loser_agent_id: string | null;
    parent_agent_id: string;
    parent_convo_id: string;
    timestamp: string;
    feedbackstr: string | null;
    lc_version: string;
    memory_base_commit: string | null;
    memory_candidate_commit: string | null;
    transcript_payload: string | null;
    transcript_payload_chars: number | null;
    transcript_payload_truncated: boolean;
    version?: string;
    platform?: string;
}
export declare function isLettaCodeDesktopRuntime(env?: NodeJS.ProcessEnv): boolean;
export declare function getTerminalTelemetrySurface(isHeadless: boolean): TelemetrySurface;
export declare function getListenerTelemetrySurface(env?: NodeJS.ProcessEnv): TelemetrySurface;
export declare function resolveTelemetryBackend(options?: {
    env?: NodeJS.ProcessEnv;
    serverUrl?: string | null;
}): TelemetryBackend;
declare class TelemetryManager {
    private events;
    private sessionId;
    private deviceId;
    private currentAgentId;
    private surface;
    private sessionStartTime;
    private messageCount;
    private toolCallCount;
    private sessionEndTracked;
    private initialized;
    private flushInterval;
    private serverVersion;
    /** Deduplicates concurrent flushes (prevents the 429 double-flush race on shutdown). */
    private inflightFlush;
    private resolveTelemetryApiKey;
    private getTelemetryDeviceId;
    private readonly FLUSH_INTERVAL_MS;
    private readonly MAX_BATCH_SIZE;
    /** Max time to drain queued events on exit (bounded so we never hang the shell). */
    private readonly DRAIN_TIMEOUT_MS;
    private sessionStatsGetter?;
    constructor();
    private generateSessionId;
    /**
     * Check if telemetry is enabled based on environment variables.
     * Enabled by default unless explicitly disabled.
     */
    private isTelemetryEnabled;
    /**
     * Check if the user is connected to Letta Cloud (api.letta.com)
     */
    private isCloudUser;
    /**
     * Initialize telemetry and start periodic flushing
     */
    init(options?: TelemetryInitOptions): void;
    /**
     * Track a telemetry event
     */
    private track;
    /**
     * Set the current agent ID (called from App.tsx when agent changes)
     * This is automatically added to all telemetry events
     */
    setCurrentAgentId(agentId: string | null): void;
    setSurface(surface: TelemetrySurface): void;
    /**
     * Fetch and cache server version from /v1/health (fire-and-forget, best-effort)
     */
    fetchServerVersion(): Promise<void>;
    getServerVersion(): string | null;
    /**
     * Set a getter function for session stats (called from App.tsx)
     * This allows safety net handlers to access stats even if not explicitly passed
     * Pass undefined to clear the getter (for cleanup)
     */
    setSessionStatsGetter(getter?: () => {
        totalWallMs: number;
        totalApiMs: number;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
            cachedInputTokens: number;
            cacheWriteTokens: number;
            reasoningTokens: number;
            contextTokens?: number;
            stepCount: number;
        };
    }): void;
    /**
     * Get the current session ID
     */
    getSessionId(): string;
    /**
     * Get the current message count
     */
    getMessageCount(): number;
    /**
     * Get the current tool call count
     */
    getToolCallCount(): number;
    /**
     * Track session start
     */
    trackSessionStart(): void;
    /**
     * Track session end
     * @param stats Optional session stats (from sessionStatsRef.current.getSnapshot() in App.tsx)
     * @param exitReason Optional reason for exit (e.g., "exit_command", "logout", "sigint", "process_exit")
     */
    trackSessionEnd(stats?: {
        totalWallMs: number;
        totalApiMs: number;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
            cachedInputTokens: number;
            cacheWriteTokens: number;
            reasoningTokens: number;
            contextTokens?: number;
            stepCount: number;
        };
    }, exitReason?: string): void;
    /**
     * Track tool usage
     */
    trackToolUsage(toolName: string, success: boolean, duration: number, responseLength?: number, errorType?: string, stderr?: string): void;
    /**
     * Track errors
     */
    trackError(errorType: string, errorMessage: string, context?: string, options?: {
        httpStatus?: number;
        modelId?: string;
        runId?: string;
        recentChunks?: Record<string, unknown>[];
    }): void;
    /**
     * Track user input
     * Note: agent_id is automatically added from currentAgentId
     */
    trackUserInput(input: string, messageType: string, modelId: string): void;
    /**
     * Track reflection start events (manual and auto-triggered).
     */
    trackReflectionStart(triggerSource: ReflectionTriggerSource, options?: {
        subagentId?: string;
        conversationId?: string;
        startMessageId?: string;
        endMessageId?: string;
        model?: string | null;
    }): void;
    /**
     * Track reflection completion events.
     */
    trackReflectionEnd(triggerSource: ReflectionTriggerSource, success: boolean, options?: {
        subagentId?: string;
        conversationId?: string;
        error?: string;
        stepCount?: number;
        durationMs?: number;
        model?: string | null;
    }): void;
    trackReflectionWorktreeCleanup(options: Omit<ReflectionWorktreeCleanupData, "version" | "platform">): void;
    trackReflectionArenaVote(vote: Omit<ReflectionArenaVoteData, "version" | "platform">): void;
    /** Concurrent callers share one in-flight POST (prevents 429 double-flush race on shutdown). */
    flush(): Promise<void>;
    private performFlush;
    /** Await in-flight flush and drain remaining queue (bounded by DRAIN_TIMEOUT_MS). Replaces fire-and-forget flush on exit. */
    drain(): Promise<void>;
    /**
     * Clean up resources
     */
    cleanup(): void;
}
export declare const telemetry: TelemetryManager;
export {};
//# sourceMappingURL=index.d.ts.map