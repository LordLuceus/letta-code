import { type HeadlessTurnExecutor } from "../dev/headless-turn-executor";
import type { LocalPiModelsRuntime } from "../dev/pi-models-runtime";
import { type LocalContextPressure, type PiStreamFunction } from "../dev/pi-stream-adapter";
import type { LlmEndInfo, LlmStartInfo, ProviderTurnInput } from "../dev/provider-turn-executor";
import type { LocalCompactionStats } from "./compaction";
import type { LocalMessage } from "./local-message";
export type LocalBackendExecutionMode = "pi" | "deterministic";
export interface CreateLocalExecutorOptions {
    storageDir: string;
    executionMode?: LocalBackendExecutionMode;
    executor?: HeadlessTurnExecutor;
    stream?: PiStreamFunction;
}
type LocalCompactionCallback = (input: ProviderTurnInput, trigger: unknown) => Promise<{
    uiMessages: LocalMessage[];
    summary: string;
    stats?: LocalCompactionStats;
} | null>;
export declare function createLocalExecutor(options: CreateLocalExecutorOptions, modelsRuntime: LocalPiModelsRuntime, onContextWindowOverflow?: (input: ProviderTurnInput, error: unknown) => ReturnType<LocalCompactionCallback>, onContextPressure?: (input: ProviderTurnInput, pressure: LocalContextPressure) => ReturnType<LocalCompactionCallback>, onLlmStart?: (info: LlmStartInfo) => void | Promise<void>, onLlmEnd?: (info: LlmEndInfo) => void | Promise<void>): HeadlessTurnExecutor;
export {};
//# sourceMappingURL=local-executor-factory.d.ts.map