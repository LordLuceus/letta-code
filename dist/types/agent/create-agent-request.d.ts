/**
 * Pure builder for the `POST /v1/agents` wire payload of a Letta Code agent.
 *
 * This is the shared creation-policy choke point for the CLI and external
 * harness surfaces. It owns the defaults that must not drift between callers:
 * agent type, prompt mode, tags, server tools, initial messages, parallel tool
 * calls, and compaction. Callers may supply either a Letta Code personality or
 * their own identity blocks without rebuilding that policy.
 *
 * Everything reachable from this module must stay free of Node/backend imports
 * so it can be bundled in the browser-safe `agent-presets` package export.
 */
import type { CreateBlock } from "@letta-ai/letta-client/resources/blocks/blocks";
import { type PersonalityId, type PersonalityMemoryBlock } from "./personality-presets";
import { type MemoryPromptMode } from "./prompt-assets";
/** Agent type used for all Letta Code agents. */
export declare const LETTA_CODE_AGENT_TYPE = "letta_v1_agent";
/**
 * Server-side tools attached to created agents. Client-side tools (Read,
 * Write, Bash, etc.) are passed via client_tools at runtime instead.
 */
export declare const DEFAULT_CREATED_AGENT_BASE_TOOLS: string[];
export type CreateAgentMemoryBlock = CreateBlock;
export interface BuildCreateAgentRequestOptions {
    personalityId?: PersonalityId;
    name?: string;
    description?: string;
    /** Model ID or handle. Personality default, then catalog default, applies. */
    model?: string;
    /** Complete prompt override. Otherwise the standard prompt for prompt mode. */
    system?: string;
    memoryPromptMode?: MemoryPromptMode;
    /**
     * Caller-defined identity. With a personality, matching labels replace its
     * blocks and new labels append after the personality blocks.
     */
    memoryBlocks?: CreateAgentMemoryBlock[];
    blockIds?: string[];
    /** Extra tags appended after canonical Letta Code and personality tags. */
    extraTags?: string[];
    enableMemfs?: boolean;
    isSubagent?: boolean;
    /** Exact server-side tools. Omission uses the Letta Code web-tool defaults. */
    baseTools?: string[];
    embedding?: string;
    hidden?: boolean;
    parallelToolCalls?: boolean;
    compactionModel?: string;
}
export interface CreateAgentRequest {
    agent_type: typeof LETTA_CODE_AGENT_TYPE;
    name?: string;
    description?: string;
    model: string;
    system: string;
    memory_blocks?: CreateAgentMemoryBlock[];
    block_ids?: string[];
    tags: string[];
    tools: string[];
    include_base_tools: false;
    include_base_tool_rules: false;
    initial_message_sequence: never[];
    parallel_tool_calls: boolean;
    compaction_settings: {
        model: string;
    };
    embedding?: string;
    hidden?: boolean;
}
export type CreateAgentRequestForPersonality = CreateAgentRequest & {
    name: string;
    description: string;
    memory_blocks: PersonalityMemoryBlock[];
};
/** Build the canonical Core create-agent request for a Letta Code agent. */
export declare function buildCreateAgentRequest(options?: BuildCreateAgentRequestOptions): Promise<CreateAgentRequest>;
/** Compatibility wrapper for callers that create a personality agent. */
export declare function buildCreateAgentRequestForPersonality(params: {
    personalityId: PersonalityId;
    name?: string;
    description?: string;
    model?: string;
    extraTags?: string[];
}): Promise<CreateAgentRequestForPersonality>;
//# sourceMappingURL=create-agent-request.d.ts.map