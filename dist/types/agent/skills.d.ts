/**
 * Skills module - provides skill discovery and management functionality
 *
 * Skills are discovered from four sources (in order of priority):
 * 1. Project skills: .agents/skills/ in current directory, with .skills/ as a legacy fallback (highest priority - overrides)
 * 2. Agent skills: ~/.letta/agents/{agent-id}/memory/skills/ for agent-specific skills
 * 3. Global skills: ~/.letta/skills/ for user's personal skills
 * 4. Bundled skills: embedded in package (lowest priority - defaults)
 */
import { type SkillSource } from "./skill-sources";
export type { SkillSource } from "./skill-sources";
/**
 * Represents a skill that can be used by the agent
 */
export interface Skill {
    /** Unique identifier for the skill */
    id: string;
    /** Human-readable name of the skill */
    name: string;
    /** Description of what the skill does and when to use it */
    description: string;
    /** Optional additional trigger guidance from `when_to_use` frontmatter */
    whenToUse?: string;
    /** Hint shown in slash-command autocomplete */
    argumentHint?: string;
    /** If true, hide from model auto-invocation / Skill tool listings */
    disableModelInvocation?: boolean;
    /** If false, hide from slash-command user invocation */
    userInvocable?: boolean;
    /** Optional category for organizing skills */
    category?: string;
    /** Optional tags for filtering/searching skills */
    tags?: string[];
    /** Path to the skill file (empty for bundled skills) */
    path: string;
    /** Source of the skill */
    source: SkillSource;
    /** Raw content of the skill (for bundled skills) */
    content?: string;
}
/**
 * Represents the result of skill discovery
 */
export interface SkillDiscoveryResult {
    /** List of discovered skills */
    skills: Skill[];
    /** Any errors encountered during discovery */
    errors: SkillDiscoveryError[];
}
export interface SkillDiscoveryOptions {
    skipBundled?: boolean;
    sources?: SkillSource[];
}
/**
 * Represents an error that occurred during skill discovery
 */
export interface SkillDiscoveryError {
    /** Path where the error occurred */
    path: string;
    /** Error message */
    message: string;
}
export declare function compareSkills(a: Skill, b: Skill): number;
export declare function getFrontmatterString(frontmatter: Record<string, string | string[]>, key: string): string | undefined;
export declare function getFrontmatterStringList(frontmatter: Record<string, string | string[]>, key: string): string[] | undefined;
export declare function getFrontmatterBoolean(frontmatter: Record<string, string | string[]>, key: string): boolean | undefined;
export declare function isModelInvocableSkill(skill: Skill): boolean;
export declare function isUserInvocableSkill(skill: Skill): boolean;
export declare function isSkillAvailableForAgent(skill: Skill, agentId?: string): boolean;
/**
 * Canonical directory where project skills are stored.
 */
export declare const PROJECT_SKILLS_DIR: string;
/**
 * Legacy directory name where project skills were stored.
 */
export declare const SKILLS_DIR = ".skills";
/**
 * Global skills directory (in user's home directory)
 */
export declare const GLOBAL_SKILLS_DIR: string;
/**
 * Get the agent-scoped skills directory for a specific agent.
 * Primary path is ~/.letta/agents/{id}/memory/skills/ (memfs).
 */
export declare function getAgentSkillsDir(agentId: string): string;
/**
 * Parse a bundled skill from its embedded content
 */
/**
 * Get bundled skills by discovering from the bundled skills directory
 */
export declare function getBundledSkills(): Promise<Skill[]>;
/**
 * Discovers skills from all sources (bundled, global, agent, project)
 * Later sources override earlier ones with the same ID.
 *
 * Priority order (highest to lowest):
 * 1. Project skills (the provided project skills path; callers may scan .agents/skills before .skills)
 * 2. Agent skills (~/.letta/agents/{agent-id}/memory/skills/)
 * 3. Global skills (~/.letta/skills/)
 * 4. Bundled skills (embedded in package)
 *
 * @param projectSkillsPath - The project skills directory (default: .skills in current directory)
 * @param agentId - Optional agent ID for agent-scoped skills
 * @returns A result containing discovered skills and any errors
 */
export declare function discoverSkills(projectSkillsPath?: string, agentId?: string, options?: SkillDiscoveryOptions): Promise<SkillDiscoveryResult>;
/**
 * Format discovered skills as a system reminder for injection into conversation.
 * Returns empty string if no skills are available.
 *
 * Format: `- name (source): description` for each skill.
 */
export declare function formatSkillsAsSystemReminder(skills: Skill[]): string;
//# sourceMappingURL=skills.d.ts.map