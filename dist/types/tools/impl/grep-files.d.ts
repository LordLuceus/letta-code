interface GrepFilesArgs {
    pattern: string;
    include?: string;
    path?: string;
    limit?: number;
}
interface GrepFilesResult {
    output: string;
    matches?: number;
    files?: number;
    truncated?: boolean;
}
/**
 * Codex-style grep_files tool.
 * Uses the existing Grep implementation and returns a list of files with matches.
 */
export declare function grep_files(args: GrepFilesArgs): Promise<GrepFilesResult>;
export {};
//# sourceMappingURL=grep-files.d.ts.map