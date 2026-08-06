/**
 * Tool filter manager to control which tools are enabled for the session.
 * Set via CLI --tools flag.
 */
declare class ToolFilterManager {
    private enabledTools;
    /**
     * Set which tools are enabled for this session
     * @param toolsString - Comma-separated list of tool names, or empty string for no tools
     */
    setEnabledTools(toolsString: string): void;
    /**
     * Check if a tool is enabled
     * @param toolName - Name of the tool to check
     * @returns true if the tool should be loaded, false otherwise
     */
    isEnabled(toolName: string): boolean;
    /**
     * Get list of enabled tools (null means all tools)
     */
    getEnabledTools(): string[] | null;
    /**
     * Check if filter is active (i.e., not all tools enabled)
     */
    isActive(): boolean;
    /**
     * Reset to default (all tools enabled)
     */
    reset(): void;
}
export declare const toolFilter: ToolFilterManager;
export {};
//# sourceMappingURL=filter.d.ts.map