import type { MessageChannelInput } from "./message-channel-types";
import type { ChannelMessageActionAdapter, ChannelMessageActionRoute, ChannelMessageActionTransport, ChannelResolvedMessageTarget } from "./plugin-types";
import type { ChannelTurnSource, SupportedChannelId } from "./types";
export interface MessageChannelExecutionScope {
    agentId: string;
    conversationId: string;
}
export interface ResolvedMessageChannelContext {
    route: ChannelMessageActionRoute;
    transport: ChannelMessageActionTransport;
    messageActions: ChannelMessageActionAdapter;
}
export interface ResolvedProactiveMessageChannelContext {
    accountId: string;
    target: ChannelResolvedMessageTarget;
    transport: ChannelMessageActionTransport;
    messageActions: ChannelMessageActionAdapter;
}
export interface MessageChannelExecutionResolver {
    isSupportedChannel(channel: string): boolean;
    resolveRoutedContext(params: {
        channel: SupportedChannelId;
        chatId: string;
        accountId?: string;
        scope: MessageChannelExecutionScope;
    }): Promise<ResolvedMessageChannelContext | string | null> | ResolvedMessageChannelContext | string | null;
    resolveProactiveContext?(params: {
        channel: SupportedChannelId;
        target: string;
        accountId?: string;
        scope: MessageChannelExecutionScope;
    }): Promise<ResolvedProactiveMessageChannelContext | string> | ResolvedProactiveMessageChannelContext | string;
}
export interface ExecuteMessageChannelOptions {
    scope: MessageChannelExecutionScope;
    resolver: MessageChannelExecutionResolver;
    channelTurnSources?: ChannelTurnSource[];
}
/**
 * Execute the canonical MessageChannel contract against host-owned routing and
 * transport adapters. This owns normalization, scope checks, thread/account
 * inference, action discovery, and outbound formatting without requiring the
 * local channel registry or local credentials.
 */
export declare function executeMessageChannel(input: MessageChannelInput | Record<string, unknown>, options: ExecuteMessageChannelOptions): Promise<string>;
//# sourceMappingURL=message-channel-executor.d.ts.map