interface ExecCommandArgs {
    cmd: string;
    description?: string;
    workdir?: string;
    shell?: string;
    tty?: boolean;
    yield_time_ms?: number;
    max_output_tokens?: number;
    login?: boolean;
    signal?: AbortSignal;
    onOutput?: (chunk: string, stream: "stdout" | "stderr") => void;
    secretEnv?: Record<string, string>;
    parentScope?: {
        agentId: string;
        conversationId: string;
    };
}
interface WriteStdinArgs {
    session_id: number | string;
    chars?: string;
    yield_time_ms?: number;
    max_output_tokens?: number;
    signal?: AbortSignal;
    onOutput?: (chunk: string, stream: "stdout" | "stderr") => void;
}
interface ExecCommandResult {
    output: string;
}
type ExecSessionStatus = "running" | "completed" | "failed";
interface ExecSession {
    id: string;
    command: string;
    output: string;
    chunks: ExecOutputChunk[];
    readOffset: number;
    status: ExecSessionStatus;
    exitCode: number | null;
    tty: boolean;
    cleanupTimer?: ReturnType<typeof setTimeout>;
}
type ExecOutputChunk = {
    text: string;
    stream: "stdout" | "stderr";
    start: number;
    end: number;
};
export declare function exec_command(args: ExecCommandArgs): Promise<ExecCommandResult>;
export declare function write_stdin(args: WriteStdinArgs): Promise<ExecCommandResult>;
export declare function __clearExecSessionsForTests(): void;
export declare function __getExecSessionForTests(sessionId: string): ExecSession | undefined;
export {};
//# sourceMappingURL=exec-command.d.ts.map