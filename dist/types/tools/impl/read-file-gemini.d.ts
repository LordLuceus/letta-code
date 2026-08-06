/**
 * Gemini CLI read_file tool - wrapper around Letta Code's Read tool
 * Uses Gemini's exact schema and description
 */
interface ReadFileGeminiArgs {
    file_path: string;
    offset?: number;
    limit?: number;
}
export declare function read_file_gemini(args: ReadFileGeminiArgs): Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=read-file-gemini.d.ts.map