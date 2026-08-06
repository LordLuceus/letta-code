import type { Message } from "@letta-ai/letta-client/resources/agents/messages";
import type { getClient } from "./api/client";
import type { ForkConversationOptions, forkConversation as forkConversationRequest } from "./api/conversations";
import { type BackendMode } from "./backend-mode";
export type { BackendMode };
export { isExperimentalLocalBackendEnabled } from "./backend-mode";
export type APIClient = Awaited<ReturnType<typeof getClient>>;
type GetAPIClient = typeof getClient;
type ForkConversation = typeof forkConversationRequest;
export type ConversationMessageCreateParams = Parameters<APIClient["conversations"]["messages"]["create"]>;
export type ConversationMessageCreateBody = ConversationMessageCreateParams[1];
export type ConversationMessageCreateOptions = ConversationMessageCreateParams[2];
export type ConversationMessageStreamParams = Parameters<APIClient["conversations"]["messages"]["stream"]>;
export type ConversationMessageStreamBody = ConversationMessageStreamParams[1];
export type ConversationMessageStreamOptions = ConversationMessageStreamParams[2];
export type RunMessageStreamParams = Parameters<APIClient["runs"]["messages"]["stream"]>;
export type RunMessageStreamBody = RunMessageStreamParams[1];
export type RunMessageStreamOptions = RunMessageStreamParams[2];
export type AgentRetrieveParams = Parameters<APIClient["agents"]["retrieve"]>;
export type AgentRetrieveOptions = AgentRetrieveParams[1];
export type AgentListParams = Parameters<APIClient["agents"]["list"]>;
export type AgentListBody = AgentListParams[0];
export type AgentDeleteParams = Parameters<APIClient["agents"]["delete"]>;
export type AgentDeleteOptions = AgentDeleteParams[1];
export type AgentUpdateParams = Parameters<APIClient["agents"]["update"]>;
export type AgentUpdateBody = AgentUpdateParams[1];
export type AgentUpdateOptions = AgentUpdateParams[2];
export type AgentCreateParams = Parameters<APIClient["agents"]["create"]>;
export type AgentCreateBody = AgentCreateParams[0];
export type AgentCreateOptions = AgentCreateParams[1];
export type ConversationRetrieveParams = Parameters<APIClient["conversations"]["retrieve"]>;
export type ConversationRetrieveOptions = ConversationRetrieveParams[1];
export type ConversationListParams = Parameters<APIClient["conversations"]["list"]>;
export type ConversationListBody = ConversationListParams[0];
export type ConversationCreateParams = Parameters<APIClient["conversations"]["create"]>;
export type ConversationCreateBody = ConversationCreateParams[0];
export type ConversationCreateOptions = ConversationCreateParams[1];
export type ConversationUpdateParams = Parameters<APIClient["conversations"]["update"]>;
export type ConversationUpdateBody = ConversationUpdateParams[1];
export type ConversationUpdateOptions = ConversationUpdateParams[2];
export type ConversationRecompileParams = Parameters<APIClient["conversations"]["recompile"]>;
export type ConversationRecompileBody = ConversationRecompileParams[1];
export type ConversationRecompileOptions = ConversationRecompileParams[2];
export type ConversationMessageListParams = Parameters<APIClient["conversations"]["messages"]["list"]>;
export type ConversationMessageListBody = ConversationMessageListParams[1];
export type ConversationMessageListOptions = ConversationMessageListParams[2];
export declare const DEFAULT_CONVERSATION_MESSAGE_ORDER = "desc";
export type ConversationMessageCompactParams = Parameters<APIClient["conversations"]["messages"]["compact"]>;
export type ConversationMessageCompactBody = ConversationMessageCompactParams[1];
export type ConversationMessageCompactOptions = ConversationMessageCompactParams[2];
export type AgentMessageListParams = Parameters<APIClient["agents"]["messages"]["list"]>;
export type AgentMessageListBody = AgentMessageListParams[1];
export type AgentMessageListOptions = AgentMessageListParams[2];
export type MessageRetrieveParams = Parameters<APIClient["messages"]["retrieve"]>;
export type MessageRetrieveOptions = MessageRetrieveParams[1];
export type ModelsListParams = Parameters<APIClient["models"]["list"]>;
export type ModelsListOptions = ModelsListParams[0];
export interface ConversationResumeTailOptions {
    limit: number;
    includeReturnMessageTypes?: string[];
}
export interface ConversationResumeTail {
    conversation?: Awaited<ReturnType<APIClient["conversations"]["retrieve"]>>;
    messages: Message[];
}
export interface BackendCapabilities {
    remoteMemfs: boolean;
    serverSideToolManagement: boolean;
    serverSecrets: boolean;
    agentFileImportExport: boolean;
    promptRecompile: boolean;
    byokProviderRefresh: boolean;
    localModelCatalog: boolean;
    localMemfs: boolean;
}
export interface Backend {
    readonly capabilities: BackendCapabilities;
    retrieveAgent(agentId: string, options?: AgentRetrieveOptions): Promise<Awaited<ReturnType<APIClient["agents"]["retrieve"]>>>;
    listAgents(body?: AgentListBody): Promise<Awaited<ReturnType<APIClient["agents"]["list"]>>>;
    deleteAgent(agentId: string, options?: AgentDeleteOptions): Promise<Awaited<ReturnType<APIClient["agents"]["delete"]>>>;
    updateAgent(agentId: string, body: AgentUpdateBody, options?: AgentUpdateOptions): Promise<Awaited<ReturnType<APIClient["agents"]["update"]>>>;
    createAgent(body: AgentCreateBody, options?: AgentCreateOptions): Promise<Awaited<ReturnType<APIClient["agents"]["create"]>>>;
    retrieveConversation(conversationId: string, options?: ConversationRetrieveOptions): Promise<Awaited<ReturnType<APIClient["conversations"]["retrieve"]>>>;
    listConversations(body?: ConversationListBody): Promise<Awaited<ReturnType<APIClient["conversations"]["list"]>>>;
    createConversation(body: ConversationCreateBody, options?: ConversationCreateOptions): Promise<Awaited<ReturnType<APIClient["conversations"]["create"]>>>;
    /** Optional: not all backends support deleting conversations. */
    deleteConversation?(conversationId: string): Promise<Awaited<ReturnType<APIClient["conversations"]["delete"]>>>;
    updateConversation(conversationId: string, body: ConversationUpdateBody, options?: ConversationUpdateOptions): Promise<Awaited<ReturnType<APIClient["conversations"]["update"]>>>;
    recompileConversation(conversationId: string, body?: ConversationRecompileBody, options?: ConversationRecompileOptions): Promise<Awaited<ReturnType<APIClient["conversations"]["recompile"]>>>;
    listConversationMessages(conversationId: string, body?: ConversationMessageListBody, options?: ConversationMessageListOptions): Promise<Awaited<ReturnType<APIClient["conversations"]["messages"]["list"]>>>;
    compactConversationMessages(conversationId: string, body?: ConversationMessageCompactBody, options?: ConversationMessageCompactOptions): Promise<Awaited<ReturnType<APIClient["conversations"]["messages"]["compact"]>>>;
    listAgentMessages(agentId: string, body?: AgentMessageListBody, options?: AgentMessageListOptions): Promise<Awaited<ReturnType<APIClient["agents"]["messages"]["list"]>>>;
    retrieveMessage(messageId: string, options?: MessageRetrieveOptions): Promise<Awaited<ReturnType<APIClient["messages"]["retrieve"]>>>;
    getConversationResumeTail(agentId: string, conversationId: string, options: ConversationResumeTailOptions): Promise<ConversationResumeTail>;
    listModels(options?: ModelsListOptions): Promise<Awaited<ReturnType<APIClient["models"]["list"]>>>;
    createConversationMessageStream(conversationId: string, body: ConversationMessageCreateBody, options?: ConversationMessageCreateOptions): Promise<Awaited<ReturnType<APIClient["conversations"]["messages"]["create"]>>>;
    streamConversationMessages(conversationId: string, body: ConversationMessageStreamBody, options?: ConversationMessageStreamOptions): Promise<Awaited<ReturnType<APIClient["conversations"]["messages"]["stream"]>>>;
    cancelConversation(conversationIdOrAgentId: string): Promise<Awaited<ReturnType<APIClient["conversations"]["cancel"]>>>;
    cancelRun(agentId: string, runId: string): Promise<Awaited<ReturnType<APIClient["agents"]["messages"]["cancel"]>>>;
    retrieveRun(runId: string): Promise<Awaited<ReturnType<APIClient["runs"]["retrieve"]>>>;
    streamRunMessages(runId: string, body: RunMessageStreamBody, options?: RunMessageStreamOptions): Promise<Awaited<ReturnType<APIClient["runs"]["messages"]["stream"]>>>;
    forkConversation(conversationId: string, options?: ForkConversationOptions): ReturnType<typeof forkConversationRequest>;
    getLocalStorageDir?(): string | undefined;
}
interface APIBackendDeps {
    getClient?: GetAPIClient;
    forkConversation?: ForkConversation;
}
export declare class APIBackend implements Backend {
    readonly capabilities: BackendCapabilities;
    private readonly getApiClientOverride?;
    private readonly forkConversationOverride?;
    constructor(deps?: APIBackendDeps);
    private getClient;
    retrieveAgent(agentId: string, options?: AgentRetrieveOptions): Promise<import("@letta-ai/letta-client/resources/index.mjs").AgentState>;
    listAgents(body?: AgentListBody): Promise<import("@letta-ai/letta-client/resources/index.mjs").AgentStatesArrayPage>;
    deleteAgent(agentId: string, options?: AgentDeleteOptions): Promise<unknown>;
    updateAgent(agentId: string, body: AgentUpdateBody, options?: AgentUpdateOptions): Promise<import("@letta-ai/letta-client/resources/index.mjs").AgentState>;
    createAgent(body: AgentCreateBody, options?: AgentCreateOptions): Promise<import("@letta-ai/letta-client/resources/index.mjs").AgentState>;
    retrieveConversation(conversationId: string, options?: ConversationRetrieveOptions): Promise<import("@letta-ai/letta-client/resources/index.mjs").Conversation>;
    listConversations(body?: ConversationListBody): Promise<import("@letta-ai/letta-client/resources/index.mjs").ConversationListResponse>;
    createConversation(body: ConversationCreateBody, options?: ConversationCreateOptions): Promise<import("@letta-ai/letta-client/resources/index.mjs").Conversation>;
    deleteConversation(conversationId: string): Promise<unknown>;
    updateConversation(conversationId: string, body: ConversationUpdateBody, options?: ConversationUpdateOptions): Promise<import("@letta-ai/letta-client/resources/index.mjs").Conversation>;
    recompileConversation(conversationId: string, body?: ConversationRecompileBody, options?: ConversationRecompileOptions): Promise<string>;
    listConversationMessages(conversationId: string, body?: ConversationMessageListBody, options?: ConversationMessageListOptions): Promise<import("@letta-ai/letta-client/resources/agents.mjs").MessagesArrayPage>;
    compactConversationMessages(conversationId: string, body?: ConversationMessageCompactBody, options?: ConversationMessageCompactOptions): Promise<import("@letta-ai/letta-client/resources/conversations/messages.mjs").CompactionResponse>;
    listAgentMessages(agentId: string, body?: AgentMessageListBody, options?: AgentMessageListOptions): Promise<import("@letta-ai/letta-client/resources/agents.mjs").MessagesArrayPage>;
    retrieveMessage(messageId: string, options?: MessageRetrieveOptions): Promise<import("@letta-ai/letta-client/resources/messages.mjs").MessageRetrieveResponse>;
    getConversationResumeTail(agentId: string, conversationId: string, options: ConversationResumeTailOptions): Promise<ConversationResumeTail>;
    listModels(options?: ModelsListOptions): Promise<import("@letta-ai/letta-client/resources/index.mjs").ModelListResponse>;
    createConversationMessageStream(conversationId: string, body: ConversationMessageCreateBody, options?: ConversationMessageCreateOptions): Promise<import("@letta-ai/letta-client/core/streaming.mjs").Stream<import("@letta-ai/letta-client/resources/agents.mjs").LettaStreamingResponse>>;
    streamConversationMessages(conversationId: string, body: ConversationMessageStreamBody, options?: ConversationMessageStreamOptions): Promise<import("@letta-ai/letta-client/core/streaming.mjs").Stream<import("@letta-ai/letta-client/resources/agents.mjs").LettaStreamingResponse>>;
    cancelConversation(conversationIdOrAgentId: string): Promise<import("@letta-ai/letta-client/resources/index.mjs").ConversationCancelResponse>;
    cancelRun(agentId: string, runId: string): Promise<import("@letta-ai/letta-client/resources/agents.mjs").MessageCancelResponse>;
    retrieveRun(runId: string): Promise<import("@letta-ai/letta-client/resources/agents.mjs").Run>;
    streamRunMessages(runId: string, body: RunMessageStreamBody, options?: RunMessageStreamOptions): Promise<import("@letta-ai/letta-client/core/streaming.mjs").Stream<import("@letta-ai/letta-client/resources/agents.mjs").LettaStreamingResponse>>;
    forkConversation(conversationId: string, options?: ForkConversationOptions): Promise<{
        id: string;
    }>;
}
export declare function getLocalBackendStorageDir(homeDir?: string): string;
export declare function getBackend(): Backend;
/**
 * Get a backend instance for a specific mode without switching the global backend.
 * Useful for cross-backend operations like retrieving pinned agents from the other backend.
 */
export declare function getBackendForMode(mode: BackendMode): Backend;
export declare function configureBackendMode(mode: BackendMode): void;
export declare function isLocalBackendEnabled(): boolean;
export declare function configureDevBackend(name: string): Promise<void>;
export declare function __testSetBackend(nextBackend: Backend | null): void;
//# sourceMappingURL=backend.d.ts.map