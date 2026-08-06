interface IndentationOptions {
    anchor_line?: number;
    max_levels?: number;
    include_siblings?: boolean;
    include_header?: boolean;
    max_lines?: number;
}
interface ReadFileCodexArgs {
    file_path: string;
    offset?: number;
    limit?: number;
    mode?: "slice" | "indentation" | string;
    indentation?: IndentationOptions;
}
interface ReadFileCodexResult {
    content: string;
}
/**
 * Codex-style read_file tool.
 * Supports both slice mode (simple range) and indentation mode (context-aware block reading).
 */
export declare function read_file(args: ReadFileCodexArgs): Promise<ReadFileCodexResult>;
export {};
//# sourceMappingURL=read-file-codex.d.ts.map