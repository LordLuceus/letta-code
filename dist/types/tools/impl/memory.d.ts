type MemoryCommand = "str_replace" | "insert" | "delete" | "rename" | "update_description" | "create";
interface MemoryArgs {
    command: MemoryCommand;
    reason: string;
    file_path?: string;
    old_path?: string;
    new_path?: string;
    old_string?: string;
    new_string?: string;
    insert_line?: number;
    insert_text?: string;
    description?: string;
    file_text?: string;
}
interface MemoryResult {
    message: string;
}
export declare function memory(args: MemoryArgs): Promise<MemoryResult>;
export {};
//# sourceMappingURL=memory.d.ts.map