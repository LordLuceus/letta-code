/**
 * Gemini CLI glob tool - wrapper around Letta Code's Glob tool
 * Uses Gemini's exact schema and description
 */
interface GlobGeminiArgs {
    pattern: string;
    dir_path?: string;
    case_sensitive?: boolean;
    respect_git_ignore?: boolean;
    respect_gemini_ignore?: boolean;
}
export declare function glob_gemini(args: GlobGeminiArgs): Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=glob-gemini.d.ts.map