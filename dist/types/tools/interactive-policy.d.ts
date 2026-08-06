export type InteractiveApprovalKind = "ask_user_question";
/**
 * Tools that prompt the human for input mid-turn, as toolset names. Headless
 * clients (SDK sessions, automation) can exclude these from the turn's
 * toolset via `exclude_interactive_tools` on create_message payloads.
 */
export declare const INTERACTIVE_USER_INPUT_TOOL_NAMES: readonly ["AskUserQuestion"];
export declare function isInteractiveApprovalTool(toolName: string): boolean;
export declare function getInteractiveApprovalKind(toolName: string): InteractiveApprovalKind | null;
export declare function requiresRuntimeUserInput(toolName: string): boolean;
export declare function isHeadlessAutoAllowTool(toolName: string): boolean;
//# sourceMappingURL=interactive-policy.d.ts.map