interface ListDirCodexArgs {
    dir_path: string;
    offset?: number;
    limit?: number;
    depth?: number;
}
interface ListDirCodexResult {
    content: string;
}
/**
 * Codex-style list_dir tool.
 * Lists entries with pagination and depth control.
 *
 * Defaults:
 * - offset: 1 (1-indexed)
 * - limit: 25
 * - depth: 2 (immediate children + one nested level)
 */
export declare function list_dir(args: ListDirCodexArgs): Promise<ListDirCodexResult>;
export {};
//# sourceMappingURL=list-dir-codex.d.ts.map