/**
 * Gemini CLI replace tool - wrapper around Letta Code's Edit tool
 * Uses Gemini's exact schema and description
 */
interface ReplaceGeminiArgs {
    file_path: string;
    old_string: string;
    new_string: string;
    expected_replacements?: number;
}
export declare function replace(args: ReplaceGeminiArgs): Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=replace-gemini.d.ts.map