interface GlobArgs {
    pattern: string;
    path?: string;
}
interface GlobResult {
    files: string[];
    truncated?: boolean;
    totalFiles?: number;
}
export declare function glob(args: GlobArgs): Promise<GlobResult>;
export {};
//# sourceMappingURL=glob.d.ts.map