export declare const SYSTEM_PROMPT: string;
export declare const SKILL_CREATOR_PROMPT: string;
export declare const REMEMBER_PROMPT: string;
export declare const APPROVAL_RECOVERY_PROMPT: string;
export declare const INTERRUPT_RECOVERY_ALERT: string;
export declare const MEMORY_PROMPTS: Record<string, string>;
export interface SystemPromptOption {
    id: string;
    label: string;
    description: string;
    content: string;
    memfsContent?: string;
    localMemfsContent?: string;
    isDefault?: boolean;
    isFeatured?: boolean;
}
export declare const SYSTEM_PROMPTS: SystemPromptOption[];
export type MemoryPromptMode = "standard" | "memfs" | "local-memfs";
export declare function getSystemPromptVariantContents(prompt: SystemPromptOption): string[];
/**
 * Check if a preset ID exists in SYSTEM_PROMPTS.
 */
export declare function isKnownPreset(id: string): boolean;
/**
 * Deterministic rebuild of a system prompt from a known preset + memory mode.
 * Throws on unknown preset (prevents stale/renamed presets from silently rewriting prompts).
 */
export declare function buildSystemPrompt(presetId: string, memoryMode: MemoryPromptMode): string;
/**
 * Returns true if the agent is not on the current default preset
 * and would benefit from switching to `/system default`.
 */
export declare function shouldRecommendDefaultPrompt(currentPrompt: string, memoryMode: MemoryPromptMode): boolean;
//# sourceMappingURL=prompt-assets.d.ts.map