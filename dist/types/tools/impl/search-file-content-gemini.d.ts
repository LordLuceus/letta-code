/**
 * Gemini CLI search_file_content tool - wrapper around Letta Code's Grep tool
 * Uses Gemini's exact schema and description
 */
interface SearchFileContentGeminiArgs {
    pattern: string;
    dir_path?: string;
    include?: string;
}
export declare function search_file_content(args: SearchFileContentGeminiArgs): Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=search-file-content-gemini.d.ts.map