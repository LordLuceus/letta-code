import type { AgentState } from "@letta-ai/letta-client/resources/agents/agents";
import type { LettaStreamingResponse } from "@letta-ai/letta-client/resources/agents/messages";
import type { Conversation } from "@letta-ai/letta-client/resources/conversations/conversations";
import type { AgentCreateBody, AgentListBody, AgentMessageListBody, AgentUpdateBody, ConversationCreateBody, ConversationListBody, ConversationMessageCreateBody, ConversationMessageListBody, ConversationMessageStreamBody, ConversationUpdateBody } from "../backend";
import type { LocalCompactionStats } from "./compaction";
import { type LocalMessage } from "./local-message";
import type { LocalAgentRecord, StoredMessage } from "./local-types";
import type { LocalCompiledSystemPrompt } from "./system-prompt-compilation";
export type { LocalAgentRecord, StoredMessage };
export declare function isHiddenLocalAgentRecord(record: {
    hidden?: boolean | null;
    tags?: unknown;
}): boolean;
export declare function projectLocalAgentState(record: LocalAgentRecord, messageIds?: string[], inContextMessageIds?: string[], lastRunCompletion?: string | null): AgentState;
export interface StoredTurnInput {
    agentId: string;
    conversationId: string;
}
export interface LocalCompactionStoreResult {
    numMessagesBefore: number;
    numMessagesAfter: number;
    summaryMessage: LocalMessage;
}
export interface LocalStoreOptions {
    storageDir?: string;
    seedDefaultAgent?: boolean;
    strictAgentAccess?: boolean;
    strictConversationAccess?: boolean;
    defaultAgentName?: string;
    defaultAgentModel?: string;
    defaultAgentModelSettings?: Record<string, unknown>;
    modelSettingsForModel?: (model: string) => Record<string, unknown> | undefined;
    conversationIdPrefix?: string;
    storedMessageIdPrefix?: string;
    localMessageIdPrefix?: string;
}
export declare class LocalBackendNotFoundError extends Error {
    readonly status = 404;
    constructor(resource: string, id: string);
}
export declare const LOCAL_TRANSCRIPT_LEGACY_SCHEMA_VERSION = 1;
export declare const LOCAL_TRANSCRIPT_SCHEMA_VERSION = 2;
export declare const LOCAL_TRANSCRIPT_LEGACY_MESSAGE_FORMAT = "pi-ai-message-jsonl";
export declare const LOCAL_TRANSCRIPT_MESSAGE_FORMAT = "pi-session-entry-jsonl";
export declare const LOCAL_TRANSCRIPT_PROVIDER_STACK = "pi-ai";
type LocalTranscriptSchemaVersion = typeof LOCAL_TRANSCRIPT_SCHEMA_VERSION | typeof LOCAL_TRANSCRIPT_LEGACY_SCHEMA_VERSION;
type LocalTranscriptMessageFormat = typeof LOCAL_TRANSCRIPT_MESSAGE_FORMAT | typeof LOCAL_TRANSCRIPT_LEGACY_MESSAGE_FORMAT;
export interface LocalTranscriptManifest {
    schema_version: LocalTranscriptSchemaVersion;
    message_format: LocalTranscriptMessageFormat;
    provider_stack: typeof LOCAL_TRANSCRIPT_PROVIDER_STACK;
    created_at: string;
    migrated_from?: string;
    migrated_at?: string;
    backup_path?: string;
}
export declare class LocalTranscriptMigrationRequiredError extends Error {
    constructor(storageDir: string);
}
export declare class LocalTranscriptRepairRequiredError extends Error {
    constructor(storageDir: string, conversationDir: string);
}
export declare function localTranscriptMigrationCommand(storageDir: string): string;
export declare class LocalStore {
    private readonly defaultAgentId;
    private readonly storageDir?;
    private readonly strictAgentAccess;
    private readonly strictConversationAccess;
    private readonly defaultAgentName;
    private readonly defaultAgentModel;
    private readonly defaultAgentModelSettings;
    private readonly modelSettingsForModel?;
    private readonly conversationIdPrefix;
    private readonly storedMessageIdPrefix;
    private readonly localMessageIdPrefix;
    private readonly agents;
    private readonly conversations;
    private readonly localMessagesByConversationKey;
    private readonly loadedConversationKeys;
    private readonly loadRepairedConversationKeys;
    private readonly transcriptMetadataByConversationKey;
    private readonly conversationRecordMtimeMsByKey;
    private readonly sessionEntryIdsByConversationKey;
    private readonly sessionEntryIdByMessageIdByConversationKey;
    private readonly persistedMessageByMessageIdByConversationKey;
    private readonly lastSessionEntryIdByConversationKey;
    private readonly compiledSystemPromptByConversationKey;
    private readonly messagesById;
    private readonly settledLocalMessageIds;
    private conversationRecordsScanned;
    private conversationSeq;
    private messageSeq;
    private localMessageSeq;
    constructor(defaultAgentId: string, options?: LocalStoreOptions);
    retrieveAgent(agentId: string): AgentState;
    listAgents(body?: AgentListBody): {
        items: AgentState[];
    };
    deleteAgent(agentId: string): void;
    retrieveAgentRecord(agentId: string): LocalAgentRecord;
    ensureAgent(agentId: string): AgentState;
    updateAgent(agentId: string, body: AgentUpdateBody): AgentState;
    setAgentCompactionSettings(agentId: string, settings: Record<string, unknown> | null): AgentState;
    createAgent(body: AgentCreateBody): AgentState;
    private createDefaultAgentRecord;
    private createAgentRecord;
    private modelSettingsDefaultsForModel;
    private projectableAgentRecord;
    retrieveConversation(conversationId: string, agentId?: string): Conversation;
    listConversations(body?: ConversationListBody): Conversation[];
    createConversation(body: ConversationCreateBody): Conversation;
    updateConversation(conversationId: string, body: ConversationUpdateBody): Conversation;
    private withConversationModelDefaults;
    forkConversation(conversationId: string, options?: {
        agentId?: string;
        hidden?: boolean;
        messageId?: string;
    }): {
        id: string;
    };
    appendTurnInput(conversationId: string, body: ConversationMessageCreateBody | ConversationMessageStreamBody): StoredTurnInput;
    appendStreamChunk(conversationId: string, agentId: string, chunk: LettaStreamingResponse): LettaStreamingResponse;
    listLocalMessages(conversationId: string, agentId?: string): LocalMessage[];
    settleInterruptedToolCalls(conversationIdOrAgentId: string, options?: {
        agentId?: string;
        reason?: string;
    }): number;
    resolveAgentIdForConversation(conversationId: string): string;
    getCompiledSystemPrompt(conversationId: string, agentId: string): LocalCompiledSystemPrompt | undefined;
    setCompiledSystemPrompt(conversationId: string, agentId: string, prompt: LocalCompiledSystemPrompt): void;
    clearCompiledSystemPromptsForAgent(agentId: string): void;
    listConversationMessages(conversationId: string, body?: ConversationMessageListBody): StoredMessage[];
    listAgentMessages(agentId: string, body?: AgentMessageListBody): StoredMessage[];
    retrieveMessage(messageId: string): StoredMessage[];
    compactConversationAll(input: {
        conversationId: string;
        agentId: string;
        summary: string;
        packedSummary: string;
        stats?: LocalCompactionStats;
        remainingMessages?: LocalMessage[];
    }): LocalCompactionStoreResult;
    private appendUserLocalMessage;
    private applyVisibleChunkToLocalMessages;
    private applyFinalAssistantMessage;
    private appendAssistantText;
    private appendAssistantReasoning;
    private appendAssistantToolCall;
    private toolResultContentFromUnknown;
    private findToolResult;
    private appendToolResultMessage;
    private applyApprovalResults;
    private settleInterruptedToolCallsForConversation;
    private rollbackUnpersistedTrailingAssistantMessage;
    private findToolCall;
    private assistantLocalMessageForAppend;
    private touchLocalMessage;
    private toolCallFromChunk;
    private createStoredChunk;
    private applyListOptions;
    private projectLocalMessages;
    private projectTailMessagesForConversation;
    private projectedMessagesForConversation;
    private rebuildMessageIndex;
    private loadConversationContainingMessage;
    private indexMessageFromTranscriptTail;
    private indexMessageFromConversationTail;
    private localMessagesForConversation;
    private loadConversationMessages;
    private pushLocalMessage;
    private persistPendingAssistantMessage;
    private touchConversationForLocalMessage;
    private cloneLocalMessageForConversation;
    private localContentFromInputContent;
    private nextLocalMessageId;
    private nextLocalMessageDate;
    private currentLocalMessageDate;
    private setTranscriptMetadata;
    private transcriptMetadataRecord;
    private validateTranscriptMetadata;
    private conversationsDir;
    private conversationDirForKey;
    private updateConversationSequences;
    private cacheConversationRecord;
    private loadConversationRecordFromDir;
    private conversationRecordMtimeMs;
    private recordConversationRecordMtime;
    private refreshConversationRecordFromStorage;
    private loadConversationRecordsFromStorage;
    private refreshLoadedConversationRecordsFromStorage;
    private loadFromStorage;
    private persistAgent;
    private projectAgent;
    private persistConversationState;
    private persistConversationTranscript;
    private rewriteConversationSessionTranscript;
    private appendConversationSessionMessageEntry;
    private appendConversationSessionCompactionEntry;
    private appendConversationSessionEntry;
    private ensureConversationTranscriptHeader;
    private resetPersistedSessionState;
    private resetPersistedSessionStateFromEntries;
    private sessionEntryIds;
    private sessionEntryIdsByMessageId;
    private persistedMessagesByMessageId;
    private nextSessionEntryId;
    private persistCompiledSystemPrompt;
    private ensureConversation;
    private nextConversationId;
    private findConversation;
    private toolSettlementTargets;
    private agentIdForConversation;
    private conversationKey;
}
//# sourceMappingURL=local-store.d.ts.map