/**
 * Centralized truncation utilities for tool outputs.
 * Implements limits similar to Claude Code to prevent excessive token usage.
 * When outputs exceed limits, full content can be written to overflow files.
 */
export declare const LIMITS: {
    readonly BASH_OUTPUT_CHARS: 30000;
    readonly TASK_OUTPUT_CHARS: 30000;
    readonly READ_MAX_LINES: 2000;
    readonly READ_MAX_CHARS_PER_LINE: 2000;
    readonly READ_OUTPUT_CHARS: 30000;
    readonly GREP_OUTPUT_CHARS: 10000;
    readonly GLOB_MAX_FILES: 2000;
    readonly LS_MAX_ENTRIES: 1000;
    readonly TOOL_RETURN_MAX_CHARS: 32000;
};
/**
 * Options for truncation with overflow support
 */
export interface TruncationOptions {
    /** Working directory for overflow file creation */
    workingDirectory?: string;
    /** Tool name for overflow file naming */
    toolName?: string;
    /** Whether to use middle truncation (keep beginning and end) */
    useMiddleTruncation?: boolean;
}
/**
 * Truncates text to a maximum character count.
 * Adds a truncation notice when content exceeds limit.
 * Optionally writes full output to an overflow file.
 */
export declare function truncateByChars(text: string, maxChars: number, toolName?: string, options?: TruncationOptions): {
    content: string;
    wasTruncated: boolean;
    overflowPath?: string;
};
/**
 * Truncates text by line count.
 * Optionally enforces max characters per line.
 * Optionally writes full output to an overflow file.
 */
export declare function truncateByLines(text: string, maxLines: number, maxCharsPerLine?: number, toolName?: string, options?: TruncationOptions): {
    content: string;
    wasTruncated: boolean;
    originalLineCount: number;
    linesShown: number;
    overflowPath?: string;
};
/**
 * Truncates an array of items (file paths, directory entries, etc.)
 * Optionally writes full output to an overflow file.
 */
export declare function truncateArray<T>(items: T[], maxItems: number, formatter: (items: T[]) => string, itemType?: string, toolName?: string, options?: TruncationOptions): {
    content: string;
    wasTruncated: boolean;
    overflowPath?: string;
};
/**
 * Format bytes for human-readable display
 */
export declare function formatBytes(bytes: number): string;
//# sourceMappingURL=truncation.d.ts.map