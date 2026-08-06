/**
 * Shared system-prompt size estimator.
 *
 * Used by:
 *   - The `letta memory tokens` CLI command (for subagents + scripts)
 *   - The startup system-prompt warning
 *   - The bundled `context-doctor` skill script (via CLI)
 *
 * Heuristic: ~4 bytes per token
 * (codex-rs/core/src/truncate.rs APPROX_BYTES_PER_TOKEN = 4)
 */
export declare const SYSTEM_PROMPT_BYTES_PER_TOKEN = 4;
export interface FileEstimate {
    path: string;
    tokens: number;
}
export interface SystemPromptSizeEstimate {
    total: number;
    files: FileEstimate[];
}
export declare function estimateSystemTokens(text: string): number;
/**
 * Estimate total token usage of files under `<memoryDir>/system/`, with a per-file breakdown.
 *
 * Returns { total: 0, files: [] } when `system/` does not exist (instead of throwing).
 */
export declare function estimateSystemPromptSize(memoryDir: string): SystemPromptSizeEstimate;
/**
 * Backward-compatible helper returning just the total.
 */
export declare function estimateSystemPromptTokensFromMemoryDir(memoryDir: string): number;
//# sourceMappingURL=system-prompt-size.d.ts.map