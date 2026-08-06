type TimerHandle = ReturnType<typeof setTimeout>;
export interface BackgroundProcessHandle {
    kill(signal?: string | number): unknown;
}
export interface BackgroundRuntimeScope {
    agentId: string;
    conversationId: string;
}
export interface BackgroundProcess {
    process: BackgroundProcessHandle;
    command: string;
    stdout: string[];
    stderr: string[];
    status: "running" | "completed" | "failed";
    exitCode: number | null;
    lastReadIndex: {
        stdout: number;
        stderr: number;
    };
    startTime?: Date;
    outputFile?: string;
    totalStdoutLines?: number;
    totalStderrLines?: number;
    cleanupTimer?: TimerHandle;
    runtimeScope?: BackgroundRuntimeScope;
}
export interface BackgroundTask {
    description: string;
    subagentType: string;
    displayType?: string;
    subagentId: string;
    status: "running" | "completed" | "failed";
    output: string[];
    error?: string;
    startTime: Date;
    outputFile: string;
    abortController?: AbortController;
    cleanupTimer?: TimerHandle;
    runtimeScope?: BackgroundRuntimeScope;
}
export declare const backgroundProcesses: Map<string, BackgroundProcess>;
export declare const backgroundTasks: Map<string, BackgroundTask>;
export declare function getNextBashId(): string;
export declare function getNextExecSessionId(): string;
export declare function getNextTaskId(): string;
export declare function getNextDownloadId(): string;
interface BackgroundRetentionConfig {
    completedEntryTtlMs: number;
    maxProcessLinesPerStream: number;
    maxProcessCharsPerStream: number;
    maxTaskOutputChars: number;
    maxOutputFileReadBytes: number;
    maxRunningProcesses: number;
    maxRunningTasks: number;
}
export declare function unrefTimer(timer: TimerHandle): void;
export declare function __setBackgroundRetentionConfigForTests(overrides: Partial<BackgroundRetentionConfig>): void;
export declare function __resetBackgroundRetentionConfigForTests(): void;
export declare function clearBackgroundProcessCleanup(id: string): void;
export declare function clearBackgroundTaskCleanup(id: string): void;
export declare function getBackgroundOutputFileReadBytes(): number;
export declare function assertBackgroundProcessCapacity(): void;
export declare function assertBackgroundTaskCapacity(): void;
export declare function scheduleBackgroundProcessCleanup(id: string): void;
export declare function scheduleBackgroundTaskCleanup(id: string): void;
export declare function appendBackgroundProcessOutput(processState: BackgroundProcess, stream: "stdout" | "stderr", text: string): void;
export declare function setBackgroundTaskOutput(task: BackgroundTask, output: string): void;
/**
 * Get a temp directory for background task output files.
 * Uses LETTA_SCRATCHPAD if set. Otherwise creates one private temp directory
 * for this process so fixed log filenames do not collide across users or runs.
 */
export declare function getBackgroundOutputDir(): string;
export declare function __resetBackgroundOutputDirForTests(): void;
/**
 * Create a unique output file path for a background process/task.
 */
export declare function createBackgroundOutputFile(id: string): string;
/**
 * Append content to a background output file.
 */
export declare function appendToOutputFile(filePath: string, content: string): void;
export {};
//# sourceMappingURL=process_manager.d.ts.map