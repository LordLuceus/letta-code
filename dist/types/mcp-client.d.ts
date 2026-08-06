import { type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
interface McpServerConfigBase {
    name: string;
}
export interface StdioMcpServerConfig extends McpServerConfigBase {
    transport?: "stdio";
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}
export interface HttpMcpServerConfig extends McpServerConfigBase {
    transport: "http";
    url: string;
    headers?: Record<string, string>;
}
export interface SseMcpServerConfig extends McpServerConfigBase {
    transport: "sse";
    url: string;
    headers?: Record<string, string>;
}
export type McpServerConfig = StdioMcpServerConfig | HttpMcpServerConfig | SseMcpServerConfig;
export interface McpToolDefinition {
    name: string;
    title?: string;
    description?: string;
    inputSchema: Record<string, unknown>;
}
export interface McpToolResult {
    content: unknown[];
    isError?: boolean;
    structuredContent?: Record<string, unknown>;
}
export interface ConnectedMcpServer {
    name: string;
    tools: McpToolDefinition[];
    callTool(name: string, args?: Record<string, unknown>, options?: {
        signal?: AbortSignal;
    }): Promise<McpToolResult>;
    close(): Promise<void>;
}
export interface McpOAuthConnection {
    authProvider: OAuthClientProvider;
    waitForAuthorizationCode?: () => Promise<string>;
    close(): Promise<void>;
}
export interface ConnectMcpServerOptions {
    clientInfo?: {
        name: string;
        version: string;
    };
    stderr?: "inherit" | "pipe";
    oauth?: McpOAuthConnection;
}
/**
 * Connect to an MCP server from the client process and expose its tools through
 * a small transport-neutral interface suitable for SDK and channel adapters.
 */
export declare function connectMcpServer(config: McpServerConfig, options?: ConnectMcpServerOptions): Promise<ConnectedMcpServer>;
/** Start a stdio MCP server on the client machine. */
export declare function connectStdioMcpServer(config: StdioMcpServerConfig, options?: ConnectMcpServerOptions): Promise<ConnectedMcpServer>;
export {};
//# sourceMappingURL=mcp-client.d.ts.map