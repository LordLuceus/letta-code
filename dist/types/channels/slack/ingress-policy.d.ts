export interface SlackInboundMessageEventLike {
    channel?: unknown;
    user?: unknown;
    bot_id?: unknown;
    ts?: unknown;
    text?: unknown;
    thread_ts?: unknown;
    subtype?: unknown;
    hidden?: boolean;
    message?: unknown;
}
export interface SlackAppMentionEventLike {
    channel?: unknown;
    user?: unknown;
    bot_id?: unknown;
    ts?: unknown;
    text?: unknown;
    thread_ts?: unknown;
}
export interface ResolveSlackMessageIngressPolicyParams {
    message: SlackInboundMessageEventLike;
    botUserId?: string | null;
    isAgentThread?: boolean;
}
export interface ResolveSlackAppMentionIngressPolicyParams {
    event: SlackAppMentionEventLike;
}
export interface SlackMessageIngressAccepted {
    shouldRoute: true;
    channelId: string;
    senderId: string;
    senderUserId?: string;
    senderBotId?: string;
    messageId: string;
    threadId: string | null;
    chatType: "direct" | "channel";
    text: string;
    rawText: string;
    wasMentioned: boolean;
    effectiveMention: boolean;
    isAgentThread: boolean;
}
export interface SlackAppMentionIngressAccepted {
    shouldRoute: true;
    channelId: string;
    senderId: string;
    senderUserId?: string;
    senderBotId?: string;
    messageId: string;
    threadId: string;
    chatType: "channel";
    text: string;
    rawText: string;
    wasMentioned: true;
    effectiveMention: true;
    isAgentThread: false;
}
export type SlackIngressIgnoreReason = "missing_channel" | "missing_sender" | "missing_timestamp" | "hidden_message" | "ignored_subtype" | "wrapper_message" | "top_level_channel_message";
export interface SlackIngressIgnored {
    shouldRoute: false;
    reason: SlackIngressIgnoreReason;
}
export type SlackMessageIngressPolicy = SlackMessageIngressAccepted | SlackIngressIgnored;
export type SlackAppMentionIngressPolicy = SlackAppMentionIngressAccepted | SlackIngressIgnored;
export declare function isSlackMentionOnlyChannel(channelId: string, mentionOnlyChannels: readonly string[] | undefined): boolean;
export declare function isProcessableSlackInboundMessage(message: SlackInboundMessageEventLike): boolean;
export declare function shouldSkipSlackMessageByLastSeen(params: {
    lastSeenMessageTs?: string | null;
    messageTs: string;
}): boolean;
export declare function resolveSlackMessageIngressPolicy(params: ResolveSlackMessageIngressPolicyParams): SlackMessageIngressPolicy;
export declare function resolveSlackAppMentionIngressPolicy(params: ResolveSlackAppMentionIngressPolicyParams): SlackAppMentionIngressPolicy;
//# sourceMappingURL=ingress-policy.d.ts.map