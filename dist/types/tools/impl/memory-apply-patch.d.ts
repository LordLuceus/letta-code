interface MemoryApplyPatchArgs {
    reason: string;
    input: string;
}
interface MemoryApplyPatchResult {
    message: string;
}
export declare function memory_apply_patch(args: MemoryApplyPatchArgs): Promise<MemoryApplyPatchResult>;
export {};
//# sourceMappingURL=memory-apply-patch.d.ts.map