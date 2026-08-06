/**
 * Gemini CLI write_todos tool - adapter for Letta Code's todo_write
 * Uses Gemini's exact schema and description but adapts the params
 */
interface WriteTodosGeminiArgs {
    todos: Array<{
        description: string;
        status: "pending" | "in_progress" | "completed" | "cancelled";
    }>;
}
export declare function write_todos(args: WriteTodosGeminiArgs): Promise<{
    message: string;
    todos: typeof args.todos;
}>;
export {};
//# sourceMappingURL=write-todos-gemini.d.ts.map