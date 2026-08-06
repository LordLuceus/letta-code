import type { SubagentResult } from ".";
/**
 * State tracked during subagent execution
 */
export interface ExecutionState {
    agentId: string | null;
    conversationId: string | null;
    finalResult: string | null;
    finalError: string | null;
    resultStats: {
        durationMs: number;
        totalTokens: number;
        stepCount?: number;
    } | null;
    displayedToolCalls: Set<string>;
}
/**
 * Process a single JSON event from the subagent stream
 */
export declare function processStreamEvent(line: string, state: ExecutionState, subagentId: string): void;
/**
 * Whether a subagent's stream-json stdout ends mid-line: the final segment has
 * no line terminator and is non-empty but not valid JSON. A healthy stream ends
 * with a complete result envelope, so a partial trailing line is unambiguous
 * evidence the tail was truncated in transit (#3257). Complete-but-unexpected
 * output (the final line parses, has a terminator, or stdout is empty) is NOT
 * treated as truncation — the child may have already performed side effects,
 * so callers only retry the clear case.
 */
export declare function looksLikeTruncatedStreamJson(stdout: string): boolean;
/**
 * Parse the final result from stdout if not captured during streaming
 */
export declare function parseResultFromStdout(stdout: string, agentId: string | null): SubagentResult;
//# sourceMappingURL=subagent-stream.d.ts.map