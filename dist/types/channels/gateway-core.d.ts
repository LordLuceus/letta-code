import type { MessageCreate } from "@letta-ai/letta-client/resources/agents/agents";
import type { ApprovalResponseBody, ExternalToolCallRequestMessage, ExternalToolCallResult, ExternalToolDefinitionPayload, InputAcceptedResponseMessage, InputCommand, RuntimeExternalToolsUpdateGroup, RuntimeExternalToolsUpdateResponseMessage, RuntimeScope, RuntimeStartCommand, RuntimeStartResponseMessage, StreamDeltaMessage, WsProtocolMessage } from "../types/app-server-protocol";
import type { ChannelControlRequestEvent, ChannelDefaultPermissionMode, ChannelTurnLifecycleEvent, ChannelTurnProgressEvent, ChannelTurnSource } from "./types";
export interface ChannelGatewayClient {
    close(): void;
    onMessage(listener: (message: WsProtocolMessage) => void): () => void;
    onExternalToolCall(handler: (request: ExternalToolCallRequestMessage) => Promise<ExternalToolCallResult> | ExternalToolCallResult): () => void;
    submitInput(command: Omit<InputCommand, "type">): Promise<InputAcceptedResponseMessage>;
    runtimeStart(options: Omit<RuntimeStartCommand, "type" | "request_id"> & {
        request_id?: string;
    }): Promise<RuntimeStartResponseMessage>;
    runtimeExternalToolsUpdate(options: {
        updates: readonly RuntimeExternalToolsUpdateGroup[];
    }): Promise<RuntimeExternalToolsUpdateResponseMessage>;
}
export interface ChannelGatewayDelivery {
    runtime: RuntimeScope;
    content: MessageCreate["content"];
    sources: ChannelTurnSource[];
    clientMessageId: string;
    defaultPermissionMode?: ChannelDefaultPermissionMode;
}
export interface ChannelGatewayHooks {
    buildExternalTool(runtime: RuntimeScope, sources: ChannelTurnSource[]): Promise<ExternalToolDefinitionPayload | null>;
    executeExternalTool(request: ExternalToolCallRequestMessage, sources: ChannelTurnSource[]): Promise<ExternalToolCallResult> | ExternalToolCallResult;
    onLifecycle(event: ChannelTurnLifecycleEvent): void | Promise<void>;
    onProgress(event: ChannelTurnProgressEvent): void | Promise<void>;
    onControlRequest(event: ChannelControlRequestEvent): void | Promise<void>;
    createRichDraft?(options: {
        batchId: string;
        sources: ChannelTurnSource[];
    }): ChannelGatewayRichDraft | null;
}
export interface ChannelGatewayRichDraft {
    handleDelta(delta: StreamDeltaMessage["delta"]): void;
    flushPending(): Promise<void>;
    dispose(): void;
}
export interface ChannelGatewayModelStatus {
    modelHandle: string | null;
    scope: "agent" | "conversation";
}
/**
 * Process-neutral Channels bridge. It only speaks the public App Server
 * protocol; channel adapters and credentials stay behind the injected hooks.
 */
export declare class ChannelGateway {
    private readonly client;
    private readonly hooks;
    private readonly states;
    private readonly disposers;
    private registrationQueue;
    constructor(client: ChannelGatewayClient, hooks: ChannelGatewayHooks);
    close(): void;
    submit(delivery: ChannelGatewayDelivery): Promise<boolean>;
    private submitDelivery;
    restoreRuntime(runtime: RuntimeScope, sources: ChannelTurnSource[]): Promise<Set<string>>;
    registerRuntime(runtime: RuntimeScope, sources?: ChannelTurnSource[], defaultPermissionMode?: ChannelDefaultPermissionMode): Promise<void>;
    submitApprovalResponse(runtime: RuntimeScope, response: ApprovalResponseBody): Promise<boolean>;
    setRoutedSources(runtime: RuntimeScope, sources: ChannelTurnSource[]): void;
    getKnownRuntimes(): RuntimeScope[];
    updateRoutedRuntimeTools(updates: readonly RuntimeExternalToolsUpdateGroup[], routedSources: Array<{
        runtime: RuntimeScope;
        sources: ChannelTurnSource[];
    }>): Promise<void>;
    getModelStatus(runtime: RuntimeScope): ChannelGatewayModelStatus | null;
    updateModelStatus(runtime: RuntimeScope, modelHandle: string | null): void;
    private getState;
    private enqueueHook;
    private enqueueRegistration;
    private performRuntimeRegistration;
    private handleMessage;
    private handleQueueUpdate;
    private activateSources;
    private handleStreamDelta;
    private handleTurnFinished;
    private handleControlRequest;
}
//# sourceMappingURL=gateway-core.d.ts.map