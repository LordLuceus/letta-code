import type { AssistantMessage, Context, Model, SimpleStreamOptions } from "@earendil-works/pi-ai";
import { LocalPiModelsRuntime } from "../dev/pi-models-runtime";
import type { LocalMessage } from "./local-message";
import type { LocalAgentRecord } from "./local-types";
export declare const LOCAL_SUMMARY_TOOL_RETURN_TRUNCATION_CHARS = 2000;
export declare const LOCAL_DEFAULT_COMPACTION_MODE = "sliding_window";
export declare const LOCAL_DEFAULT_SLIDING_WINDOW_PERCENTAGE = 0.3;
export type LocalCompactionMode = "all" | "sliding_window";
export declare class LocalSlidingWindowCompactionPlanningError extends Error {
    constructor(message: string);
}
export declare function isLocalSlidingWindowCompactionPlanningError(error: unknown): error is LocalSlidingWindowCompactionPlanningError;
export declare const LOCAL_ALL_COMPACTION_PROMPT = "Your task is to create a detailed summary of the conversation so far, paying close attention to the user's explicit requests and your previous actions.\nThis summary should be thorough in capturing technical details, code patterns, and architectural decisions that would be essential for continuing development work without losing context. Your summary should include the following sections:\n\n1.**High level goals**: What is the high level goal and ongoing task? Capture the user's explicit requests and intent in detail. If there is an existing summary in the transcript, make sure to take it into consideration to continue tracking the higher level goals and long-term progress.\n\n2. **What happened**: The conversations, tasks, and exchanges that took place. What did the user ask for? What did you do? How did things progress? If there is a previous summary being evicted, please extract a concise version of the critical info from it.\n\n3. **Important details**: Enumerate specific files and code sections examined, modified, or created, as well as important plan files, GitHub issues/PR links, and Linear ticket IDs. For each item, include why it matters and any relevant names, data, configs, or facts discussed.\n   - **Preserve identifiers verbatim** (plan filename/path, exact URL, issue/PR number, ticket ID); do not paraphrase or truncate.\n   - **Preserve referenced identifiers unless explicitly resolved**: Keep exact URLs/IDs from the conversation unless there is clear evidence they are no longer relevant.\n   - Do not omit details likely to be referenced later.\n\n4. **Errors and fixes**: List all errors that you ran into, and how you fixed them. Pay special attention to specific user feedback that you received and record verbatim if useful.\n\n5. **Current state**:Describe in detail precisely what is currently being worked on, paying special attention to the most recent messages from both user and assistant. Include file names and code snippets where applicable.\n\n6.**Optional Next Step**: List the next step that you will take that is related to the most recent work you were doing. IMPORTANT: ensure that this step is DIRECTLY in line with the user's most recent explicit requests and the most current task. If your last task was concluded, then only list next steps if they are explicitly in line with the users request. If there is a next step, include direct quotes from the most recent conversation showing exactly what task you were working on and where you left off.\n\n7. **Lookup hints**: For any detailed content (long lists, extensive data, specific conversations) that couldn't fit in the summary, note the topic and key terms that could be used to find it in message history later.\n\nWrite in first person as a factual record of what occurred. Be concise but thorough - the goal is to preserve enough context that the recent messages make sense and important information isn't lost to prevent duplicate work or repeated mistakes.\n\nKeep your summary under 500 words. Only output the summary.";
export declare const LOCAL_SLIDING_WINDOW_COMPACTION_PROMPT = "The following messages are being evicted from the BEGINNING of your context window. Write a detailed summary that captures what happened in these messages to appear BEFORE the remaining recent messages in context, providing background for what comes after. Include the following sections:\n\n1.**High level goals**: What is the high level goal and ongoing task? Capture the user's explicit requests and intent in detail. If there is an existing summary in the transcript, make sure to take it into consideration to continue tracking the higher level goals and long-term progress.\n\n2. **What happened**: The conversations, tasks, and exchanges that took place. What did the user ask for? What did you do? How did things progress? If there is a previous summary being evicted, please extract a concise version of the critical info from it.\n\n3. **Important details**: Enumerate specific files and code sections examined, modified, or created, as well as important plan files, GitHub issues/PR links, and Linear ticket IDs. For each item, include why it matters and any relevant names, data, configs, or facts discussed.\n   - **Preserve identifiers verbatim** (plan filename/path, exact URL, issue/PR number, ticket ID); do not paraphrase or truncate.\n   - **Preserve referenced identifiers unless explicitly resolved**: Keep exact URLs/IDs from the conversation unless there is clear evidence they are no longer relevant.\n   - Do not omit details likely to be referenced later.\n\n4. **Errors and fixes**: List all errors that you ran into, and how you fixed them. Pay special attention to specific user feedback that you received and record verbatim if useful.\n\n5. **Lookup hints**: For any detailed content (long lists, extensive data, specific conversations) that couldn't fit in the summary, note the topic and key terms that could be used to find it in message history later.\n\nWrite in first person as a factual record of what occurred. Be thorough and detailed - the goal is to preserve enough context that the recent messages make sense and important information isn't lost to prevent duplicate work or repeated mistakes.\n\nKeep your summary under 300 words. Only output the summary.";
export interface LocalCompactionStats {
    trigger?: string;
    context_tokens_before?: number;
    context_tokens_after?: number;
    context_window?: number;
    messages_count_before?: number;
    messages_count_after?: number;
}
export type LocalCompleteFunction = (model: Model<string>, context: Context, options?: SimpleStreamOptions & Record<string, unknown>) => Promise<AssistantMessage>;
export interface LocalAllCompactionInput {
    agent: LocalAgentRecord;
    messages: LocalMessage[];
    complete?: LocalCompleteFunction;
    prompt?: string | null;
    clipChars?: number | null;
    abortSignal?: AbortSignal;
    localProviderAuthStorageDir?: string;
    modelsRuntime?: LocalPiModelsRuntime;
}
export interface LocalSlidingWindowCompactionPlan {
    messagesToSummarize: LocalMessage[];
    messagesToKeep: LocalMessage[];
    cutoffIndex: number;
}
export interface LocalAllCompactionPlan {
    messagesToSummarize: LocalMessage[];
    messagesToKeep: LocalMessage[];
}
export declare function formatLocalMessagesForSummary(messages: LocalMessage[], options?: {
    truncationChars?: number;
    maxChars?: number;
}): string;
export declare function summarizeLocalMessagesAll(input: LocalAllCompactionInput): Promise<string>;
export declare function planLocalSlidingWindowCompaction(messages: LocalMessage[], options?: {
    slidingWindowPercentage?: number;
    contextWindow?: number;
}): LocalSlidingWindowCompactionPlan;
export declare function planLocalAllCompaction(messages: LocalMessage[]): LocalAllCompactionPlan;
export declare function summarizeLocalMessagesSlidingWindow(input: LocalAllCompactionInput): Promise<string>;
export declare function estimateLocalMessageTokens(messages: LocalMessage[]): number;
export declare function packageLocalSummaryMessage(summary: string, stats?: LocalCompactionStats, mode?: LocalCompactionMode): string;
//# sourceMappingURL=compaction.d.ts.map