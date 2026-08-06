export declare const LETTA_CHAT_API_KEYS_URL = "https://chat.letta.com/preferences/api-keys";
export declare function isLocalAgentId(agentId: string): boolean;
/**
 * Build a chat URL for an agent, with optional conversation and extra query params.
 */
export declare function buildChatUrl(agentId: string, options?: {
    conversationId?: string;
    view?: string;
    deviceId?: string;
}): string;
/**
 * Build a user-facing agent reference. API-backed agents can link to Chat,
 * but local-backend agents are not available there, so show the ID.
 */
export declare function buildAgentReference(agentId: string, options?: Parameters<typeof buildChatUrl>[1]): string;
/**
 * Build an OSC8 terminal hyperlink for API-backed agents, or plain text for
 * local-backend agents that do not exist in the web app.
 */
export declare function buildAgentTerminalLink(agentId: string, options?: Parameters<typeof buildChatUrl>[1], label?: string): string;
/**
 * Build a URL for a Chat preference or other non-agent Chat page.
 */
export declare function buildChatWebUrl(path: string): string;
/**
 * Build a URL for developer and management pages on Letta Platform.
 */
export declare function buildPlatformUrl(path: string): string;
//# sourceMappingURL=app-urls.d.ts.map