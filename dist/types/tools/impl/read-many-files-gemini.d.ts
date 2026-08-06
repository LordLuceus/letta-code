/**
 * Gemini CLI read_many_files tool - new implementation for Letta Code
 * Uses Gemini's exact schema and description
 */
interface ReadManyFilesGeminiArgs {
    include: string[];
    exclude?: string[];
    recursive?: boolean;
    useDefaultExcludes?: boolean;
    file_filtering_options?: {
        respect_git_ignore?: boolean;
        respect_gemini_ignore?: boolean;
    };
}
export declare function read_many_files(args: ReadManyFilesGeminiArgs): Promise<{
    message: string;
}>;
export {};
//# sourceMappingURL=read-many-files-gemini.d.ts.map