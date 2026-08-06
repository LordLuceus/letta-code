interface TodoItem {
    content: string;
    status: "pending" | "in_progress" | "completed";
    activeForm: string;
}
interface TodoWriteArgs {
    todos: TodoItem[];
}
interface TodoWriteResult {
    message: string;
}
export declare function todo_write(args: TodoWriteArgs): Promise<TodoWriteResult>;
export {};
//# sourceMappingURL=todo-write.d.ts.map