/**
 * Gemini CLI list_directory tool - wrapper around Letta Code's LS tool
 * Uses Gemini's exact schema and description
 */
interface ListDirectoryGeminiArgs {
    dir_path: string;
    ignore?: string[];
    file_filtering_options?: {
        respect_git_ignore?: boolean;
        respect_gemini_ignore?: boolean;
    };
}
export declare function list_directory(args: ListDirectoryGeminiArgs): Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=list-directory-gemini.d.ts.map