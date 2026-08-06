interface GetTaskOutputArgs {
    task_id: string;
    block?: boolean;
    timeout?: number;
    filter?: string;
    onOutput?: (chunk: string, stream: "stdout" | "stderr") => void;
    runningMessageWhenNonBlocking?: boolean;
}
interface GetTaskOutputResult {
    message: string;
    status?: "running" | "completed" | "failed";
}
/**
 * Core implementation for retrieving task/process output.
 * Used by both BashOutput (legacy) and TaskOutput (new).
 * Checks both backgroundProcesses (Bash) and backgroundTasks (Task).
 */
export declare function getTaskOutput(args: GetTaskOutputArgs): Promise<GetTaskOutputResult>;
interface BashOutputArgs {
    shell_id: string;
    filter?: string;
}
interface BashOutputResult {
    message: string;
}
/**
 * Legacy BashOutput function - wraps getTaskOutput with non-blocking behavior.
 */
export declare function bash_output(args: BashOutputArgs): Promise<BashOutputResult>;
export {};
//# sourceMappingURL=bash-output.d.ts.map