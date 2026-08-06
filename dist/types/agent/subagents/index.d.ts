/**
 * Subagent configuration, discovery, and management
 *
 * Built-in subagents are bundled with the package.
 * Users can also define custom subagents as Markdown files with YAML frontmatter
 * in the .letta/agents/ directory.
 */
/**
 * Subagent configuration
 */
export type SubagentLaunchProfile = "default" | "memory-subagent";
export type SubagentRecommendedModelSource = "builtin" | "user";
/** Exact memory scope handed to a harness-created memory worktree. */
export interface SubagentMemoryScope {
    primaryRoot: string | null;
    writableRoots: string[];
    readonlyRoots?: string[];
}
/**
 * Subagent execution result
 */
export interface SubagentResult {
    agentId: string;
    conversationId?: string;
    model?: string;
    report: string;
    success: boolean;
    error?: string;
    totalTokens?: number;
    stepCount?: number;
    durationMs?: number;
}
export interface SubagentConfig {
    /** Unique identifier for the subagent */
    name: string;
    /** Description of when to use this subagent */
    description: string;
    /** System prompt for the subagent */
    systemPrompt: string;
    /** Allowed tools - specific list or "all" (invalid names are ignored at runtime) */
    allowedTools: string[] | "all";
    /** Recommended model - any model ID from models.json or full handle */
    recommendedModel: string;
    /** Whether the recommended model came from bundled defaults or user config. */
    recommendedModelSource?: SubagentRecommendedModelSource;
    /** Skills to auto-load */
    skills: string[];
    /** Whether this subagent should fork the parent conversation before launch. */
    fork: boolean;
    /** Whether this subagent should run in the background by default. */
    background: boolean;
    /** Filesystem and env launch behavior for this subagent. */
    launchProfile: SubagentLaunchProfile;
}
/**
 * Result of subagent discovery
 */
export interface SubagentDiscoveryResult {
    subagents: SubagentConfig[];
    errors: Array<{
        path: string;
        message: string;
    }>;
}
/**
 * Directory for subagent files (relative to project root)
 */
export declare const AGENTS_DIR = ".letta/agents";
export declare const GLOBAL_AGENTS_DIR: string;
/**
 * Get the names of built-in subagents
 */
export declare function getBuiltinSubagentNames(): Set<string>;
/**
 * Discover subagents from global (~/.letta/agents) and project (.letta/agents) directories
 * Project-level subagents override global ones with the same name
 */
export declare function discoverSubagents(workingDirectory?: string, inheritedConfigs?: Record<string, SubagentConfig>): Promise<SubagentDiscoveryResult>;
/**
 * Get all subagent configurations
 * Includes built-in subagents and any user-defined ones from .letta/agents/
 * User-defined subagents override built-ins with the same name
 * Results are cached per working directory
 */
export declare function getAllSubagentConfigs(workingDirectory?: string): Promise<Record<string, SubagentConfig>>;
/**
 * Clear the subagent config cache (useful when files change)
 */
export declare function clearSubagentConfigCache(): void;
//# sourceMappingURL=index.d.ts.map