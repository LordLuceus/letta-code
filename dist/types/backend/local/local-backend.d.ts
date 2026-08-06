import type { Backend, BackendCapabilities, ConversationCreateBody, ConversationMessageCompactBody, ConversationMessageCreateBody, ConversationMessageStreamBody, ConversationRecompileBody } from "../backend";
import { HeadlessBackend } from "../dev/headless-backend";
import type { HeadlessTurnExecutor } from "../dev/headless-turn-executor";
import { LocalPiModelsRuntime } from "../dev/pi-models-runtime";
import type { PiStreamFunction } from "../dev/pi-stream-adapter";
import type { LlmEndInfo, LlmStartInfo } from "../dev/provider-turn-executor";
import { type LocalCompleteFunction } from "./compaction";
import { type LocalBackendExecutionMode } from "./local-executor-factory";
import type { LocalMessage } from "./local-message";
import type { LocalAgentRecord, StoredMessage } from "./local-store";
export interface LocalBackendOptions {
    storageDir: string;
    defaultAgentId?: string;
    executionMode?: LocalBackendExecutionMode;
    executor?: HeadlessTurnExecutor;
    stream?: PiStreamFunction;
    complete?: LocalCompleteFunction;
    memoryDir?: string;
    memfsEnabled?: boolean;
    modelsRuntime?: LocalPiModelsRuntime;
}
/**
 * Hooks the harness installs (via {@link LocalBackend.setModEventHooks}) so
 * mods can observe backend-internal lifecycle that only the local backend owns
 * (compaction and provider calls). The backend stays mod-agnostic: it invokes
 * these plain callbacks and never touches mod state.
 */
export interface LocalBackendModEventHooks {
    onCompactStart?: (info: {
        agentId: string;
        conversationId: string;
        trigger: string;
    }) => void | Promise<void>;
    onCompactEnd?: (info: {
        agentId: string;
        conversationId: string;
        trigger: string;
        messagesBefore: number;
        messagesAfter: number;
        contextTokensBefore: number;
        contextTokensAfter: number;
    }) => void | Promise<void>;
    onLlmStart?: (info: LlmStartInfo) => void | Promise<void>;
    onLlmEnd?: (info: LlmEndInfo) => void | Promise<void>;
}
export declare class LocalBackend extends HeadlessBackend {
    readonly capabilities: BackendCapabilities;
    private readonly memoryDir?;
    private readonly storageDir;
    private readonly piModelsRuntime;
    private readonly complete?;
    private readonly memfsEnabledOverride?;
    private modEventHooks?;
    constructor(options: LocalBackendOptions);
    /**
     * Late-bound because the backend is a process-global singleton constructed
     * before the harness mod adapter exists. The harness calls this once the
     * registry is ready to forward backend-internal events to local mods.
     */
    setModEventHooks(hooks: LocalBackendModEventHooks | undefined): void;
    private emitCompactStart;
    private emitCompactEnd;
    private emitLlmStart;
    private emitLlmEnd;
    getLocalStorageDir(): string;
    listModels(): Promise<never>;
    createAgent(...args: Parameters<HeadlessBackend["createAgent"]>): Promise<import("@letta-ai/letta-client/resources/index.mjs").AgentState>;
    updateAgent(...args: Parameters<HeadlessBackend["updateAgent"]>): Promise<import("@letta-ai/letta-client/resources/index.mjs").AgentState>;
    createConversation(body: ConversationCreateBody): ReturnType<HeadlessBackend["createConversation"]>;
    recompileConversation(conversationId: string, body?: ConversationRecompileBody): Promise<string>;
    compactConversationMessages(conversationId: string, body?: ConversationMessageCompactBody): ReturnType<Backend["compactConversationMessages"]>;
    protected resolveSystemPromptForTurn(input: {
        conversationId: string;
        agentId: string;
        agent: LocalAgentRecord;
        body: ConversationMessageCreateBody | ConversationMessageStreamBody;
        history: StoredMessage[];
        uiMessages: LocalMessage[];
    }): Promise<{
        systemPrompt: string;
        midConversationSystemPrompt?: string;
    }>;
    private memoryDirForAgent;
    private isLocalMemfsEnabled;
    private ensureLocalMemoryRepo;
    private compactAfterContextOverflow;
    private compactForContextPressure;
    private effectiveContextWindow;
    /**
     * Resolve the model that compaction should use for a conversation.
     *
     * A normal turn runs on the conversation's model override (set via `/model`),
     * but compaction previously read only the agent's base model — so switching
     * a conversation's model never changed which model compaction (and its
     * summarizer) used. This overlays the conversation's `model` / `model_settings`
     * onto the agent record so compaction mirrors the turn path.
     */
    private effectiveAgentForConversation;
    private resolveCompactionSettings;
    private compactLocalConversation;
    private compactLocalConversationInner;
    private compactLocalConversationAll;
    private compactLocalConversationSlidingWindow;
    private getOrCompileSystemPrompt;
    private compileAndMaybePersistSystemPrompt;
}
//# sourceMappingURL=local-backend.d.ts.map