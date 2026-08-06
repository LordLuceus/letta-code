/**
 * Backstop clamp for model-facing tool returns.
 *
 * Individual tools apply their own limits (see LIMITS in truncation.ts), but
 * several never bound the total size of the string they return: the Read
 * variants cap lines and chars-per-line only, Glob/LS/grep_files cap item
 * counts only, Memory/Skill return file bodies verbatim, and external/MCP and
 * mod tools can return arbitrarily large output. This module clamps any tool
 * return that slipped past those per-tool limits before it reaches the model,
 * writing the full content to an overflow file so nothing is lost.
 */
import type { ImageContent, TextContent } from "@letta-ai/letta-client/resources/agents/messages";
type ClampableToolReturn = string | Array<TextContent | ImageContent>;
/**
 * Bound the total size of a tool return. Strings are clamped directly;
 * multimodal arrays have each text block clamped while image blocks pass
 * through untouched.
 */
export declare function clampToolReturnContent(content: ClampableToolReturn, toolName: string): ClampableToolReturn;
export {};
//# sourceMappingURL=tool-return-clamp.d.ts.map