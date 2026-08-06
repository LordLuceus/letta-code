/**
 * Gemini CLI write_file tool - wrapper around Letta Code's Write tool
 * Uses Gemini's exact schema and description
 */
interface WriteFileGeminiArgs {
    file_path: string;
    content: string;
}
export declare function write_file_gemini(args: WriteFileGeminiArgs): Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=write-file-gemini.d.ts.map