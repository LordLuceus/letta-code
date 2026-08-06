import type { Stream } from "@letta-ai/letta-client/core/streaming";
import type { LettaStreamingResponse } from "@letta-ai/letta-client/resources/agents/messages";
import type { ConversationMessageCreateBody, ConversationMessageStreamBody } from "../backend";
import type { LocalMessage } from "../local/local-message";
import type { LocalAgentRecord, StoredMessage } from "../local/local-store";
export type HeadlessTurnBody = ConversationMessageCreateBody | ConversationMessageStreamBody;
export interface HeadlessTurnExecutorInput {
    conversationId: string;
    agentId: string;
    agent: LocalAgentRecord;
    systemPrompt?: string;
    midConversationSystemPrompt?: string;
    body: HeadlessTurnBody;
    history: StoredMessage[];
    uiMessages: LocalMessage[];
}
export interface HeadlessTurnExecutor {
    execute(input: HeadlessTurnExecutorInput): Promise<Stream<LettaStreamingResponse>>;
}
export declare function createAssistantMessageStream(message?: Partial<Pick<StoredMessage, "id" | "date" | "content">>): Stream<LettaStreamingResponse>;
export declare class DeterministicPongExecutor implements HeadlessTurnExecutor {
    execute(_input: HeadlessTurnExecutorInput): Promise<Stream<LettaStreamingResponse>>;
}
export declare class DeterministicToolCallExecutor implements HeadlessTurnExecutor {
    private toolCallSeq;
    execute(input: HeadlessTurnExecutorInput): Promise<Stream<LettaStreamingResponse>>;
}
//# sourceMappingURL=headless-turn-executor.d.ts.map