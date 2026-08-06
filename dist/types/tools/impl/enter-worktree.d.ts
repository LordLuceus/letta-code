interface EnterWorktreeResult {
    content: Array<{
        type: "text";
        text: string;
    }>;
    status: "success" | "error";
    worktree_path?: string;
    branch_name?: string;
    base_ref?: string;
    switched_cwd?: boolean;
}
export declare function addWindowsPathLengthHint(message: string, platform?: NodeJS.Platform): string;
/**
 * Provisions a freshly created worktree: symlinks heavy gitignored directories,
 * wires git hooks, copies local settings, and copies `.worktreeinclude` paths.
 * Every step is best-effort — failures are reported as notes and never abort
 * worktree creation.
 *
 * `symlinkDependencies` (opt-in; defaulted off at the tool layer) gates only
 * the dependency-directory symlinks. When true, node_modules is shared from the
 * primary checkout to avoid reinstalling — but a package install in the worktree
 * then writes through to the primary checkout, so worktrees stay isolated unless
 * it is explicitly requested. Returns `linkedDependencies` so the caller can
 * tailor its guidance.
 */
export declare function provisionWorktree(params: {
    primaryRoot: string;
    worktreePath: string;
    symlinkDependencies: boolean;
}): Promise<{
    notes: string[];
    linkedDependencies: boolean;
}>;
export declare function enter_worktree(rawArgs: Record<string, unknown>): Promise<EnterWorktreeResult>;
export {};
//# sourceMappingURL=enter-worktree.d.ts.map