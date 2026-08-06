export declare const MAX_RETRY_DURATION_MS: number;
export declare const INITIAL_RETRY_DELAY_MS = 1000;
export declare const MAX_RETRY_DELAY_MS = 30000;
export declare const LISTENER_STREAM_OPEN_TIMEOUT_MS = 30000;
export declare const LISTENER_HEARTBEAT_INTERVAL_MS = 30000;
export declare const LISTENER_PONG_TIMEOUT_MS = 90000;
/**
 * Returns true when the listener has not observed a relay `pong` within
 * `timeoutMs`, indicating a likely half-open socket that should be terminated
 * to trigger a reconnect. Returns false when no pong has been recorded yet
 * (`lastPongAt === null`) so a freshly-connected socket is never killed before
 * its first heartbeat round-trip completes.
 */
export declare function isListenerPongStale(lastPongAt: number | null, now: number, timeoutMs: number): boolean;
export declare const SYSTEM_REMINDER_RE: RegExp;
export declare const LLM_API_ERROR_MAX_RETRIES = 3;
export declare const EMPTY_RESPONSE_MAX_RETRIES = 2;
export declare const MAX_PRE_STREAM_RECOVERY = 2;
export declare const MAX_POST_STOP_APPROVAL_RECOVERY = 2;
export declare const PROVIDER_FALLBACK_MAP: Record<string, string>;
export declare const PROVIDER_FALLBACK_NOTICE = "Anthropic API error; falling back to Bedrock...";
//# sourceMappingURL=constants.d.ts.map