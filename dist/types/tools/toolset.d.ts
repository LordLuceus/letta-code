import type { AgentState } from "@letta-ai/letta-client/resources/agents/agents";
import type { SkillSource } from "../agent/skill-sources";
import type { ModEvents } from "../mods/event-emitter";
import type { ModAdapter } from "../mods/mod-adapter";
import type { ModContext } from "../mods/types";
import type { RuntimeContextSnapshot } from "../runtime-context";
import { type PreparedToolExecutionContext } from "./manager";
import type { PermissionModeState } from "./permission-mode-state";
import { type ToolName } from "./tool-definitions";
export declare const MEMORY_TOOL_NAMES: Set<string>;
export type ToolsetName = "codex" | "codex_snake" | "default" | "gemini" | "gemini_snake" | "none";
export type ToolsetPreference = ToolsetName | "auto";
export interface ClientToolsetConfig {
    /** Request-scoped base toolset. Omitted preserves the runtime preference. */
    base?: ToolsetPreference;
    /** Additional bundled client tools to load before applying the allowlist. */
    include?: string[];
}
export declare function deriveToolsetFromModel(modelIdentifier: string, providerType?: string | null): "codex" | "default";
export type PreparedScopeToolContext = {
    preparedToolContext: PreparedToolExecutionContext;
    toolset: ToolsetName;
    toolsetPreference: ToolsetPreference;
    effectiveModel: string | null;
    agent: AgentState | null;
};
export declare function prepareToolExecutionContextForResolvedTarget(params: {
    modelIdentifier?: string | null;
    providerType?: string | null;
    conversationId?: string | null;
    toolsetPreference: ToolsetPreference;
    clientToolset?: ClientToolsetConfig;
    exclude?: ToolName[];
    clientToolAllowlist?: string[];
    externalToolScopeIds?: string[];
    workingDirectory?: string;
    permissionModeState?: PermissionModeState;
    modContext?: ModContext;
    modEvents?: ModEvents;
    modAdapters?: ModAdapter[];
    runtimeContext?: Partial<RuntimeContextSnapshot>;
    agent?: AgentState | null;
}): Promise<PreparedScopeToolContext>;
export declare function prepareToolExecutionContextForScope(params: {
    connectionId?: string;
    environmentDeviceId?: string;
    agentId: string;
    conversationId?: string | null;
    overrideModel?: string | null;
    overrideProviderType?: string | null;
    cachedEffectiveModel?: string | null;
    exclude?: ToolName[];
    clientToolset?: ClientToolsetConfig;
    clientToolAllowlist?: string[];
    externalToolScopeIds?: string[];
    workingDirectory?: string;
    permissionModeState?: PermissionModeState;
    skillSources?: SkillSource[];
    cachedAgent?: AgentState | null;
    modContext?: ModContext;
    modEvents?: ModEvents;
    modAdapters?: ModAdapter[];
}): Promise<PreparedScopeToolContext>;
/**
 * Ensures the server-side memory tool is attached to the agent.
 * Client toolsets may use memory_apply_patch, but server-side base memory tool remains memory.
 *
 * This is a server-side tool swap - client tools are passed via client_tools per-request.
 *
 * @param agentId - The agent ID to update
 * @param modelIdentifier - Model handle (kept for API compatibility)
 * @param useMemoryPatch - Unused compatibility parameter
 */
export declare function ensureCorrectMemoryTool(agentId: string, modelIdentifier: string, useMemoryPatch?: boolean): Promise<void>;
/**
 * Detach all memory tools from an agent.
 * Used when enabling memfs (filesystem-backed memory).
 *
 * @param agentId - Agent to detach memory tools from
 * @returns true if any tools were detached
 */
export declare function detachMemoryTools(agentId: string): Promise<boolean>;
type PersistedToolRule = NonNullable<AgentState["tool_rules"]>[number];
interface AgentWithToolsAndRules {
    tags?: string[] | null;
    tool_rules?: PersistedToolRule[];
}
export declare function shouldClearPersistedToolRules(agent: AgentWithToolsAndRules): boolean;
export declare function clearPersistedClientToolRules(agentId: string, cachedAgent?: AgentState | null): Promise<{
    removedToolNames: string[];
} | null>;
/**
 * Force switch to a specific toolset regardless of model.
 *
 * @param toolsetName - The toolset to switch to
 * @param agentId - Agent to relink tools to
 */
export declare function forceToolsetSwitch(toolsetName: ToolsetName, agentId: string): Promise<void>;
/**
 * Switches the loaded toolset based on the target model identifier,
 * and ensures the correct memory tool is attached to the agent.
 *
 * @param modelIdentifier - The model handle/id
 * @param agentId - Agent to relink tools to
 * @param onNotice - Optional callback to emit a transcript notice
 */
export declare function switchToolsetForModel(modelIdentifier: string, agentId: string, providerType?: string | null): Promise<ToolsetName>;
export {};
//# sourceMappingURL=toolset.d.ts.map