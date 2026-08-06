import type { AssistantMessage, AssistantMessageEvent, Context, Model, SimpleStreamOptions } from "@earendil-works/pi-ai";
import type { LocalCompactionStats } from "../local/compaction";
import { type LocalMessage } from "../local/local-message";
import { LocalPiModelsRuntime } from "./pi-models-runtime";
import type { LlmEndInfo, LlmStartInfo, ProviderStreamAdapter, ProviderStreamEvent, ProviderTurnInput } from "./provider-turn-executor";
export type PiStreamFunction = (model: Model<string>, context: Context, options?: SimpleStreamOptions & Record<string, unknown>) => AsyncIterable<AssistantMessageEvent> & {
    result(): Promise<AssistantMessage>;
};
export interface LocalContextPressure {
    contextTokens: number;
    contextWindow: number;
    phase: "preflight" | "post_turn";
    source: "estimate" | "usage";
}
interface LocalCompactionResult {
    uiMessages: LocalMessage[];
    summary: string;
    stats?: LocalCompactionStats;
}
export interface PiStreamAdapterOptions {
    stream?: PiStreamFunction;
    abortSignal?: AbortSignal;
    localProviderAuthStorageDir?: string;
    /**
     * Per-backend pi-ai Models runtime used for model resolution and stream
     * dispatch. A dedicated instance is created when not provided; the local
     * backend passes its own so /model listing and turn execution share one
     * provider registry.
     */
    modelsRuntime?: LocalPiModelsRuntime;
    onContextWindowOverflow?: (input: ProviderTurnInput, error: unknown) => Promise<{
        uiMessages: LocalMessage[];
        summary: string;
        stats?: LocalCompactionStats;
    } | null>;
    onContextPressure?: (input: ProviderTurnInput, pressure: LocalContextPressure) => Promise<LocalCompactionResult | null>;
    onLlmStart?: (info: LlmStartInfo) => void | Promise<void>;
    onLlmEnd?: (info: LlmEndInfo) => void | Promise<void>;
}
export declare class PiStreamAdapter implements ProviderStreamAdapter {
    private readonly runStream;
    private readonly abortSignal?;
    private readonly localProviderAuthStorageDir?;
    private readonly modelsRuntime;
    private readonly onContextWindowOverflow?;
    private readonly onContextPressure?;
    private readonly onLlmStart?;
    private readonly onLlmEnd?;
    constructor(options?: PiStreamAdapterOptions);
    private emitCompactionChunks;
    private compactBeforeProviderCall;
    private streamOnce;
    stream(input: ProviderTurnInput): AsyncIterable<ProviderStreamEvent>;
}
export {};
//# sourceMappingURL=pi-stream-adapter.d.ts.map